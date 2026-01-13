/**
 * 力导向布局算法
 * 实现节点自动分散，防止重叠
 */

import type { NodePosition } from './graphTransform';

// ==================== 类型定义 ====================

/** 力导向布局节点 */
export interface ForceNode {
  id: string;
  x: number;
  y: number;
  vx: number;  // x方向速度
  vy: number;  // y方向速度
  width: number;
  height: number;
  fixed?: boolean;  // 是否固定位置
}

/** 力导向布局边 */
export interface ForceEdge {
  source: string;
  target: string;
}

/** 布局配置 */
export interface ForceLayoutConfig {
  /** 画布宽度 */
  width: number;
  /** 画布高度 */
  height: number;
  /** 画布边距 */
  padding: number;
  /** 节点默认宽度 */
  nodeWidth: number;
  /** 节点默认高度 */
  nodeHeight: number;
  /** 斥力强度 */
  repulsionStrength: number;
  /** 引力强度（边连接的节点） */
  attractionStrength: number;
  /** 理想边长度 */
  idealEdgeLength: number;
  /** 中心引力强度 */
  centerGravity: number;
  /** 阻尼系数（0-1，越大衰减越快） */
  damping: number;
  /** 最大迭代次数 */
  maxIterations: number;
  /** 最小移动阈值（低于此值认为稳定） */
  minMovement: number;
  /** 最小节点间距 */
  minNodeSpacing: number;
}

/** 默认配置 */
const DEFAULT_CONFIG: ForceLayoutConfig = {
  width: 800,
  height: 600,
  padding: 80,
  nodeWidth: 160,
  nodeHeight: 80,
  repulsionStrength: 8000,
  attractionStrength: 0.05,
  idealEdgeLength: 200,
  centerGravity: 0.01,
  damping: 0.85,
  maxIterations: 300,
  minMovement: 0.5,
  minNodeSpacing: 40,
};

// ==================== 核心算法 ====================

/**
 * 计算两点之间的距离
 */
function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 检测两个节点是否重叠
 */
function nodesOverlap(
  n1: ForceNode,
  n2: ForceNode,
  spacing: number
): boolean {
  const halfW1 = n1.width / 2 + spacing / 2;
  const halfH1 = n1.height / 2 + spacing / 2;
  const halfW2 = n2.width / 2 + spacing / 2;
  const halfH2 = n2.height / 2 + spacing / 2;

  return (
    Math.abs(n1.x - n2.x) < halfW1 + halfW2 &&
    Math.abs(n1.y - n2.y) < halfH1 + halfH2
  );
}

/**
 * 计算节点之间的斥力
 */
function calculateRepulsion(
  nodes: ForceNode[],
  config: ForceLayoutConfig
): void {
  const { repulsionStrength, minNodeSpacing } = config;

  for (let i = 0; i < nodes.length; i++) {
    const nodeA = nodes[i];
    if (nodeA.fixed) continue;

    for (let j = i + 1; j < nodes.length; j++) {
      const nodeB = nodes[j];

      const dx = nodeA.x - nodeB.x;
      const dy = nodeA.y - nodeB.y;
      let dist = distance(nodeA.x, nodeA.y, nodeB.x, nodeB.y);

      // 防止距离为0
      if (dist < 1) dist = 1;

      // 计算最小安全距离（基于节点尺寸）
      const minDist = (nodeA.width + nodeB.width) / 2 + minNodeSpacing;

      // 如果节点重叠或太近，增加斥力
      let force: number;
      if (dist < minDist) {
        // 重叠时使用更强的斥力
        force = repulsionStrength * 2 / (dist * dist);
      } else {
        // 正常斥力（库仑力）
        force = repulsionStrength / (dist * dist);
      }

      // 计算力的分量
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      // 应用力到节点
      if (!nodeA.fixed) {
        nodeA.vx += fx;
        nodeA.vy += fy;
      }
      if (!nodeB.fixed) {
        nodeB.vx -= fx;
        nodeB.vy -= fy;
      }
    }
  }
}

/**
 * 计算边的引力（弹簧力）
 */
function calculateAttraction(
  _nodes: ForceNode[],
  edges: ForceEdge[],
  nodeMap: Map<string, ForceNode>,
  config: ForceLayoutConfig
): void {
  const { attractionStrength, idealEdgeLength } = config;

  for (const edge of edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);

    if (!source || !target) continue;

    const dx = target.x - source.x;
    const dy = target.y - source.y;
    let dist = distance(source.x, source.y, target.x, target.y);

    if (dist < 1) dist = 1;

    // 弹簧力：F = k * (d - d0)
    const displacement = dist - idealEdgeLength;
    const force = attractionStrength * displacement;

    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;

    if (!source.fixed) {
      source.vx += fx;
      source.vy += fy;
    }
    if (!target.fixed) {
      target.vx -= fx;
      target.vy -= fy;
    }
  }
}

/**
 * 计算中心引力（防止节点飘散）
 */
function calculateCenterGravity(
  nodes: ForceNode[],
  config: ForceLayoutConfig
): void {
  const { width, height, centerGravity } = config;
  const centerX = width / 2;
  const centerY = height / 2;

  for (const node of nodes) {
    if (node.fixed) continue;

    const dx = centerX - node.x;
    const dy = centerY - node.y;

    node.vx += dx * centerGravity;
    node.vy += dy * centerGravity;
  }
}

/**
 * 应用速度并约束边界
 */
function applyVelocity(
  nodes: ForceNode[],
  config: ForceLayoutConfig
): number {
  const { width, height, padding, damping } = config;
  let totalMovement = 0;

  const minX = padding;
  const maxX = width - padding;
  const minY = padding;
  const maxY = height - padding;

  for (const node of nodes) {
    if (node.fixed) continue;

    // 应用阻尼
    node.vx *= damping;
    node.vy *= damping;

    // 限制最大速度
    const maxVelocity = 50;
    const velocity = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
    if (velocity > maxVelocity) {
      node.vx = (node.vx / velocity) * maxVelocity;
      node.vy = (node.vy / velocity) * maxVelocity;
    }

    // 更新位置
    const dx = node.vx;
    const dy = node.vy;
    node.x += dx;
    node.y += dy;

    // 边界约束
    const halfW = node.width / 2;
    const halfH = node.height / 2;
    node.x = Math.max(minX + halfW, Math.min(maxX - halfW, node.x));
    node.y = Math.max(minY + halfH, Math.min(maxY - halfH, node.y));

    totalMovement += Math.abs(dx) + Math.abs(dy);
  }

  return totalMovement;
}

/**
 * 执行力导向布局
 * 
 * @param positions - 初始节点位置 { id: { x, y } }
 * @param edges - 边列表 [{ source, target }]
 * @param config - 布局配置（可选）
 * @returns 布局后的节点位置
 */
export function forceLayout(
  positions: Record<string, NodePosition>,
  edges: ForceEdge[],
  config: Partial<ForceLayoutConfig> = {}
): Record<string, NodePosition> {
  const cfg: ForceLayoutConfig = { ...DEFAULT_CONFIG, ...config };

  // 初始化节点
  const nodes: ForceNode[] = Object.entries(positions).map(([id, pos]) => ({
    id,
    x: pos.x,
    y: pos.y,
    vx: 0,
    vy: 0,
    width: cfg.nodeWidth,
    height: cfg.nodeHeight,
    fixed: false,
  }));

  // 如果只有一个节点，直接返回居中位置
  if (nodes.length <= 1) {
    if (nodes.length === 1) {
      return {
        [nodes[0].id]: {
          x: cfg.width / 2,
          y: cfg.height / 2,
        },
      };
    }
    return positions;
  }

  // 创建节点映射
  const nodeMap = new Map<string, ForceNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // 迭代计算
  for (let i = 0; i < cfg.maxIterations; i++) {
    // 重置速度
    for (const node of nodes) {
      if (!node.fixed) {
        node.vx = 0;
        node.vy = 0;
      }
    }

    // 计算各种力
    calculateRepulsion(nodes, cfg);
    calculateAttraction(nodes, edges, nodeMap, cfg);
    calculateCenterGravity(nodes, cfg);

    // 应用速度
    const movement = applyVelocity(nodes, cfg);

    // 检查是否稳定
    if (movement < cfg.minMovement * nodes.length) {
      break;
    }
  }

  // 返回最终位置
  const result: Record<string, NodePosition> = {};
  for (const node of nodes) {
    result[node.id] = { x: node.x, y: node.y };
  }

  return result;
}

/**
 * 检测节点是否有重叠
 * 
 * @param positions - 节点位置
 * @param nodeWidth - 节点宽度
 * @param nodeHeight - 节点高度
 * @param spacing - 最小间距
 * @returns 是否有重叠
 */
export function hasOverlap(
  positions: Record<string, NodePosition>,
  nodeWidth: number = 160,
  nodeHeight: number = 80,
  spacing: number = 20
): boolean {
  const entries = Object.entries(positions);

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [, pos1] = entries[i];
      const [, pos2] = entries[j];

      const n1: ForceNode = {
        id: '',
        x: pos1.x,
        y: pos1.y,
        vx: 0,
        vy: 0,
        width: nodeWidth,
        height: nodeHeight,
      };

      const n2: ForceNode = {
        id: '',
        x: pos2.x,
        y: pos2.y,
        vx: 0,
        vy: 0,
        width: nodeWidth,
        height: nodeHeight,
      };

      if (nodesOverlap(n1, n2, spacing)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 智能布局：仅在检测到重叠时执行力导向布局
 * 
 * @param positions - 初始节点位置
 * @param edges - 边列表
 * @param config - 布局配置
 * @returns 布局后的节点位置
 */
export function smartLayout(
  positions: Record<string, NodePosition>,
  edges: ForceEdge[],
  config: Partial<ForceLayoutConfig> = {}
): Record<string, NodePosition> {
  const cfg: ForceLayoutConfig = { ...DEFAULT_CONFIG, ...config };

  // 检测是否有重叠
  if (!hasOverlap(positions, cfg.nodeWidth, cfg.nodeHeight, cfg.minNodeSpacing)) {
    return positions;
  }

  // 有重叠，执行力导向布局
  return forceLayout(positions, edges, config);
}

/**
 * 网格布局：将节点排列成网格
 * 适用于节点数量较多且没有明显层次关系的情况
 * 
 * @param nodeIds - 节点ID列表
 * @param config - 布局配置
 * @returns 节点位置
 */
export function gridLayout(
  nodeIds: string[],
  config: Partial<ForceLayoutConfig> = {}
): Record<string, NodePosition> {
  const cfg: ForceLayoutConfig = { ...DEFAULT_CONFIG, ...config };
  const { width, height, padding, nodeWidth, nodeHeight, minNodeSpacing } = cfg;

  const effectiveWidth = width - 2 * padding;
  const effectiveHeight = height - 2 * padding;

  const cellWidth = nodeWidth + minNodeSpacing;
  const cellHeight = nodeHeight + minNodeSpacing;

  const cols = Math.max(1, Math.floor(effectiveWidth / cellWidth));
  const rows = Math.ceil(nodeIds.length / cols);

  // 计算实际使用的宽高
  const actualWidth = Math.min(cols, nodeIds.length) * cellWidth;
  const actualHeight = rows * cellHeight;

  // 居中偏移
  const offsetX = padding + (effectiveWidth - actualWidth) / 2 + cellWidth / 2;
  const offsetY = padding + (effectiveHeight - actualHeight) / 2 + cellHeight / 2;

  const result: Record<string, NodePosition> = {};

  nodeIds.forEach((id, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    result[id] = {
      x: offsetX + col * cellWidth,
      y: offsetY + row * cellHeight,
    };
  });

  return result;
}

/**
 * 圆形布局：将节点排列成圆形
 * 适用于展示节点之间的关系
 * 
 * @param nodeIds - 节点ID列表
 * @param config - 布局配置
 * @returns 节点位置
 */
export function circularLayout(
  nodeIds: string[],
  config: Partial<ForceLayoutConfig> = {}
): Record<string, NodePosition> {
  const cfg: ForceLayoutConfig = { ...DEFAULT_CONFIG, ...config };
  const { width, height, padding } = cfg;

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - padding - cfg.nodeWidth / 2;

  const result: Record<string, NodePosition> = {};

  if (nodeIds.length === 1) {
    result[nodeIds[0]] = { x: centerX, y: centerY };
    return result;
  }

  const angleStep = (2 * Math.PI) / nodeIds.length;

  nodeIds.forEach((id, index) => {
    const angle = index * angleStep - Math.PI / 2; // 从顶部开始
    result[id] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  return result;
}
