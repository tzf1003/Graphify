/**
 * NanoBananaEditor 模块导出
 */

export * from './interface';
export * from './mock';
export * from './real';
export * from './openai';

import { NanoBananaEditor } from './interface';
import { createMockNanoBananaEditor } from './mock';
import { createRealNanoBananaEditor, RealNanoBananaEditorConfig } from './real';
import { createOpenAINanoBananaEditor, OpenAINanoBananaConfig } from './openai';

/** 图片生成提供者类型 */
export type ImageProviderType = 'mock' | 'nanobanana' | 'openai';

/** NanoBananaEditor 工厂配置 */
export interface NanoBananaEditorFactoryConfig {
  useMock?: boolean;
  provider?: ImageProviderType;
  apiKey?: string;
  apiUrl?: string;
  apiBase?: string;
  model?: string;
  timeout?: number;
}

/**
 * 创建 NanoBananaEditor 实例
 * 根据配置返回 Mock、NanoBanana 或 OpenAI 实现
 */
export function createNanoBananaEditor(config: NanoBananaEditorFactoryConfig = {}): NanoBananaEditor {
  // 优先使用 provider 配置，其次检查 USE_MOCK
  const provider = config.provider ?? process.env.IMAGE_PROVIDER as ImageProviderType;
  const useMock = config.useMock ?? (process.env.USE_MOCK === 'true');

  // 如果明确指定使用 mock 或 USE_MOCK=true
  if (provider === 'mock' || (useMock && !provider)) {
    return createMockNanoBananaEditor();
  }

  // 使用 OpenAI 兼容接口
  if (provider === 'openai') {
    const apiKey = config.apiKey ?? process.env.OPENAI_API_KEY;
    const apiBase = config.apiBase ?? process.env.OPENAI_API_BASE;
    const model = config.model ?? process.env.OPENAI_MODEL;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY 环境变量未设置');
    }
    if (!apiBase) {
      throw new Error('OPENAI_API_BASE 环境变量未设置');
    }
    if (!model) {
      throw new Error('OPENAI_MODEL 环境变量未设置');
    }

    const openaiConfig: OpenAINanoBananaConfig = {
      apiKey,
      apiBase,
      model,
      timeout: config.timeout,
    };

    return createOpenAINanoBananaEditor(openaiConfig);
  }

  // 使用 NanoBanana API
  const apiKey = config.apiKey ?? process.env.NANOBANANA_API_KEY;
  if (!apiKey) {
    throw new Error('NANOBANANA_API_KEY 环境变量未设置，请设置 API Key 或使用 USE_MOCK=true');
  }

  const realConfig: RealNanoBananaEditorConfig = {
    apiKey,
    apiUrl: config.apiUrl ?? process.env.NANOBANANA_API_URL,
    timeout: config.timeout,
  };

  return createRealNanoBananaEditor(realConfig);
}
