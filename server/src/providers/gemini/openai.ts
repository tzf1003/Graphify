/**
 * OpenAI 兼容 API 的 GeminiExtractor 实现
 * 使用官方 OpenAI SDK
 */

import OpenAI from 'openai';
import { GeminiExtractor, ExtractResult } from './interface';
import { CanonicalJSON } from '../../types';

/** OpenAI 兼容 Extractor 配置 */
export interface OpenAIExtractorConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
  /** 最大重试次数，默认 3 */
  maxRetries?: number;
}

/** 构建提取 JSON 的 prompt */
function buildExtractionPrompt(outputLanguage: string): string {
  return `You are an image analysis expert. Analyze the provided image and extract a structured JSON description.

Output language for text values: ${outputLanguage}
JSON keys must always be in English.

Return a JSON object with this exact structure:
{
  "meta": {
    "schema_version": "1.0.0",
    "output_language": "${outputLanguage}",
    "width": <image width in pixels>,
    "height": <image height in pixels>
  },
  "scene": {
    "summary": "<brief description of the overall scene composition>",
    "style": {
      "genre": "<art style: landscape, portrait, abstract, etc>",
      "palette": "<color palette: natural, vibrant, muted, etc>",
      "rendering": "<rendering style: photorealistic, cartoon, sketch, etc>"
    },
    "camera": {
      "shot": "<shot type: wide, medium, close-up>",
      "lens": "<lens type: 24mm, 50mm, 85mm, etc>",
      "angle": "<camera angle: eye-level, low, high, bird-eye>",
      "dof": "<depth of field: shallow, medium, deep>"
    },
    "lighting": {
      "type": "<lighting type: natural, studio, dramatic, etc>",
      "direction": "<light direction: front, back, side, etc>",
      "contrast": "<contrast level: low, medium, high>"
    }
  },
  "elements": [
    {
      "id": "<unique element id like elem_001>",
      "type": "<element type: subject | object | text | background | effect>",
      "name": "<short element name, 2-4 words>",
      "description": "<SELF-CONTAINED description of THIS element ONLY>",
      "geometry": {
        "bbox": [x1, y1, x2, y2],
        "polygon": [[x1,y1], [x2,y2], ...],
        "depth_hint": <0.0 to 1.0, where 1.0 is furthest>
      },
      "appearance": {
        "material": "<material type>",
        "color": "<dominant color as hex like #FF5733>",
        "texture": "<texture description>"
      },
      "constraints": {
        "keep_identity": <true if element identity should be preserved>,
        "preserve_text_legibility": <true if text should remain readable>
      }
    }
  ],
  "relations": [
    {
      "from": "<element id>",
      "to": "<element id>",
      "type": "<relation: occludes | attached_to | in_front_of | part_of>"
    }
  ],
  "edit_intent": {
    "goal": "<suggested editing goal>",
    "negatives": ["<things to avoid>"],
    "safety": {
      "avoid": ["<unsafe content to avoid>"]
    }
  }
}

CRITICAL RULES for element description (MOST IMPORTANT):
1. Each element's "description" MUST ONLY describe that element itself
2. NEVER reference other elements in a description
3. NEVER mention what the element is wearing, holding, or attached to - use relations instead
4. Focus on: shape, color, size, material, texture, style of THIS element only
5. BAD example: "A squirrel wearing blue hoodie and VR glasses" (references other elements)
6. GOOD example for squirrel body: "Orange-furred cartoon squirrel with white belly, standing upright with arms raised"
7. GOOD example for hoodie: "Blue pixel-art style hoodie with front pocket and drawstrings"
8. GOOD example for glasses: "Green VR headset with rectangular lens and elastic strap"
9. Use "relations" array to express how elements connect to each other

CRITICAL RULES for element extraction:
1. Extract each visually distinct item as a SEPARATE element
2. For characters: extract body/figure as one element, each accessory (glasses, hat, clothing) as separate elements
3. For objects: if an object has distinct parts that could be edited independently, extract them separately
4. Aim for 5-15 elements to capture sufficient detail for editing
5. Each element should be independently editable without affecting other elements' descriptions

CRITICAL RULES for bbox and polygon coordinates:
1. All coordinates MUST be normalized to [0, 1] range (relative to image dimensions)
2. bbox format is [x1, y1, x2, y2] where:
   - x1, y1 = top-left corner (normalized, 0-1)
   - x2, y2 = bottom-right corner (normalized, 0-1)
   - x2 must be >= x1, y2 must be >= y1
3. polygon points are also normalized [0, 1] coordinates

CRITICAL RULES for element types:
- "subject": main subject/person/character body (NOT their accessories)
- "object": objects, items, props, clothing, accessories
- "text": any text or typography
- "background": background elements, scenery
- "effect": visual effects, particles, lighting effects

CRITICAL RULES for relation types (use these to connect elements):
- "attached_to": element A is worn by / attached to element B (e.g., glasses attached_to face)
- "part_of": element A is a component of element B
- "in_front_of": element A is in front of element B (depth ordering)
- "occludes": element A blocks/covers element B

Important:
1. Analyze the actual image content carefully
2. Extract ALL visually distinct elements that could be edited independently
3. Keep descriptions SELF-CONTAINED - no cross-references between elements
4. Use relations to express spatial and logical relationships
5. Return ONLY valid JSON, no markdown code blocks or explanations`;
}

/** 解析 API 响应中的 JSON */
function parseJsonFromResponse(content: string): CanonicalJSON {
  // 尝试直接解析
  try {
    return JSON.parse(content);
  } catch {
    // 尝试从 markdown 代码块中提取
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    
    // 尝试找到 JSON 对象的开始和结束
    const startIdx = content.indexOf('{');
    const endIdx = content.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      return JSON.parse(content.slice(startIdx, endIdx + 1));
    }
    
    throw new Error('无法从响应中解析 JSON');
  }
}

/** OpenAI 兼容 API 的 Extractor 实现 */
export class OpenAIExtractor implements GeminiExtractor {
  private client: OpenAI;
  private model: string;

  constructor(config: OpenAIExtractorConfig) {
    this.model = config.model ?? 'gpt-4o';
    
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl ?? 'https://api.openai.com/v1',
      timeout: config.timeout ?? 120000,
      maxRetries: config.maxRetries ?? 3,
    });
  }

  async extract(imageBuffer: Buffer, outputLanguage: string): Promise<ExtractResult> {
    const base64Image = imageBuffer.toString('base64');
    const prompt = buildExtractionPrompt(outputLanguage);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('OpenAI API 返回空响应');
    }

    const json = parseJsonFromResponse(content);

    return {
      json,
      rawResponse: response,
    };
  }
}

/** 创建 OpenAI 兼容 Extractor 实例 */
export function createOpenAIExtractor(config: OpenAIExtractorConfig): GeminiExtractor {
  return new OpenAIExtractor(config);
}
