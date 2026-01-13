/**
 * MockGeminiExtractor 实现
 * 返回固定结构的 JSON，用于开发和测试
 */

import { GeminiExtractor, ExtractResult } from './interface';
import { CanonicalJSON } from '../../types';

/**
 * 创建符合 CanonicalJSON schema 的 Mock 数据
 * @param outputLanguage 输出语言
 * @param width 图片宽度
 * @param height 图片高度
 */
function createMockCanonicalJSON(
  outputLanguage: string,
  width: number = 1024,
  height: number = 768
): CanonicalJSON {
  const isZhCN = outputLanguage === 'zh-CN';

  // 注意：bbox 和 polygon 使用归一化坐标 [0, 1]
  // bbox 格式: [x1, y1, x2, y2]
  return {
    meta: {
      schema_version: '1.0.0',
      output_language: outputLanguage,
      width,
      height,
    },
    scene: {
      summary: isZhCN
        ? '一个宁静的自然风景场景，展示了山脉和湖泊'
        : 'A serene natural landscape scene featuring mountains and a lake',
      style: {
        genre: 'landscape',
        palette: 'natural',
        rendering: 'photorealistic',
      },
      camera: {
        shot: 'wide',
        lens: '24mm',
        angle: 'eye-level',
        dof: 'deep',
      },
      lighting: {
        type: 'natural',
        direction: 'front-left',
        contrast: 'medium',
      },
    },
    elements: [
      {
        id: 'elem_001',
        type: 'background',
        name: 'sky',
        description: isZhCN ? '蓝天白云的天空背景' : 'Blue sky with white clouds',
        geometry: {
          bbox: [0, 0, 1, 0.4],
          polygon: [[0, 0], [1, 0], [1, 0.4], [0, 0.4]],
          depth_hint: 1.0,
        },
        appearance: {
          material: 'atmospheric',
          color: '#87CEEB',
          texture: 'gradient',
        },
        constraints: {
          keep_identity: false,
          preserve_text_legibility: false,
        },
      },
      {
        id: 'elem_002',
        type: 'subject',
        name: 'mountain',
        description: isZhCN ? '远处的山脉轮廓' : 'Distant mountain silhouette',
        geometry: {
          bbox: [0, 0.2, 1, 0.6],
          polygon: [[0, 0.5], [0.3, 0.2], [0.7, 0.3], [1, 0.5]],
          depth_hint: 0.7,
        },
        appearance: {
          material: 'rock',
          color: '#4A5568',
          texture: 'rough',
        },
        constraints: {
          keep_identity: true,
          preserve_text_legibility: false,
        },
      },
      {
        id: 'elem_003',
        type: 'object',
        name: 'lake',
        description: isZhCN ? '平静的湖面倒影' : 'Calm lake with reflections',
        geometry: {
          bbox: [0, 0.5, 1, 1],
          polygon: [[0, 0.5], [1, 0.5], [1, 1], [0, 1]],
          depth_hint: 0.3,
        },
        appearance: {
          material: 'water',
          color: '#2B6CB0',
          texture: 'reflective',
        },
        constraints: {
          keep_identity: false,
          preserve_text_legibility: false,
        },
      },
    ],
    relations: [
      {
        from: 'elem_001',
        to: 'elem_002',
        type: 'in_front_of',
      },
      {
        from: 'elem_002',
        to: 'elem_003',
        type: 'in_front_of',
      },
    ],
    edit_intent: {
      goal: isZhCN ? '保持自然风景的整体氛围' : 'Maintain the overall atmosphere of natural scenery',
      negatives: isZhCN
        ? ['人造建筑', '现代元素', '文字水印']
        : ['artificial buildings', 'modern elements', 'text watermarks'],
      safety: {
        avoid: isZhCN
          ? ['暴力内容', '不当内容']
          : ['violent content', 'inappropriate content'],
      },
    },
  };
}

/** Mock GeminiExtractor 实现 */
export class MockGeminiExtractor implements GeminiExtractor {
  async extract(imageBuffer: Buffer, outputLanguage: string): Promise<ExtractResult> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 从图片 buffer 尝试获取尺寸（简化处理，使用默认值）
    // 实际实现中可以使用 sharp 等库获取真实尺寸
    const width = 1024;
    const height = 768;

    const json = createMockCanonicalJSON(outputLanguage, width, height);

    return {
      json,
      rawResponse: {
        mock: true,
        timestamp: new Date().toISOString(),
        inputSize: imageBuffer.length,
      },
    };
  }
}

/** 创建 MockGeminiExtractor 实例 */
export function createMockGeminiExtractor(): GeminiExtractor {
  return new MockGeminiExtractor();
}
