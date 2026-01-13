/**
 * OpenAI 兼容接口的图片生成实现
 * 使用官方 OpenAI SDK
 */

import OpenAI from 'openai';
import { NanoBananaEditor, GenerateOptions, GeneratedImage } from './interface';
import { CanonicalJSON } from '../../types';

/** OpenAI 图片生成器配置 */
export interface OpenAINanoBananaConfig {
  apiKey: string;
  apiBase: string;
  model: string;
  timeout?: number;
  maxRetries?: number;
}

/** OpenAI 图片生成器实现 */
export class OpenAINanoBananaEditor implements NanoBananaEditor {
  private client: OpenAI;
  private model: string;

  constructor(config: OpenAINanoBananaConfig) {
    this.model = config.model;
    
    // 处理 baseURL：移除末尾斜杠，确保格式正确
    let baseURL = config.apiBase.replace(/\/+$/, '');
    // 如果不包含 /v1，则添加
    if (!baseURL.endsWith('/v1')) {
      baseURL = `${baseURL}/v1`;
    }
    
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL,
      timeout: config.timeout ?? 120000,
      maxRetries: config.maxRetries ?? 3,
    });
  }

  /**
   * 根据 JSON 描述生成候选图片
   */
  async generate(
    baseImage: Buffer,
    jsonContent: CanonicalJSON,
    options: GenerateOptions
  ): Promise<GeneratedImage[]> {
    // 验证 count 范围
    if (options.count < 1 || options.count > 8) {
      throw new Error('count 必须在 1-8 范围内');
    }

    const results: GeneratedImage[] = [];

    // 构建图片编辑提示词
    const prompt = this.buildPrompt(jsonContent);
    const base64Image = baseImage.toString('base64');
    const mimeType = this.detectMimeType(baseImage);

    // 并行生成多张图片
    const generatePromises = Array.from({ length: options.count }, (_, index) =>
      this.generateSingleImage(base64Image, mimeType, prompt, options.seed, index)
    );

    const generatedResults = await Promise.all(generatePromises);

    for (const result of generatedResults) {
      if (result) {
        results.push(result);
      }
    }

    if (results.length === 0) {
      throw new Error('图片生成失败：未能生成任何有效图片');
    }

    return results;
  }

  /**
   * 生成单张图片
   */
  private async generateSingleImage(
    base64Image: string,
    mimeType: string,
    prompt: string,
    seed: number | undefined,
    index: number
  ): Promise<GeneratedImage | null> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
        max_tokens: 4096,
        ...(seed !== undefined && { seed: seed + index }),
      });

      // 从响应中提取图片
      const imageBuffer = this.extractImageFromResponse(response);

      if (imageBuffer) {
        return {
          buffer: imageBuffer,
          index,
        };
      }

      return null;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`图片生成失败 (索引: ${index}): ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 从 OpenAI 响应中提取图片
   */
  private extractImageFromResponse(response: OpenAI.Chat.Completions.ChatCompletion): Buffer | null {
    if (!response.choices || response.choices.length === 0) {
      return null;
    }

    const content = response.choices[0].message.content;
    if (!content) {
      return null;
    }

    // 尝试从 markdown 图片格式提取 base64
    // 格式: ![...](data:image/...;base64,...)
    const markdownMatch = content.match(
      /!\[.*?\]\(data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)\)/
    );
    if (markdownMatch) {
      return Buffer.from(markdownMatch[1], 'base64');
    }

    // 尝试直接匹配 base64 数据 URL
    const dataUrlMatch = content.match(
      /data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/
    );
    if (dataUrlMatch) {
      return Buffer.from(dataUrlMatch[1], 'base64');
    }

    // 尝试匹配纯 base64 字符串（至少 100 字符的连续 base64）
    const base64Match = content.match(/([A-Za-z0-9+/=]{100,})/);
    if (base64Match) {
      try {
        const buffer = Buffer.from(base64Match[1], 'base64');
        // 验证是否为有效图片（检查 magic bytes）
        if (this.isValidImageBuffer(buffer)) {
          return buffer;
        }
      } catch {
        // 忽略解析错误
      }
    }

    return null;
  }

  /**
   * 检测图片 MIME 类型
   */
  private detectMimeType(buffer: Buffer): string {
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return 'image/png';
    }
    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }
    // GIF: 47 49 46
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return 'image/gif';
    }
    // WebP: 52 49 46 46 ... 57 45 42 50
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      return 'image/webp';
    }
    // 默认返回 PNG
    return 'image/png';
  }

  /**
   * 验证 buffer 是否为有效图片
   */
  private isValidImageBuffer(buffer: Buffer): boolean {
    if (buffer.length < 8) return false;

    // 检查常见图片格式的 magic bytes
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isGif = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
    const isWebp = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;

    return isPng || isJpeg || isGif || isWebp;
  }

  /**
   * 根据 CanonicalJSON 构建图片编辑提示词
   */
  private buildPrompt(jsonContent: CanonicalJSON): string {
    const { scene, elements, edit_intent } = jsonContent;

    // 构建场景描述
    const sceneDesc = [
      `场景: ${scene.summary}`,
      `风格: ${scene.style.genre}, ${scene.style.palette}, ${scene.style.rendering}`,
      `镜头: ${scene.camera.shot}, ${scene.camera.lens}, ${scene.camera.angle}`,
      `光照: ${scene.lighting.type}, ${scene.lighting.direction}`,
    ].join('\n');

    // 构建元素描述
    const elementsDesc = elements
      .map((el) => `- ${el.name}: ${el.description} (${el.appearance.material}, ${el.appearance.color})`)
      .join('\n');

    // 构建编辑意图
    const intentDesc = [
      `目标: ${edit_intent.goal}`,
      edit_intent.negatives.length > 0 ? `避免: ${edit_intent.negatives.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    return `请根据以下描述编辑这张图片，生成一张新的图片：

${sceneDesc}

元素:
${elementsDesc}

${intentDesc}

请直接输出编辑后的图片，以 base64 格式返回。`;
  }
}

/** 创建 OpenAI 图片生成器实例 */
export function createOpenAINanoBananaEditor(config: OpenAINanoBananaConfig): NanoBananaEditor {
  return new OpenAINanoBananaEditor(config);
}
