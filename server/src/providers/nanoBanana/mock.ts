/**
 * MockNanoBananaEditor 实现
 * 复制原图生成候选图，用于开发和测试
 */

import { NanoBananaEditor, GenerateOptions, GeneratedImage } from './interface';
import { CanonicalJSON } from '../../types';

/** Mock NanoBananaEditor 实现 */
export class MockNanoBananaEditor implements NanoBananaEditor {
  async generate(
    baseImage: Buffer,
    jsonContent: CanonicalJSON,
    options: GenerateOptions
  ): Promise<GeneratedImage[]> {
    // 验证 count 范围
    if (options.count < 1 || options.count > 8) {
      throw new Error('count 必须在 1-8 范围内');
    }

    // 模拟网络延迟（每张图片 200-500ms）
    const delay = 200 + Math.random() * 300;
    await new Promise((resolve) => setTimeout(resolve, delay * options.count));

    // 生成候选图（Mock 实现直接复制原图）
    const results: GeneratedImage[] = [];

    for (let i = 0; i < options.count; i++) {
      // 复制原图 buffer 作为候选图
      // 实际实现中会调用 AI 模型生成不同的图片
      const candidateBuffer = Buffer.from(baseImage);

      results.push({
        buffer: candidateBuffer,
        index: i,
      });
    }

    return results;
  }
}

/** 创建 MockNanoBananaEditor 实例 */
export function createMockNanoBananaEditor(): NanoBananaEditor {
  return new MockNanoBananaEditor();
}
