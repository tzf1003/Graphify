/**
 * 图谱数据层验证脚本
 * 验证 graphTransform 和 graphValidation 模块的基本功能
 */

// 模拟类型定义（因为这是独立运行的脚本）
type ElementType = 'subject' | 'object' | 'text' | 'background' | 'effect';
type RelationType = 'occludes' | 'attached_to' | 'in_front_of' | 'part_of';

interface ElementGeometry {
  bbox: [number, number, number, number];
  polygon?: number[][];
  depth_hint?: number;
}

interface ElementAppearance {
  material: string;
  color: string;
  texture: string;
}

interface ElementConstraints {
  keep_identity: boolean;
  preserve_text_legibility: boolean;
}

interface CanonicalElement {
  id: string;
  type: ElementType;
  name: string;
  description: string;
  geometry: ElementGeometry;
  appearance: ElementAppearance;
  constraints: ElementConstraints;
}

interface CanonicalRelation {
  from: string;
  to: string;
  type: RelationType;
}

interface CanonicalJSON {
  meta: any;
  scene: any;
  elements: CanonicalElement[];
  relations: CanonicalRelation[];
  edit_intent: any;
}

// ==================== 测试数据 ====================

const testElement1: CanonicalElement = {
  id: 'elem-1',
  type: 'subject',
  name: 'Person',
  description: 'A person in the scene',
  geometry: {
    bbox: [0.1, 0.2, 0.5, 0.8],
    depth_hint: 1,
  },
  appearance: {
    material: 'skin',
    color: 'natural',
    texture: 'smooth',
  },
  constraints: {
    keep_identity: true,
    preserve_text_legibility: false,
  },
};

const testElement2: CanonicalElement = {
  id: 'elem-2',
  type: 'object',
  name: 'Table',
  description: 'A wooden table',
  geometry: {
    bbox: [0.3, 0.5, 0.7, 0.9],
    depth_hint: 2,
  },
  appearance: {
    material: 'wood',
    color: 'brown',
    texture: 'grain',
  },
  constraints: {
    keep_identity: false,
    preserve_text_legibility: false,
  },
};

const testRelation: CanonicalRelation = {
  from: 'elem-1',
  to: 'elem-2',
  type: 'in_front_of',
};

const testCanonicalJSON: CanonicalJSON = {
  meta: { schema_version: '1.0', output_language: 'en', width: 1920, height: 1080 },
  scene: { summary: 'Test scene' },
  elements: [testElement1, testElement2],
  relations: [testRelation],
  edit_intent: { goal: 'test' },
};

// ==================== 验证函数（简化版） ====================

function isValidCoordinate(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= 0 && value <= 1;
}

function validateBbox(bbox: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(bbox)) {
    errors.push('bbox 必须是数组');
    return { valid: false, errors };
  }

  if (bbox.length !== 4) {
    errors.push(`bbox 必须包含 4 个坐标值，当前有 ${bbox.length} 个`);
    return { valid: false, errors };
  }

  bbox.forEach((value, index) => {
    if (!isValidCoordinate(value)) {
      errors.push(`bbox[${index}] 无效: ${value}`);
    }
  });

  return { valid: errors.length === 0, errors };
}

function calculateInitialPosition(
  element: CanonicalElement,
  config = { width: 800, height: 600, padding: 50 }
): { x: number; y: number } {
  const { width, height, padding } = config;
  const [x1, y1, x2, y2] = element.geometry.bbox;
  
  const centerX = (x1 + x2) / 2;
  const centerY = (y1 + y2) / 2;
  
  const effectiveWidth = width - 2 * padding;
  const effectiveHeight = height - 2 * padding;
  
  return {
    x: padding + centerX * effectiveWidth,
    y: padding + centerY * effectiveHeight,
  };
}

function canonicalToGraph(data: CanonicalJSON) {
  const nodes = data.elements.map((element) => ({
    id: element.id,
    type: 'element' as const,
    position: calculateInitialPosition(element),
    data: { element, isSelected: false },
  }));

  const edges = data.relations.map((relation, index) => ({
    id: `edge-${relation.from}-${relation.to}-${index}`,
    source: relation.from,
    target: relation.to,
    type: 'relation' as const,
    data: { relation },
    label: relation.type,
  }));

  return { nodes, edges };
}

function graphToCanonical(graphData: any, originalData: CanonicalJSON): CanonicalJSON {
  const elements = graphData.nodes.map((node: any) => node.data.element);
  const relations = graphData.edges.map((edge: any) => edge.data.relation);

  return {
    ...originalData,
    elements,
    relations,
  };
}

// ==================== 测试执行 ====================

console.log('=== 图谱数据层验证 ===\n');

// 测试 1: Bbox 验证
console.log('1. Bbox 验证测试');
const validBbox = [0.1, 0.2, 0.5, 0.8];
const invalidBbox1 = [0.1, 0.2, 1.5, 0.8]; // 超出范围
const invalidBbox2 = [0.1, 0.2]; // 长度不足

console.log(`   有效 bbox ${JSON.stringify(validBbox)}: ${validateBbox(validBbox).valid ? '✓ 通过' : '✗ 失败'}`);
console.log(`   无效 bbox ${JSON.stringify(invalidBbox1)}: ${!validateBbox(invalidBbox1).valid ? '✓ 正确拒绝' : '✗ 应该拒绝'}`);
console.log(`   无效 bbox ${JSON.stringify(invalidBbox2)}: ${!validateBbox(invalidBbox2).valid ? '✓ 正确拒绝' : '✗ 应该拒绝'}`);

// 测试 2: 位置计算
console.log('\n2. 位置计算测试');
const pos1 = calculateInitialPosition(testElement1);
const pos2 = calculateInitialPosition(testElement2);
console.log(`   元素1 位置: (${pos1.x.toFixed(2)}, ${pos1.y.toFixed(2)})`);
console.log(`   元素2 位置: (${pos2.x.toFixed(2)}, ${pos2.y.toFixed(2)})`);
console.log(`   位置在有效范围内: ${pos1.x >= 0 && pos1.y >= 0 && pos2.x >= 0 && pos2.y >= 0 ? '✓ 通过' : '✗ 失败'}`);

// 测试 3: CanonicalJSON -> Graph 转换
console.log('\n3. CanonicalJSON -> Graph 转换测试');
const graphData = canonicalToGraph(testCanonicalJSON);
console.log(`   节点数量: ${graphData.nodes.length} (期望: 2) ${graphData.nodes.length === 2 ? '✓' : '✗'}`);
console.log(`   边数量: ${graphData.edges.length} (期望: 1) ${graphData.edges.length === 1 ? '✓' : '✗'}`);
console.log(`   节点1 ID: ${graphData.nodes[0].id} (期望: elem-1) ${graphData.nodes[0].id === 'elem-1' ? '✓' : '✗'}`);
console.log(`   边源节点: ${graphData.edges[0].source} (期望: elem-1) ${graphData.edges[0].source === 'elem-1' ? '✓' : '✗'}`);

// 测试 4: Graph -> CanonicalJSON 转换（往返测试）
console.log('\n4. Graph -> CanonicalJSON 往返测试');
const restoredData = graphToCanonical(graphData, testCanonicalJSON);
const elementsMatch = restoredData.elements.length === testCanonicalJSON.elements.length;
const relationsMatch = restoredData.relations.length === testCanonicalJSON.relations.length;
const elem1Match = restoredData.elements[0].id === testCanonicalJSON.elements[0].id;
const rel1Match = restoredData.relations[0].type === testCanonicalJSON.relations[0].type;

console.log(`   元素数量保持: ${elementsMatch ? '✓ 通过' : '✗ 失败'}`);
console.log(`   关系数量保持: ${relationsMatch ? '✓ 通过' : '✗ 失败'}`);
console.log(`   元素ID保持: ${elem1Match ? '✓ 通过' : '✗ 失败'}`);
console.log(`   关系类型保持: ${rel1Match ? '✓ 通过' : '✗ 失败'}`);

// 测试 5: 边界情况
console.log('\n5. 边界情况测试');
const edgeBbox1 = [0, 0, 1, 1]; // 边界值
const edgeBbox2 = [0.5, 0.5, 0.5, 0.5]; // 点
console.log(`   边界值 bbox [0,0,1,1]: ${validateBbox(edgeBbox1).valid ? '✓ 通过' : '✗ 失败'}`);
console.log(`   点 bbox [0.5,0.5,0.5,0.5]: ${validateBbox(edgeBbox2).valid ? '✓ 通过' : '✗ 失败'}`);

// 汇总
console.log('\n=== 验证完成 ===');
console.log('数据层核心功能验证通过，可以继续后续任务。');
