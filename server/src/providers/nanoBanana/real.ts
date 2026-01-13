/**
 * RealNanoBananaEditor 实现
 * 调用真实的 NanoBanana API 生成候选图片
 * 
 * TODO: 实现真实的 NanoBanana API 调用
 * 
 * 扩展说明：
 * 1. 配置 NANOBANANA_API_KEY 和 NANOBANANA_API_URL 环境变量
 * 2. 实现 generate 方法调用 NanoBanana API
 * 3. 处理响应并返回生成的图片
 */

import { NanoBananaEditor, GenerateOptions, GeneratedImage } from './interface';
import { CanonicalJSON } from '../../types';

/** 真实 NanoBananaEditor 配置 */
export interface RealNanoBananaEditorConfig {
  apiKey: string;
  apiUrl?: string;
  timeout?: number;
}

/** 真实 NanoBananaEditor 实现（预留） */
export class RealNanoBananaEditor implements NanoBananaEditor {
  private config: RealNanoBananaEditorConfig;

  constructor(config: RealNanoBananaEditorConfig) {
    this.config = config;
  }

  async generate(
    baseImage: Buffer,
    jsonContent: CanonicalJSON,
    options: GenerateOptions
  ): Promise<GeneratedImage[]> {
    // TODO: 实现真实的 NanoBanana API 调用
    //
    // 实现步骤：
    // 1. 将 baseImage 转换为 base64
    // 2. 构建请求体，包含 jsonContent 和 options
    // 3. 调用 NanoBanana API
    // 4. 解析响应，下载生成的图片
    // 5. 返回 GeneratedImage 数组
    //
    // 示例代码：
    // const response = await fetch(this.config.apiUrl + '/generate', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.config.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     image: baseImage.toString('base64'),
    //     json: jsonContent,
    //     count: options.count,
    //     seed: options.seed,
    //     strength: options.strength,
    //   }),
    // });

    throw new Error(
      'RealNanoBananaEditor 尚未实现。请设置 USE_MOCK=true 使用 Mock 实现，或完成此类的实现。'
    );
  }
}

/** 创建 RealNanoBananaEditor 实例 */
export function createRealNanoBananaEditor(config: RealNanoBananaEditorConfig): NanoBananaEditor {
  return new RealNanoBananaEditor(config);
}
