/**
 * TextToImage Provider 统一导出
 */

export * from './interface';
export * from './mock';
export * from './openai';

import { TextToImageGenerator } from './interface';
import { createMockTextToImageGenerator } from './mock';
import { createOpenAITextToImageGenerator, OpenAITextToImageConfig } from './openai';

/** 文字生成图片提供者类型 */
export type TextToImageProviderType = 'mock' | 'openai';

/** TextToImageGenerator 工厂配置 */
export interface TextToImageGeneratorFactoryConfig {
  provider?: TextToImageProviderType;
  apiKey?: string;
  apiBase?: string;
  model?: string;
}

/**
 * 创建 TextToImageGenerator 实例
 * 根据配置返回 Mock 或 OpenAI 实现
 */
export function createTextToImageGenerator(
  config: TextToImageGeneratorFactoryConfig = {}
): TextToImageGenerator {
  const provider = config.provider ?? (process.env.TEXT_TO_IMAGE_PROVIDER as TextToImageProviderType) ?? 'mock';

  // 使用 Mock 实现
  if (provider === 'mock') {
    return createMockTextToImageGenerator();
  }

  // 使用 OpenAI DALL-E
  if (provider === 'openai') {
    const apiKey = config.apiKey ?? process.env.OPENAI_API_KEY;
    const apiBase = config.apiBase ?? process.env.OPENAI_API_BASE;
    const model = config.model ?? process.env.TEXT_TO_IMAGE_MODEL ?? 'dall-e-3';

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY 环境变量未设置');
    }

    const openaiConfig: OpenAITextToImageConfig = {
      apiKey,
      apiBase,
      model,
    };

    return createOpenAITextToImageGenerator(openaiConfig);
  }

  throw new Error(`不支持的文字生成图片提供者: ${provider}`);
}
