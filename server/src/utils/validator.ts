/**
 * 验证器模块
 * 提供 JSON Schema 验证和文件上传验证功能
 */

import type { CanonicalJSON, ElementType, RelationType } from '../types';

// ==================== 常量定义 ====================

/** 支持的图片 MIME 类型 */
export const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

/** 支持的图片扩展名 */
export const SUPPORTED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'] as const;

/** 最大文件大小：10MB */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** 最大 JSON 大小：1MB */
export const MAX_JSON_SIZE = 1 * 1024 * 1024;

/** 有效的元素类型 */
const VALID_ELEMENT_TYPES: ElementType[] = ['subject', 'object', 'text', 'background', 'effect'];

/** 有效的关系类型 */
const VALID_RELATION_TYPES: RelationType[] = ['occludes', 'attached_to', 'in_front_of', 'part_of'];

// ==================== 验证结果类型 ====================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ==================== 辅助验证函数 ====================

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}


// ==================== Meta 验证 ====================

function validateMeta(meta: unknown, errors: string[]): boolean {
  if (!isObject(meta)) {
    errors.push('meta 必须是一个对象');
    return false;
  }

  if (!isNonEmptyString(meta.schema_version)) {
    errors.push('meta.schema_version 必须是非空字符串');
  }
  if (!isNonEmptyString(meta.output_language)) {
    errors.push('meta.output_language 必须是非空字符串');
  }
  if (!isNumber(meta.width) || meta.width <= 0) {
    errors.push('meta.width 必须是正数');
  }
  if (!isNumber(meta.height) || meta.height <= 0) {
    errors.push('meta.height 必须是正数');
  }

  return errors.length === 0;
}

// ==================== Scene 验证 ====================

function validateSceneStyle(style: unknown, errors: string[]): void {
  if (!isObject(style)) {
    errors.push('scene.style 必须是一个对象');
    return;
  }
  if (!isNonEmptyString(style.genre)) {
    errors.push('scene.style.genre 必须是非空字符串');
  }
  if (!isNonEmptyString(style.palette)) {
    errors.push('scene.style.palette 必须是非空字符串');
  }
  if (!isNonEmptyString(style.rendering)) {
    errors.push('scene.style.rendering 必须是非空字符串');
  }
}

function validateSceneCamera(camera: unknown, errors: string[]): void {
  if (!isObject(camera)) {
    errors.push('scene.camera 必须是一个对象');
    return;
  }
  if (!isNonEmptyString(camera.shot)) {
    errors.push('scene.camera.shot 必须是非空字符串');
  }
  if (!isNonEmptyString(camera.lens)) {
    errors.push('scene.camera.lens 必须是非空字符串');
  }
  if (!isNonEmptyString(camera.angle)) {
    errors.push('scene.camera.angle 必须是非空字符串');
  }
  if (!isNonEmptyString(camera.dof)) {
    errors.push('scene.camera.dof 必须是非空字符串');
  }
}

function validateSceneLighting(lighting: unknown, errors: string[]): void {
  if (!isObject(lighting)) {
    errors.push('scene.lighting 必须是一个对象');
    return;
  }
  if (!isNonEmptyString(lighting.type)) {
    errors.push('scene.lighting.type 必须是非空字符串');
  }
  if (!isNonEmptyString(lighting.direction)) {
    errors.push('scene.lighting.direction 必须是非空字符串');
  }
  if (!isNonEmptyString(lighting.contrast)) {
    errors.push('scene.lighting.contrast 必须是非空字符串');
  }
}

function validateScene(scene: unknown, errors: string[]): void {
  if (!isObject(scene)) {
    errors.push('scene 必须是一个对象');
    return;
  }

  if (!isNonEmptyString(scene.summary)) {
    errors.push('scene.summary 必须是非空字符串');
  }

  validateSceneStyle(scene.style, errors);
  validateSceneCamera(scene.camera, errors);
  validateSceneLighting(scene.lighting, errors);
}


// ==================== Element 验证 ====================

function validateElementGeometry(geometry: unknown, elementId: string, errors: string[]): void {
  if (!isObject(geometry)) {
    errors.push(`elements[${elementId}].geometry 必须是一个对象`);
    return;
  }

  // 验证 bbox: [x, y, width, height]
  if (!isArray(geometry.bbox) || geometry.bbox.length !== 4) {
    errors.push(`elements[${elementId}].geometry.bbox 必须是包含4个数字的数组`);
  } else if (!geometry.bbox.every(isNumber)) {
    errors.push(`elements[${elementId}].geometry.bbox 中的所有值必须是数字`);
  }

  // 验证 polygon
  if (!isArray(geometry.polygon)) {
    errors.push(`elements[${elementId}].geometry.polygon 必须是数组`);
  } else {
    for (let i = 0; i < geometry.polygon.length; i++) {
      const point = geometry.polygon[i];
      if (!isArray(point) || !point.every(isNumber)) {
        errors.push(`elements[${elementId}].geometry.polygon[${i}] 必须是数字数组`);
      }
    }
  }

  // 验证 depth_hint
  if (!isNumber(geometry.depth_hint)) {
    errors.push(`elements[${elementId}].geometry.depth_hint 必须是数字`);
  }
}

function validateElementAppearance(appearance: unknown, elementId: string, errors: string[]): void {
  if (!isObject(appearance)) {
    errors.push(`elements[${elementId}].appearance 必须是一个对象`);
    return;
  }

  if (!isNonEmptyString(appearance.material)) {
    errors.push(`elements[${elementId}].appearance.material 必须是非空字符串`);
  }
  if (!isNonEmptyString(appearance.color)) {
    errors.push(`elements[${elementId}].appearance.color 必须是非空字符串`);
  }
  if (!isNonEmptyString(appearance.texture)) {
    errors.push(`elements[${elementId}].appearance.texture 必须是非空字符串`);
  }

  // text 是可选的
  if (appearance.text !== undefined) {
    if (!isObject(appearance.text)) {
      errors.push(`elements[${elementId}].appearance.text 必须是一个对象`);
    } else {
      if (!isNonEmptyString(appearance.text.content)) {
        errors.push(`elements[${elementId}].appearance.text.content 必须是非空字符串`);
      }
      if (!isNonEmptyString(appearance.text.font_hint)) {
        errors.push(`elements[${elementId}].appearance.text.font_hint 必须是非空字符串`);
      }
      if (!isNonEmptyString(appearance.text.language)) {
        errors.push(`elements[${elementId}].appearance.text.language 必须是非空字符串`);
      }
    }
  }
}

function validateElementConstraints(constraints: unknown, elementId: string, errors: string[]): void {
  if (!isObject(constraints)) {
    errors.push(`elements[${elementId}].constraints 必须是一个对象`);
    return;
  }

  if (!isBoolean(constraints.keep_identity)) {
    errors.push(`elements[${elementId}].constraints.keep_identity 必须是布尔值`);
  }
  if (!isBoolean(constraints.preserve_text_legibility)) {
    errors.push(`elements[${elementId}].constraints.preserve_text_legibility 必须是布尔值`);
  }
}

function validateElement(element: unknown, index: number, errors: string[]): void {
  if (!isObject(element)) {
    errors.push(`elements[${index}] 必须是一个对象`);
    return;
  }

  const elementId = isNonEmptyString(element.id) ? element.id : `index:${index}`;

  if (!isNonEmptyString(element.id)) {
    errors.push(`elements[${index}].id 必须是非空字符串`);
  }

  if (!isNonEmptyString(element.type) || !VALID_ELEMENT_TYPES.includes(element.type as ElementType)) {
    errors.push(`elements[${elementId}].type 必须是以下值之一: ${VALID_ELEMENT_TYPES.join(', ')}`);
  }

  if (!isNonEmptyString(element.name)) {
    errors.push(`elements[${elementId}].name 必须是非空字符串`);
  }

  if (!isNonEmptyString(element.description)) {
    errors.push(`elements[${elementId}].description 必须是非空字符串`);
  }

  validateElementGeometry(element.geometry, elementId, errors);
  validateElementAppearance(element.appearance, elementId, errors);
  validateElementConstraints(element.constraints, elementId, errors);
}

function validateElements(elements: unknown, errors: string[]): void {
  if (!isArray(elements)) {
    errors.push('elements 必须是一个数组');
    return;
  }

  for (let i = 0; i < elements.length; i++) {
    validateElement(elements[i], i, errors);
  }
}


// ==================== Relations 验证 ====================

function validateRelation(relation: unknown, index: number, errors: string[]): void {
  if (!isObject(relation)) {
    errors.push(`relations[${index}] 必须是一个对象`);
    return;
  }

  if (!isNonEmptyString(relation.from)) {
    errors.push(`relations[${index}].from 必须是非空字符串`);
  }

  if (!isNonEmptyString(relation.to)) {
    errors.push(`relations[${index}].to 必须是非空字符串`);
  }

  if (!isNonEmptyString(relation.type) || !VALID_RELATION_TYPES.includes(relation.type as RelationType)) {
    errors.push(`relations[${index}].type 必须是以下值之一: ${VALID_RELATION_TYPES.join(', ')}`);
  }
}

function validateRelations(relations: unknown, errors: string[]): void {
  if (!isArray(relations)) {
    errors.push('relations 必须是一个数组');
    return;
  }

  for (let i = 0; i < relations.length; i++) {
    validateRelation(relations[i], i, errors);
  }
}

// ==================== EditIntent 验证 ====================

function validateEditIntent(editIntent: unknown, errors: string[]): void {
  if (!isObject(editIntent)) {
    errors.push('edit_intent 必须是一个对象');
    return;
  }

  if (!isNonEmptyString(editIntent.goal)) {
    errors.push('edit_intent.goal 必须是非空字符串');
  }

  if (!isArray(editIntent.negatives)) {
    errors.push('edit_intent.negatives 必须是一个数组');
  } else if (!editIntent.negatives.every((n: unknown) => typeof n === 'string')) {
    errors.push('edit_intent.negatives 中的所有值必须是字符串');
  }

  if (!isObject(editIntent.safety)) {
    errors.push('edit_intent.safety 必须是一个对象');
  } else {
    if (!isArray(editIntent.safety.avoid)) {
      errors.push('edit_intent.safety.avoid 必须是一个数组');
    } else if (!editIntent.safety.avoid.every((a: unknown) => typeof a === 'string')) {
      errors.push('edit_intent.safety.avoid 中的所有值必须是字符串');
    }
  }
}

// ==================== 主验证函数 ====================

/**
 * 验证 CanonicalJSON 格式
 * @param json 待验证的 JSON 对象
 * @returns 验证结果，包含是否有效和错误列表
 */
export function validateCanonicalJSON(json: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isObject(json)) {
    return {
      valid: false,
      errors: ['输入必须是一个有效的 JSON 对象'],
    };
  }

  // 验证各个部分
  validateMeta(json.meta, errors);
  validateScene(json.scene, errors);
  validateElements(json.elements, errors);
  validateRelations(json.relations, errors);
  validateEditIntent(json.edit_intent, errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 解析并验证 JSON 字符串
 * @param jsonString JSON 字符串
 * @returns 验证结果
 */
export function parseAndValidateCanonicalJSON(jsonString: string): ValidationResult & { data?: CanonicalJSON } {
  // 检查 JSON 大小
  const byteSize = Buffer.byteLength(jsonString, 'utf8');
  if (byteSize > MAX_JSON_SIZE) {
    return {
      valid: false,
      errors: [`JSON 大小超过 ${MAX_JSON_SIZE / 1024 / 1024}MB 限制`],
    };
  }

  // 尝试解析 JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    const error = e instanceof Error ? e.message : '未知解析错误';
    return {
      valid: false,
      errors: [`JSON 解析失败: ${error}`],
    };
  }

  // 验证结构
  const result = validateCanonicalJSON(parsed);
  if (result.valid) {
    return {
      ...result,
      data: parsed as CanonicalJSON,
    };
  }

  return result;
}


// ==================== 文件上传验证 ====================

export interface FileValidationInput {
  size: number;
  mimeType: string;
  originalName?: string;
}

/**
 * 验证上传文件
 * @param file 文件信息
 * @returns 验证结果
 */
export function validateUploadFile(file: FileValidationInput): ValidationResult {
  const errors: string[] = [];

  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`文件大小超过 ${MAX_FILE_SIZE / 1024 / 1024}MB 限制`);
  }

  // 检查 MIME 类型
  if (!SUPPORTED_IMAGE_TYPES.includes(file.mimeType as typeof SUPPORTED_IMAGE_TYPES[number])) {
    errors.push(`仅支持 ${SUPPORTED_IMAGE_EXTENSIONS.map(e => e.slice(1)).join('/')} 格式`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 从文件名获取扩展名
 * @param filename 文件名
 * @returns 扩展名（包含点号）或 null
 */
export function getFileExtension(filename: string): string | null {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) {
    return null;
  }
  return filename.slice(lastDot).toLowerCase();
}

/**
 * 根据 MIME 类型获取文件扩展名
 * @param mimeType MIME 类型
 * @returns 扩展名（不包含点号）
 */
export function getExtensionFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    default:
      return 'bin';
  }
}

/**
 * 验证生成任务参数
 * @param count 生成数量
 * @returns 验证结果
 */
export function validateGenerationCount(count: number): ValidationResult {
  const errors: string[] = [];

  if (!Number.isInteger(count)) {
    errors.push('count 必须是整数');
  } else if (count < 1 || count > 8) {
    errors.push('count 必须在 1-8 范围内');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 验证生成任务的 strength 参数
 * @param strength 强度值
 * @returns 验证结果
 */
export function validateGenerationStrength(strength: number | undefined | null): ValidationResult {
  const errors: string[] = [];

  if (strength !== undefined && strength !== null) {
    if (typeof strength !== 'number' || isNaN(strength)) {
      errors.push('strength 必须是数字');
    } else if (strength < 0 || strength > 1) {
      errors.push('strength 必须在 0-1 范围内');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
