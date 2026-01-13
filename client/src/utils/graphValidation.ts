/**
 * 图谱数据验证工具
 * 实现 CanonicalJSON 数据的验证逻辑
 */

import type {
  CanonicalElement,
  CanonicalRelation,
  ElementGeometry,
  ElementType,
  RelationType,
} from '@/types';

// ==================== 验证结果类型 ====================

/** 验证错误 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/** 验证结果 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ==================== 常量定义 ====================

/** 有效的元素类型 */
const VALID_ELEMENT_TYPES: ElementType[] = [
  'subject',
  'object',
  'text',
  'background',
  'effect',
];

/** 有效的关系类型 */
const VALID_RELATION_TYPES: RelationType[] = [
  'occludes',
  'attached_to',
  'in_front_of',
  'part_of',
];

// ==================== Bbox 验证 ====================

/**
 * 验证单个坐标值是否在 [0, 1] 范围内
 * 
 * @param value - 坐标值
 * @returns 是否有效
 */
function isValidCoordinate(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= 0 && value <= 1;
}

/**
 * 验证 bbox 坐标是否有效
 * bbox 格式: [x1, y1, x2, y2]，所有值必须在 [0, 1] 范围内
 * 
 * @param bbox - bbox 数组
 * @returns 验证结果
 */
export function validateBbox(bbox: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  // 检查是否为数组
  if (!Array.isArray(bbox)) {
    errors.push({
      field: 'geometry.bbox',
      message: 'bbox 必须是数组',
      severity: 'error',
    });
    return { valid: false, errors };
  }

  // 检查数组长度
  if (bbox.length !== 4) {
    errors.push({
      field: 'geometry.bbox',
      message: `bbox 必须包含 4 个坐标值，当前有 ${bbox.length} 个`,
      severity: 'error',
    });
    return { valid: false, errors };
  }

  const [x1, y1, x2, y2] = bbox;
  const coordNames = ['x1', 'y1', 'x2', 'y2'];

  // 验证每个坐标值
  bbox.forEach((value, index) => {
    if (!isValidCoordinate(value)) {
      if (typeof value !== 'number') {
        errors.push({
          field: `geometry.bbox[${index}]`,
          message: `${coordNames[index]} 必须是数字类型`,
          severity: 'error',
        });
      } else if (isNaN(value)) {
        errors.push({
          field: `geometry.bbox[${index}]`,
          message: `${coordNames[index]} 不能是 NaN`,
          severity: 'error',
        });
      } else {
        errors.push({
          field: `geometry.bbox[${index}]`,
          message: `${coordNames[index]} 必须在 [0, 1] 范围内，当前值: ${value}`,
          severity: 'error',
        });
      }
    }
  });

  // 如果坐标值都有效，检查逻辑关系
  if (errors.length === 0) {
    // x2 应该 >= x1
    if (x2 < x1) {
      errors.push({
        field: 'geometry.bbox',
        message: `x2 (${x2}) 应该大于等于 x1 (${x1})`,
        severity: 'warning',
      });
    }
    // y2 应该 >= y1
    if (y2 < y1) {
      errors.push({
        field: 'geometry.bbox',
        message: `y2 (${y2}) 应该大于等于 y1 (${y1})`,
        severity: 'warning',
      });
    }
  }

  return {
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
  };
}

// ==================== 元素验证 ====================

/**
 * 验证元素几何信息
 * 
 * @param geometry - 几何信息
 * @returns 验证结果
 */
function validateGeometry(geometry: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!geometry || typeof geometry !== 'object') {
    errors.push({
      field: 'geometry',
      message: 'geometry 必须是对象',
      severity: 'error',
    });
    return { valid: false, errors };
  }

  const geo = geometry as ElementGeometry;

  // 验证 bbox
  const bboxResult = validateBbox(geo.bbox);
  errors.push(...bboxResult.errors);

  // 验证 polygon（可选，但如果存在必须是有效数组）
  if (geo.polygon !== undefined) {
    if (!Array.isArray(geo.polygon)) {
      errors.push({
        field: 'geometry.polygon',
        message: 'polygon 必须是数组',
        severity: 'error',
      });
    } else {
      // 验证 polygon 中的每个点
      geo.polygon.forEach((point, index) => {
        if (!Array.isArray(point) || point.length !== 2) {
          errors.push({
            field: `geometry.polygon[${index}]`,
            message: `polygon 点必须是 [x, y] 格式的数组`,
            severity: 'error',
          });
        } else {
          const [px, py] = point;
          if (!isValidCoordinate(px) || !isValidCoordinate(py)) {
            errors.push({
              field: `geometry.polygon[${index}]`,
              message: `polygon 点坐标必须在 [0, 1] 范围内`,
              severity: 'error',
            });
          }
        }
      });
    }
  }

  // 验证 depth_hint
  if (geo.depth_hint !== undefined) {
    if (typeof geo.depth_hint !== 'number' || isNaN(geo.depth_hint)) {
      errors.push({
        field: 'geometry.depth_hint',
        message: 'depth_hint 必须是有效数字',
        severity: 'error',
      });
    }
  }

  return {
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
  };
}

/**
 * 验证元素完整性
 * 检查元素是否包含所有必需字段且值有效
 * 
 * @param element - 要验证的元素
 * @returns 验证结果
 */
export function validateElement(element: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  // 检查是否为对象
  if (!element || typeof element !== 'object') {
    errors.push({
      field: 'element',
      message: '元素必须是对象',
      severity: 'error',
    });
    return { valid: false, errors };
  }

  const el = element as CanonicalElement;

  // 验证 id
  if (!el.id || typeof el.id !== 'string') {
    errors.push({
      field: 'id',
      message: 'id 是必需的字符串字段',
      severity: 'error',
    });
  } else if (el.id.trim() === '') {
    errors.push({
      field: 'id',
      message: 'id 不能为空',
      severity: 'error',
    });
  }

  // 验证 name
  if (!el.name || typeof el.name !== 'string') {
    errors.push({
      field: 'name',
      message: 'name 是必需的字符串字段',
      severity: 'error',
    });
  } else if (el.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'name 不能为空',
      severity: 'error',
    });
  }

  // 验证 type
  if (!el.type) {
    errors.push({
      field: 'type',
      message: 'type 是必需字段',
      severity: 'error',
    });
  } else if (!VALID_ELEMENT_TYPES.includes(el.type)) {
    errors.push({
      field: 'type',
      message: `type 必须是以下值之一: ${VALID_ELEMENT_TYPES.join(', ')}`,
      severity: 'error',
    });
  }

  // 验证 description（可选，但如果存在必须是字符串）
  if (el.description !== undefined && typeof el.description !== 'string') {
    errors.push({
      field: 'description',
      message: 'description 必须是字符串',
      severity: 'error',
    });
  }

  // 验证 geometry
  if (!el.geometry) {
    errors.push({
      field: 'geometry',
      message: 'geometry 是必需字段',
      severity: 'error',
    });
  } else {
    const geoResult = validateGeometry(el.geometry);
    errors.push(...geoResult.errors);
  }

  // 验证 appearance（可选，但如果存在必须是对象）
  if (el.appearance !== undefined) {
    if (typeof el.appearance !== 'object' || el.appearance === null) {
      errors.push({
        field: 'appearance',
        message: 'appearance 必须是对象',
        severity: 'error',
      });
    }
  }

  // 验证 constraints（可选，但如果存在必须是对象）
  if (el.constraints !== undefined) {
    if (typeof el.constraints !== 'object' || el.constraints === null) {
      errors.push({
        field: 'constraints',
        message: 'constraints 必须是对象',
        severity: 'error',
      });
    }
  }

  return {
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
  };
}

// ==================== 关系验证 ====================

/**
 * 验证关系引用有效性
 * 检查关系的 from 和 to 是否引用了存在的元素
 * 
 * @param relation - 要验证的关系
 * @param elementIds - 所有有效的元素 ID 集合
 * @returns 验证结果
 */
export function validateRelation(
  relation: unknown,
  elementIds: Set<string> | string[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const idSet = elementIds instanceof Set ? elementIds : new Set(elementIds);

  // 检查是否为对象
  if (!relation || typeof relation !== 'object') {
    errors.push({
      field: 'relation',
      message: '关系必须是对象',
      severity: 'error',
    });
    return { valid: false, errors };
  }

  const rel = relation as CanonicalRelation;

  // 验证 from
  if (!rel.from || typeof rel.from !== 'string') {
    errors.push({
      field: 'from',
      message: 'from 是必需的字符串字段',
      severity: 'error',
    });
  } else if (!idSet.has(rel.from)) {
    errors.push({
      field: 'from',
      message: `from 引用了不存在的元素: ${rel.from}`,
      severity: 'error',
    });
  }

  // 验证 to
  if (!rel.to || typeof rel.to !== 'string') {
    errors.push({
      field: 'to',
      message: 'to 是必需的字符串字段',
      severity: 'error',
    });
  } else if (!idSet.has(rel.to)) {
    errors.push({
      field: 'to',
      message: `to 引用了不存在的元素: ${rel.to}`,
      severity: 'error',
    });
  }

  // 验证 type
  if (!rel.type) {
    errors.push({
      field: 'type',
      message: 'type 是必需字段',
      severity: 'error',
    });
  } else if (!VALID_RELATION_TYPES.includes(rel.type)) {
    errors.push({
      field: 'type',
      message: `type 必须是以下值之一: ${VALID_RELATION_TYPES.join(', ')}`,
      severity: 'error',
    });
  }

  // 检查自引用
  if (rel.from && rel.to && rel.from === rel.to) {
    errors.push({
      field: 'relation',
      message: '关系不能自引用（from 和 to 不能相同）',
      severity: 'warning',
    });
  }

  return {
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
  };
}

// ==================== 批量验证 ====================

/**
 * 验证所有元素
 * 
 * @param elements - 元素数组
 * @returns 验证结果，包含所有错误
 */
export function validateElements(elements: unknown[]): ValidationResult {
  const errors: ValidationError[] = [];
  const seenIds = new Set<string>();

  if (!Array.isArray(elements)) {
    errors.push({
      field: 'elements',
      message: 'elements 必须是数组',
      severity: 'error',
    });
    return { valid: false, errors };
  }

  elements.forEach((element, index) => {
    const result = validateElement(element);
    
    // 添加索引前缀到错误字段
    result.errors.forEach((error) => {
      errors.push({
        ...error,
        field: `elements[${index}].${error.field}`,
      });
    });

    // 检查 ID 重复
    const el = element as CanonicalElement;
    if (el.id) {
      if (seenIds.has(el.id)) {
        errors.push({
          field: `elements[${index}].id`,
          message: `元素 ID 重复: ${el.id}`,
          severity: 'error',
        });
      } else {
        seenIds.add(el.id);
      }
    }
  });

  return {
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
  };
}

/**
 * 验证所有关系
 * 
 * @param relations - 关系数组
 * @param elementIds - 所有有效的元素 ID
 * @returns 验证结果，包含所有错误
 */
export function validateRelations(
  relations: unknown[],
  elementIds: Set<string> | string[]
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!Array.isArray(relations)) {
    errors.push({
      field: 'relations',
      message: 'relations 必须是数组',
      severity: 'error',
    });
    return { valid: false, errors };
  }

  relations.forEach((relation, index) => {
    const result = validateRelation(relation, elementIds);
    
    // 添加索引前缀到错误字段
    result.errors.forEach((error) => {
      errors.push({
        ...error,
        field: `relations[${index}].${error.field}`,
      });
    });
  });

  return {
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
  };
}

/**
 * 验证完整的图谱数据（元素和关系）
 * 
 * @param elements - 元素数组
 * @param relations - 关系数组
 * @returns 验证结果
 */
export function validateGraphData(
  elements: unknown[],
  relations: unknown[]
): ValidationResult {
  const errors: ValidationError[] = [];

  // 验证元素
  const elementsResult = validateElements(elements);
  errors.push(...elementsResult.errors);

  // 收集有效的元素 ID
  const elementIds = new Set<string>();
  if (Array.isArray(elements)) {
    elements.forEach((el) => {
      const element = el as CanonicalElement;
      if (element.id && typeof element.id === 'string') {
        elementIds.add(element.id);
      }
    });
  }

  // 验证关系
  const relationsResult = validateRelations(relations, elementIds);
  errors.push(...relationsResult.errors);

  return {
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
  };
}
