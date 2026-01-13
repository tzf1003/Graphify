/**
 * Mock 文字生成图片实现
 * 用于开发和测试，生成一个带文字的占位图片
 */

import { TextToImageGenerator, TextToImageOptions, TextToImageResult } from './interface';

/** Mock 文字生成图片实现 */
export class MockTextToImageGenerator implements TextToImageGenerator {
  /**
   * 生成一个简单的占位图片
   * 返回一个1x1像素的PNG图片（用于测试）
   */
  async generate(
    prompt: string,
    options?: TextToImageOptions
  ): Promise<TextToImageResult> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

    const width = options?.width || 1024;
    const height = options?.height || 1024;

    // 生成一个简单的PNG图片（1x1像素灰色）
    // PNG 文件头 + IHDR + IDAT + IEND
    const pngBuffer = this.createSimplePng(width, height);

    return {
      buffer: pngBuffer,
      mimeType: 'image/png',
      width,
      height,
    };
  }

  /**
   * 创建一个简单的PNG图片
   * 这是一个最小的有效PNG文件
   */
  private createSimplePng(width: number, height: number): Buffer {
    // 最小有效PNG（1x1像素灰色）
    // 实际生产中应该使用canvas或sharp库生成真实图片
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      0x00, 0x00, 0x00, 0x0d, // IHDR length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width = 1
      0x00, 0x00, 0x00, 0x01, // height = 1
      0x08, 0x02, // bit depth = 8, color type = 2 (RGB)
      0x00, 0x00, 0x00, // compression, filter, interlace
      0x90, 0x77, 0x53, 0xde, // CRC
      0x00, 0x00, 0x00, 0x0c, // IDAT length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0xd7, 0x63, 0x78, 0x78, 0x78, 0x00, 0x00, 0x00, 0x04, 0x00, 0x01, // compressed data
      0x27, 0x34, 0x03, 0x00, // CRC (approximate)
      0x00, 0x00, 0x00, 0x00, // IEND length
      0x49, 0x45, 0x4e, 0x44, // IEND
      0xae, 0x42, 0x60, 0x82, // CRC
    ]);

    return png;
  }
}

/** 创建 Mock 文字生成图片实例 */
export function createMockTextToImageGenerator(): TextToImageGenerator {
  return new MockTextToImageGenerator();
}
