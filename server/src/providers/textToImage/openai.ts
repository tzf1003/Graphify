/**
 * OpenAI DALL-E 文字生成图片实现
 */

import OpenAI from 'openai';
import { TextToImageGenerator, TextToImageOptions, TextToImageResult } from './interface';

/** OpenAI 文字生成图片配置 */
export interface OpenAITextToImageConfig {
  apiKey: string;
  apiBase?: string;
  model?: string;
  timeout?: number;
}

/** OpenAI 文字生成图片实现 */
export class OpenAITextToImageGenerator implements TextToImageGenerator {
  private client: OpenAI;
  private model: string;

  constructor(config: OpenAITextToImageConfig) {
    this.model = config.model || 'dall-e-3';
    
    let baseURL = config.apiBase?.replace(/\/+$/, '');
    if (baseURL && !baseURL.endsWith('/v1')) {
      baseURL = `${baseURL}/v1`;
    }
    
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: baseURL || undefined,
      timeout: config.timeout ?? 120000,
    });
  }

  /**
   * 根据文字描述生成图片
   */
  async generate(
    prompt: string,
    options?: TextToImageOptions
  ): Promise<TextToImageResult> {
    const width = options?.width || 1024;
    const height = options?.height || 1024;
    
    // 确定尺寸（DALL-E 3 支持的尺寸）
    const size = this.determineSize(width, height);

    try {
      const response = await this.client.images.generate({
        model: this.model,
        prompt: prompt,
        n: 1,
        size: size,
        response_format: 'b64_json',
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('图片生成失败：未返回图片数据');
      }

      const imageData = response.data[0];
      if (!imageData.b64_json) {
        throw new Error('图片生成失败：未返回 base64 数据');
      }

      const buffer = Buffer.from(imageData.b64_json, 'base64');
      const dimensions = this.parseSizeDimensions(size);

      return {
        buffer,
        mimeType: 'image/png',
        width: dimensions.width,
        height: dimensions.height,
      };
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new Error(`图片生成失败: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 确定DALL-E支持的尺寸
   */
  private determineSize(width: number, height: number): '1024x1024' | '1792x1024' | '1024x1792' {
    const ratio = width / height;
    
    if (ratio > 1.5) {
      return '1792x1024'; // 横向
    } else if (ratio < 0.67) {
      return '1024x1792'; // 纵向
    }
    return '1024x1024'; // 正方形
  }

  /**
   * 解析尺寸字符串
   */
  private parseSizeDimensions(size: string): { width: number; height: number } {
    const [w, h] = size.split('x').map(Number);
    return { width: w, height: h };
  }
}

/** 创建 OpenAI 文字生成图片实例 */
export function createOpenAITextToImageGenerator(config: OpenAITextToImageConfig): TextToImageGenerator {
  return new OpenAITextToImageGenerator(config);
}
