/**
 * 图谱数据转换工具
 * 实现 CanonicalJSON 与 Vue Flow 格式之间的双向转换
 */

import type {
  CanonicalJSON,
  CanonicalElement,
  CanonicalRelation,
  ElementType,
  RelationType,
} from '@/types';
import { smartLayout, type ForceEdge } from './forceLayout';

// ==================== Vue Flow 类型定义 ====================

/** Vue Flow 节点位置 */
export interface NodePosition {
  x: number;
  y: number;
}

/** Vue Flow 节点数据 */
export interface ElementNodeData {
  element: CanonicalElement;
  isSelected: boolean;
}

/** Vue Flow 节点 */
export interface GraphNode {
  id: string;
  type: 'element';
  position: NodePosition;
  data: ElementNodeData;
}

/** Vue Flow 边数据 */
export interface RelationEdgeData {
  relation: CanonicalRelation;
}

/** Vue Flow 边 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'relation';
  data: RelationEdgeData;
  label: string;
  animated?: boolean;
}

/** 图谱数据 */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** 画布尺寸配置 */
export interface CanvasConfig {
  width: number;
  height: number;
  padding: number;
}

// ==================== 默认配置 ====================

const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
  width: 800,
  height: 600,
  padding: 50,
};

// ==================== 节点样式配置 ====================

export interface NodeStyle {
  color: string;
  icon: string;
}

export const NODE_STYLES: Record<ElementType, NodeStyle> = {
  subject: { color: '#3b82f6', icon: 'user' },
  object: { color: '#10b981', icon: 'box' },
  text: { color: '#f59e0b', icon: 'type' },
  background: { color: '#6366f1', icon: 'image' },
  effect: { color: '#ec4899', icon: 'sparkles' },
};

// ==================== 边样式配置 ====================

export interface EdgeStyle {
  color: string;
  strokeDasharray: string;
}

export const EDGE_STYLES: Record<RelationType, EdgeStyle> = {
  occludes: { color: '#ef4444', strokeDasharray: 'none' },
  attached_to: { color: '#3b82f6', strokeDasharray: '5,5' },
  in_front_of: { color: '#10b981', strokeDasharray: 'none' },
  part_of: { color: '#8b5cf6', strokeDasharray: '2,2' },
};

// ==================== 位置计算 ====================

/**
 * 根据元素的 bbox 计算节点在画布上的初始位置
 * bbox 格式: [x1, y1, x2, y2]，值范围 [0, 1]
 * 
 * @param element - 场景元素
 * @param config - 画布配置
 * @returns 节点位置
 */
export function calculateInitialPosition(
  element: CanonicalElement,
  config: CanvasConfig = DEFAULT_CANVAS_CONFIG
): NodePosition {
  const { width, height, padding } = config;
  const [x1, y1, x2, y2] = element.geometry.bbox;
  
  // 计算 bbox 中心点
  const centerX = (x1 + x2) / 2;
  const centerY = (y1 + y2) / 2;
  
  // 映射到画布坐标系（考虑 padding）
  const effectiveWidth = width - 2 * padding;
  const effectiveHeight = height - 2 * padding;
  
  return {
    x: padding + centerX * effectiveWidth,
    y: padding + centerY * effectiveHeight,
  };
}

// ==================== CanonicalJSON -> Vue Flow ====================

/**
 * 将 CanonicalJSON 转换为 Vue Flow 图谱格式
 * 
 * @param data - CanonicalJSON 数据
 * @param config - 画布配置
 * @param nodePositions - 可选的节点位置覆盖（用于保持用户拖拽后的位置）
 * @param autoLayout - 是否自动执行力导向布局（默认 true）
 * @returns Vue Flow 图谱数据
 */
export function canonicalToGraph(
  data: CanonicalJSON,
  config: CanvasConfig = DEFAULT_CANVAS_CONFIG,
  nodePositions?: Record<string, NodePosition>,
  autoLayout: boolean = true
): GraphData {
  // 检查是否有有效的位置缓存（至少有一个节点的位置）
  const hasValidPositionCache = nodePositions && Object.keys(nodePositions).length > 0;
  
  // 计算初始位置
  let positions: Record<string, NodePosition> = {};
  
  for (const element of data.elements) {
    // 优先使用传入的位置，否则根据 bbox 计算
    positions[element.id] = (hasValidPositionCache && nodePositions[element.id])
      ? nodePositions[element.id]
      : calculateInitialPosition(element, config);
  }

  // 如果启用自动布局且没有有效的位置缓存，执行力导向布局
  if (autoLayout && !hasValidPositionCache) {
    const forceEdges: ForceEdge[] = data.relations.map((rel) => ({
      source: rel.from,
      target: rel.to,
    }));

    positions = smartLayout(positions, forceEdges, {
      width: config.width,
      height: config.height,
      padding: config.padding,
    });
  }

  // 转换元素为节点
  const nodes: GraphNode[] = data.elements.map((element) => ({
    id: element.id,
    type: 'element' as const,
    position: positions[element.id],
    data: {
      element,
      isSelected: false,
    },
  }));

  // 转换关系为边
  const edges: GraphEdge[] = data.relations.map((relation, index) => ({
    id: `edge-${relation.from}-${relation.to}-${index}`,
    source: relation.from,
    target: relation.to,
    type: 'relation' as const,
    data: { relation },
    label: relation.type,
    animated: false,
  }));

  return { nodes, edges };
}

// ==================== Vue Flow -> CanonicalJSON ====================

/**
 * 从 Vue Flow 图谱数据更新 CanonicalJSON
 * 注意：此函数不修改节点位置相关数据，因为位置不存储在 CanonicalJSON 中
 * 
 * @param graphData - Vue Flow 图谱数据
 * @param originalData - 原始 CanonicalJSON 数据
 * @returns 更新后的 CanonicalJSON
 */
export function graphToCanonical(
  graphData: GraphData,
  originalData: CanonicalJSON
): CanonicalJSON {
  // 从节点提取元素
  const elements: CanonicalElement[] = graphData.nodes.map(
    (node) => node.data.element
  );

  // 从边提取关系
  const relations: CanonicalRelation[] = graphData.edges.map(
    (edge) => edge.data.relation
  );

  // 返回更新后的 CanonicalJSON，保持其他字段不变
  return {
    ...originalData,
    elements,
    relations,
  };
}

// ==================== 辅助函数 ====================

/**
 * 从图谱数据中提取节点位置映射
 * 用于保存用户拖拽后的位置
 * 
 * @param graphData - Vue Flow 图谱数据
 * @returns 节点 ID 到位置的映射
 */
export function extractNodePositions(
  graphData: GraphData
): Record<string, NodePosition> {
  const positions: Record<string, NodePosition> = {};
  
  for (const node of graphData.nodes) {
    positions[node.id] = { ...node.position };
  }
  
  return positions;
}

/**
 * 更新图谱中单个节点的位置
 * 
 * @param graphData - 当前图谱数据
 * @param nodeId - 要更新的节点 ID
 * @param position - 新位置
 * @returns 更新后的图谱数据
 */
export function updateNodePosition(
  graphData: GraphData,
  nodeId: string,
  position: NodePosition
): GraphData {
  return {
    ...graphData,
    nodes: graphData.nodes.map((node) =>
      node.id === nodeId
        ? { ...node, position: { ...position } }
        : node
    ),
  };
}

/**
 * 更新图谱中单个节点的选中状态
 * 
 * @param graphData - 当前图谱数据
 * @param nodeId - 要选中的节点 ID（null 表示取消所有选中）
 * @returns 更新后的图谱数据
 */
export function updateNodeSelection(
  graphData: GraphData,
  nodeId: string | null
): GraphData {
  return {
    ...graphData,
    nodes: graphData.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isSelected: node.id === nodeId,
      },
    })),
  };
}

/**
 * 在图谱中添加新的边（关系）
 * 
 * @param graphData - 当前图谱数据
 * @param from - 源节点 ID
 * @param to - 目标节点 ID
 * @param type - 关系类型
 * @returns 更新后的图谱数据
 */
export function addEdge(
  graphData: GraphData,
  from: string,
  to: string,
  type: RelationType
): GraphData {
  const newRelation: CanonicalRelation = { from, to, type };
  const edgeIndex = graphData.edges.length;
  
  const newEdge: GraphEdge = {
    id: `edge-${from}-${to}-${edgeIndex}`,
    source: from,
    target: to,
    type: 'relation',
    data: { relation: newRelation },
    label: type,
    animated: false,
  };

  return {
    ...graphData,
    edges: [...graphData.edges, newEdge],
  };
}

/**
 * 从图谱中删除边（关系）
 * 
 * @param graphData - 当前图谱数据
 * @param edgeId - 要删除的边 ID
 * @returns 更新后的图谱数据
 */
export function removeEdge(
  graphData: GraphData,
  edgeId: string
): GraphData {
  return {
    ...graphData,
    edges: graphData.edges.filter((edge) => edge.id !== edgeId),
  };
}

/**
 * 更新图谱中节点的元素数据
 * 
 * @param graphData - 当前图谱数据
 * @param nodeId - 节点 ID
 * @param element - 更新后的元素数据
 * @returns 更新后的图谱数据
 */
export function updateNodeElement(
  graphData: GraphData,
  nodeId: string,
  element: CanonicalElement
): GraphData {
  return {
    ...graphData,
    nodes: graphData.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              element,
            },
          }
        : node
    ),
  };
}

/**
 * 获取节点的样式配置
 * 
 * @param elementType - 元素类型
 * @returns 节点样式
 */
export function getNodeStyle(elementType: ElementType): NodeStyle {
  return NODE_STYLES[elementType] ?? NODE_STYLES.object;
}

/**
 * 获取边的样式配置
 * 
 * @param relationType - 关系类型
 * @returns 边样式
 */
export function getEdgeStyle(relationType: RelationType): EdgeStyle {
  return EDGE_STYLES[relationType] ?? EDGE_STYLES.attached_to;
}
