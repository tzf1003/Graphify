/**
 * RealGeminiExtractor 实现
 * 调用真实的 Gemini API 提取图片结构化 JSON
 * 
 * TODO: 实现真实的 Gemini API 调用
 * 
 * 扩展说明：
 * 1. 安装 @google/generative-ai 依赖
 * 2. 配置 GEMINI_API_KEY 环境变量
 * 3. 实现 extract 方法调用 Gemini Vision API
 * 4. 解析响应并转换为 CanonicalJSON 格式
 */

import { GeminiExtractor, ExtractResult } from './interface';

/** 真实 GeminiExtractor 配置 */
export interface RealGeminiExtractorConfig {
  apiKey: string;
  model?: string;
  timeout?: number;
}

/** 真实 GeminiExtractor 实现（预留） */
export class RealGeminiExtractor implements GeminiExtractor {
  private config: RealGeminiExtractorConfig;

  constructor(config: RealGeminiExtractorConfig) {
    this.config = config;
  }

  async extract(imageBuffer: Buffer, outputLanguage: string): Promise<ExtractResult> {
    // TODO: 实现真实的 Gemini API 调用
    // 
    // 实现步骤：
    // 1. 将 imageBuffer 转换为 base64
    // 2. 构建 prompt，要求返回 CanonicalJSON 格式
    // 3. 调用 Gemini Vision API
    // 4. 解析响应 JSON
    // 5. 验证并返回结果
    //
    // 示例代码：
    // const genAI = new GoogleGenerativeAI(this.config.apiKey);
    // const model = genAI.getGenerativeModel({ model: this.config.model || 'gemini-pro-vision' });
    // const result = await model.generateContent([prompt, { inlineData: { data: base64, mimeType } }]);
    
    throw new Error(
      'RealGeminiExtractor 尚未实现。请设置 USE_MOCK=true 使用 Mock 实现，或完成此类的实现。'
    );
  }
}

/** 创建 RealGeminiExtractor 实例 */
export function createRealGeminiExtractor(config: RealGeminiExtractorConfig): GeminiExtractor {
  return new RealGeminiExtractor(config);
}
