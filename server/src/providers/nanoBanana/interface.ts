/**
 * NanoBananaEditor 接口定义
 * 负责根据 JSON 描述生成候选图片
 */

import { CanonicalJSON } from '../../types';

/** 生成选项 */
export interface GenerateOptions {
  /** 生成数量 (1-8) */
  count: number;
  /** 随机种子（可选） */
  seed?: number;
  /** 生成强度 (0-1)（可选） */
  strength?: number;
}

/** 生成的图片 */
export interface GeneratedImage {
  /** 图片二进制数据 */
  buffer: Buffer;
  /** 图片索引 (0-based) */
  index: number;
}

/** NanoBananaEditor 接口 */
export interface NanoBananaEditor {
  /**
   * 根据 JSON 描述生成候选图片
   * @param baseImage 基础图片二进制数据
   * @param jsonContent CanonicalJSON 描述
   * @param options 生成选项
   * @returns 生成的候选图片数组
   */
  generate(
    baseImage: Buffer,
    jsonContent: CanonicalJSON,
    options: GenerateOptions
  ): Promise<GeneratedImage[]>;
}

/** 创建 NanoBananaEditor 的工厂函数类型 */
export type NanoBananaEditorFactory = () => NanoBananaEditor;
