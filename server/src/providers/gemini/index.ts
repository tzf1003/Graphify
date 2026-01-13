/**
 * GeminiExtractor 模块导出
 * 
 * 支持三种模式：
 * - mock: 返回固定 JSON，用于开发测试
 * - gemini: 使用 Google Gemini API
 * - openai: 使用 OpenAI 兼容 API（支持 GPT-4o、Azure OpenAI 等）
 * 
 * 通过 EXTRACTOR_PROVIDER 环境变量控制：mock | gemini | openai
 */

export * from './interface';
export * from './mock';
export * from './real';
export * from './openai';

import { GeminiExtractor } from './interface';
import { createMockGeminiExtractor } from './mock';
import { createRealGeminiExtractor, RealGeminiExtractorConfig } from './real';
import { createOpenAIExtractor, OpenAIExtractorConfig } from './openai';

/** Extractor Provider 类型 */
export type ExtractorProviderType = 'mock' | 'gemini' | 'openai';

/** GeminiExtractor 工厂配置 */
export interface GeminiExtractorFactoryConfig {
  /** @deprecated 使用 provider 替代 */
  useMock?: boolean;
  provider?: ExtractorProviderType;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
}

/**
 * 创建 GeminiExtractor 实例
 * 根据配置返回 Mock、Gemini 或 OpenAI 实现
 * 
 * 环境变量：
 * - EXTRACTOR_PROVIDER: mock | gemini | openai（默认 mock）
 * - GEMINI_API_KEY: Gemini API Key（provider=gemini 时必需）
 * - OPENAI_API_KEY: OpenAI API Key（provider=openai 时必需）
 * - OPENAI_API_BASE: OpenAI API Base URL（可选）
 * - OPENAI_EXTRACTOR_MODEL: 用于提取的模型（可选，默认 gpt-4o）
 */
export function createGeminiExtractor(config: GeminiExtractorFactoryConfig = {}): GeminiExtractor {
  // 确定 provider 类型
  let provider: ExtractorProviderType;
  
  if (config.provider) {
    provider = config.provider;
  } else if (config.useMock === true || process.env.USE_MOCK === 'true') {
    provider = 'mock';
  } else {
    provider = (process.env.EXTRACTOR_PROVIDER as ExtractorProviderType) || 'mock';
  }

  // Mock 模式
  if (provider === 'mock') {
    console.info('[Extractor] 使用 Mock 模式');
    return createMockGeminiExtractor();
  }

  // Gemini 模式
  if (provider === 'gemini') {
    const apiKey = config.apiKey ?? process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY 环境变量未设置，请设置 API Key 或使用 EXTRACTOR_PROVIDER=mock');
    }

    console.info('[Extractor] 使用 Gemini API');
    const realConfig: RealGeminiExtractorConfig = {
      apiKey,
      model: config.model,
      timeout: config.timeout,
    };
    return createRealGeminiExtractor(realConfig);
  }

  // OpenAI 模式
  if (provider === 'openai') {
    const apiKey = config.apiKey ?? process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY 环境变量未设置，请设置 API Key 或使用 EXTRACTOR_PROVIDER=mock');
    }

    const baseUrl = config.baseUrl ?? process.env.OPENAI_API_BASE;
    const model = config.model ?? process.env.OPENAI_EXTRACTOR_MODEL ?? 'gpt-4o';

    console.info(`[Extractor] 使用 OpenAI 兼容 API (${baseUrl || 'https://api.openai.com/v1'}, model: ${model})`);
    
    const openaiConfig: OpenAIExtractorConfig = {
      apiKey,
      baseUrl,
      model,
      timeout: config.timeout,
    };
    return createOpenAIExtractor(openaiConfig);
  }

  throw new Error(`未知的 EXTRACTOR_PROVIDER: ${provider}，支持: mock | gemini | openai`);
}
