/**
 * TextToImageGenerator 接口定义
 * 负责根据文字描述生成图片
 */

/** 生成选项 */
export interface TextToImageOptions {
  /** 图片宽度 */
  width?: number;
  /** 图片高度 */
  height?: number;
  /** 随机种子（可选） */
  seed?: number;
}

/** 生成结果 */
export interface TextToImageResult {
  /** 图片二进制数据 */
  buffer: Buffer;
  /** MIME 类型 */
  mimeType: string;
  /** 图片宽度 */
  width: number;
  /** 图片高度 */
  height: number;
}

/** TextToImageGenerator 接口 */
export interface TextToImageGenerator {
  /**
   * 根据文字描述生成图片
   * @param prompt 文字描述
   * @param options 生成选项
   * @returns 生成的图片
   */
  generate(
    prompt: string,
    options?: TextToImageOptions
  ): Promise<TextToImageResult>;
}
