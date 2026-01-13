/**
 * GeminiExtractor 接口定义
 * 负责从图片提取结构化 JSON 描述
 */

import { CanonicalJSON } from '../../types';

/** 提取结果 */
export interface ExtractResult {
  /** 提取的 CanonicalJSON */
  json: CanonicalJSON;
  /** 原始响应（用于调试） */
  rawResponse?: unknown;
}

/** GeminiExtractor 接口 */
export interface GeminiExtractor {
  /**
   * 从图片提取结构化 JSON
   * @param imageBuffer 图片二进制数据
   * @param outputLanguage 输出语言（如 "zh-CN"）
   * @returns 提取结果
   */
  extract(imageBuffer: Buffer, outputLanguage: string): Promise<ExtractResult>;
}

/** 创建 GeminiExtractor 的工厂函数类型 */
export type GeminiExtractorFactory = () => GeminiExtractor;
