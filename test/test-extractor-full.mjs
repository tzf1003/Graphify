/**
 * 测试完整的 Extractor 流程
 * 模拟实际上传场景，使用完整的 JSON 提取 prompt
 */

import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
const MODEL = process.env.OPENAI_EXTRACTOR_MODEL || 'gpt-4o';
const TIMEOUT = 120000; // 2分钟

// 完整的 JSON 提取 prompt（与 openai.ts 中相同）
function buildExtractionPrompt(outputLanguage) {
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
    "summary": "<brief description of the scene>",
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
      "type": "<element type: subject, object, text, background, effect>",
      "name": "<element name in English>",
      "description": "<element description in ${outputLanguage}>",
      "geometry": {
        "bbox": [x, y, width, height],
        "polygon": [[x1,y1], [x2,y2], ...],
        "depth_hint": <0.0 to 1.0, where 1.0 is furthest>
      },
      "appearance": {
        "material": "<material type>",
        "color": "<dominant color as hex>",
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
      "type": "<relation: occludes, attached_to, in_front_of, part_of>"
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

Important:
1. Analyze the actual image content carefully
2. Identify all significant visual elements
3. Estimate reasonable bounding boxes based on image composition
4. Return ONLY valid JSON, no markdown code blocks or explanations`;
}

async function testFullExtraction() {
  console.log('=== 完整 Extractor 流程测试 ===\n');
  console.log(`API Base URL: ${BASE_URL}`);
  console.log(`Model: ${MODEL}`);
  console.log(`Timeout: ${TIMEOUT}ms\n`);

  // 查找测试图片
  const uploadsDir = path.join(__dirname, '../data/uploads');
  let testImagePath = null;
  
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    const imageFile = files.find(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
    if (imageFile) {
      testImagePath = path.join(uploadsDir, imageFile);
    }
  }

  if (!testImagePath) {
    console.log('未找到测试图片，使用小型测试图片...');
    // 使用一个简单的红色方块图片
    const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQzwAEjDAGNzYAAIoaB/5rSwaMAAAAAElFTkSuQmCC';
    await testWithBase64(tinyPngBase64, '小型测试图片');
  } else {
    console.log(`使用测试图片: ${testImagePath}`);
    const imageBuffer = fs.readFileSync(testImagePath);
    const base64Image = imageBuffer.toString('base64');
    const fileSizeMB = (imageBuffer.length / 1024 / 1024).toFixed(2);
    console.log(`图片大小: ${fileSizeMB}MB\n`);
    await testWithBase64(base64Image, testImagePath);
  }
}

async function testWithBase64(base64Image, imageName) {
  const prompt = buildExtractionPrompt('zh-CN');
  
  const requestBody = {
    model: MODEL,
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
  };

  console.log(`--- 测试: ${imageName} ---`);
  console.log(`请求体大小: ${(JSON.stringify(requestBody).length / 1024).toFixed(2)}KB`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log(`\n⚠️ 即将超时 (${TIMEOUT}ms)...`);
    controller.abort();
  }, TIMEOUT);

  const startTime = Date.now();
  
  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API 错误 (${response.status}): ${errorText}`);
      console.log(`耗时: ${elapsed}ms\n`);
      return;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log(`✅ 请求成功`);
    console.log(`耗时: ${elapsed}ms`);
    
    if (content) {
      // 尝试解析 JSON
      try {
        let jsonContent = content;
        // 尝试从 markdown 代码块中提取
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1].trim();
        }
        const parsed = JSON.parse(jsonContent);
        console.log(`✅ JSON 解析成功`);
        console.log(`元素数量: ${parsed.elements?.length || 0}`);
        console.log(`场景摘要: ${parsed.scene?.summary?.slice(0, 100) || 'N/A'}...`);
      } catch (e) {
        console.log(`⚠️ JSON 解析失败: ${e.message}`);
        console.log(`原始响应前500字符: ${content.slice(0, 500)}`);
      }
    }
    
    console.log('');
  } catch (error) {
    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;
    
    if (error.name === 'AbortError') {
      console.error(`❌ 请求超时 (${elapsed}ms)`);
      console.log('\n可能的原因:');
      console.log('1. 图片太大，处理时间过长');
      console.log('2. API 服务响应慢');
      console.log('3. 网络问题');
      console.log('\n建议:');
      console.log('1. 增加超时时间 (当前: 120秒)');
      console.log('2. 压缩上传的图片');
      console.log('3. 使用更快的 API 端点');
    } else {
      console.error(`❌ 请求失败: ${error.message}`);
    }
  }
}

testFullExtraction().catch(console.error);
