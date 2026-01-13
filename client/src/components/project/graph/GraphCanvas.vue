<script setup lang="ts">
/**
 * 图谱画布组件
 * 基于 Vue Flow 实现的图谱渲染和交互组件
 * 
 * 功能：
 * - 集成 Vue Flow 渲染引擎
 * - 注册自定义节点和边类型
 * - 实现节点拖拽
 * - 实现画布缩放和平移
 * - 实现节点/边点击事件
 * - 提供画布控制按钮（Zoom In/Out, Fit to View, Reset View）
 * 
 * Requirements: 1.5, 2.1, 2.2, 7.1, 7.2, 7.3, 7.4
 */
import { ref, computed, watch, onMounted } from 'vue';
import { 
  VueFlow, 
  useVueFlow, 
  MarkerType,
  type NodeMouseEvent,
  type NodeDragEvent,
  type EdgeMouseEvent,
  type Connection,
} from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import type { 
  CanonicalElement, 
  CanonicalRelation 
} from '@/types';
import type { 
  GraphNode, 
  GraphEdge, 
  NodePosition 
} from '@/utils/graphTransform';
import { canonicalToGraph } from '@/utils/graphTransform';
import { forceLayout, gridLayout, circularLayout, type ForceEdge } from '@/utils/forceLayout';
import ElementNode from './ElementNode.vue';
import RelationEdge from './RelationEdge.vue';

// ==================== Props ====================
interface Props {
  elements: CanonicalElement[];
  relations: CanonicalRelation[];
  selectedNodeId: string | null;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
});

// ==================== Emits ====================
const emit = defineEmits<{
  (e: 'node-click', nodeId: string): void;
  (e: 'node-drag', nodeId: string, position: NodePosition): void;
  (e: 'edge-click', edgeId: string): void;
  (e: 'edge-create', from: string, to: string): void;
  (e: 'edge-delete', edgeId: string): void;
}>();

// ==================== Vue Flow 实例 ====================
const { 
  fitView, 
  setViewport,
  zoomIn: vfZoomIn,
  zoomOut: vfZoomOut,
} = useVueFlow();

// ==================== 状态 ====================

/** 图谱节点 */
const nodes = ref<GraphNode[]>([]);

/** 图谱边 */
const edges = ref<GraphEdge[]>([]);

/** 节点位置缓存（保持用户拖拽后的位置） */
const nodePositions = ref<Record<string, NodePosition>>({});

/** 选中的边 ID */
const selectedEdgeId = ref<string | null>(null);

/** 画布配置 */
const canvasConfig = {
  width: 800,
  height: 600,
  padding: 50,
};

// ==================== 计算属性 ====================

/** 构建 CanonicalJSON 格式用于转换 */
const canonicalData = computed(() => ({
  meta: { schema_version: '1.0', output_language: 'zh', width: 1024, height: 1024 },
  scene: { summary: '', style: { genre: '', palette: '', rendering: '' }, camera: { shot: '', lens: '', angle: '', dof: '' }, lighting: { type: '', direction: '', contrast: '' } },
  elements: props.elements,
  relations: props.relations,
  edit_intent: { goal: '', negatives: [], safety: { avoid: [] } },
}));

/** 默认边标记（箭头） */
const defaultEdgeOptions = computed(() => ({
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 15,
    height: 15,
    color: '#888',
  },
}));

// ==================== 监听器 ====================

/** 监听数据变化，更新图谱 */
watch(
  () => [props.elements, props.relations],
  () => {
    updateGraphData();
  },
  { deep: true, immediate: true }
);

/** 监听选中节点变化 */
watch(
  () => props.selectedNodeId,
  (newId) => {
    // 更新节点选中状态
    nodes.value = nodes.value.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isSelected: node.id === newId,
      },
    }));
  }
);

// ==================== 方法 ====================

/** 更新图谱数据 */
function updateGraphData() {
  const graphData = canonicalToGraph(
    canonicalData.value,
    canvasConfig,
    nodePositions.value
  );
  
  // 保持选中状态
  nodes.value = graphData.nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      isSelected: node.id === props.selectedNodeId,
    },
  }));
  
  // 更新边，添加选中状态
  edges.value = graphData.edges.map((edge) => ({
    ...edge,
    data: {
      ...edge.data,
      isSelected: edge.id === selectedEdgeId.value,
    },
  }));
}

/** 处理节点点击 */
function onNodeClick(event: NodeMouseEvent) {
  emit('node-click', event.node.id);
}

/** 处理节点拖拽结束 */
function onNodeDragStop(event: NodeDragEvent) {
  if (props.readonly) return;
  
  const { id, position } = event.node;
  
  // 缓存新位置
  nodePositions.value[id] = { ...position };
  
  // 发出事件
  emit('node-drag', id, position);
}

/** 处理边点击 */
function onEdgeClick(event: EdgeMouseEvent) {
  const edgeId = event.edge.id;
  selectedEdgeId.value = edgeId;
  
  // 更新边选中状态
  edges.value = edges.value.map((edge) => ({
    ...edge,
    data: {
      ...edge.data,
      isSelected: edge.id === edgeId,
    },
  }));
  
  emit('edge-click', edgeId);
}

/** 处理连线创建 */
function onConnect(params: Connection) {
  if (props.readonly) return;
  if (params.source && params.target) {
    emit('edge-create', params.source, params.target);
  }
}

/** 处理画布点击（取消选中） */
function onPaneClick() {
  selectedEdgeId.value = null;
  
  // 取消边选中状态
  edges.value = edges.value.map((edge) => ({
    ...edge,
    data: {
      ...edge.data,
      isSelected: false,
    },
  }));
}

// ==================== 画布控制方法（暴露给父组件） ====================

/** 放大 */
function zoomIn() {
  vfZoomIn();
}

/** 缩小 */
function zoomOut() {
  vfZoomOut();
}

/** 适应视图 */
function fitToView() {
  fitView({ padding: 0.2, duration: 300 });
}

/** 重置视图 */
function resetView() {
  setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 });
}

/** 获取当前节点位置 */
function getNodePositions(): Record<string, NodePosition> {
  return { ...nodePositions.value };
}

/** 执行力导向自动布局 */
function autoLayout() {
  // 获取当前位置
  const currentPositions: Record<string, NodePosition> = {};
  for (const node of nodes.value) {
    currentPositions[node.id] = { ...node.position };
  }

  // 构建边列表
  const forceEdges: ForceEdge[] = props.relations.map((rel) => ({
    source: rel.from,
    target: rel.to,
  }));

  // 执行力导向布局
  const newPositions = forceLayout(currentPositions, forceEdges, {
    width: canvasConfig.width,
    height: canvasConfig.height,
    padding: canvasConfig.padding,
  });

  // 更新节点位置
  nodePositions.value = newPositions;
  nodes.value = nodes.value.map((node) => ({
    ...node,
    position: newPositions[node.id] ?? node.position,
  }));

  // 适应视图
  setTimeout(() => fitToView(), 50);
}

/** 执行网格布局 */
function applyGridLayout() {
  const nodeIds = nodes.value.map((n) => n.id);
  const newPositions = gridLayout(nodeIds, {
    width: canvasConfig.width,
    height: canvasConfig.height,
    padding: canvasConfig.padding,
  });

  nodePositions.value = newPositions;
  nodes.value = nodes.value.map((node) => ({
    ...node,
    position: newPositions[node.id] ?? node.position,
  }));

  setTimeout(() => fitToView(), 50);
}

/** 执行圆形布局 */
function applyCircularLayout() {
  const nodeIds = nodes.value.map((n) => n.id);
  const newPositions = circularLayout(nodeIds, {
    width: canvasConfig.width,
    height: canvasConfig.height,
    padding: canvasConfig.padding,
  });

  nodePositions.value = newPositions;
  nodes.value = nodes.value.map((node) => ({
    ...node,
    position: newPositions[node.id] ?? node.position,
  }));

  setTimeout(() => fitToView(), 50);
}

// ==================== 生命周期 ====================

onMounted(() => {
  // 初始化后自动适应视图
  setTimeout(() => {
    fitToView();
  }, 100);
});

// ==================== 暴露方法 ====================
defineExpose({
  zoomIn,
  zoomOut,
  fitToView,
  resetView,
  getNodePositions,
  autoLayout,
  applyGridLayout,
  applyCircularLayout,
});
</script>

<template>
  <div class="graph-canvas">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :default-edge-options="defaultEdgeOptions"
      :nodes-draggable="!readonly"
      :nodes-connectable="!readonly"
      :edges-updatable="!readonly"
      :pan-on-drag="true"
      :zoom-on-scroll="true"
      :zoom-on-pinch="true"
      :zoom-on-double-click="false"
      :prevent-scrolling="true"
      :min-zoom="0.1"
      :max-zoom="4"
      fit-view-on-init
      class="graph-canvas__flow"
      @node-click="onNodeClick"
      @node-drag-stop="onNodeDragStop"
      @edge-click="onEdgeClick"
      @connect="onConnect"
      @pane-click="onPaneClick"
    >
      <!-- 背景网格 -->
      <Background 
        :gap="20" 
        :size="1" 
        pattern-color="#333"
      />
      
      <!-- 自定义节点模板 -->
      <template #node-element="nodeProps">
        <ElementNode v-bind="nodeProps" />
      </template>
      
      <!-- 自定义边模板 -->
      <template #edge-relation="edgeProps">
        <RelationEdge v-bind="edgeProps" />
      </template>
    </VueFlow>
    
    <!-- 画布控制按钮 -->
    <div class="canvas-controls">
      <button 
        class="canvas-controls__btn" 
        title="放大 (Zoom In)"
        @click="zoomIn"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          <line x1="11" y1="8" x2="11" y2="14"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </button>
      
      <button 
        class="canvas-controls__btn" 
        title="缩小 (Zoom Out)"
        @click="zoomOut"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </button>
      
      <div class="canvas-controls__divider"></div>
      
      <button 
        class="canvas-controls__btn" 
        title="适应视图 (Fit to View)"
        @click="fitToView"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
          <path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
          <path d="M3 16v3a2 2 0 0 0 2 2h3"/>
          <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
        </svg>
      </button>
      
      <button 
        class="canvas-controls__btn" 
        title="重置视图 (Reset View)"
        @click="resetView"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
      </button>
      
      <div class="canvas-controls__divider"></div>
      
      <button 
        class="canvas-controls__btn" 
        title="自动布局 (Auto Layout)"
        @click="autoLayout"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="1"/>
          <circle cx="19" cy="12" r="1"/>
          <circle cx="5" cy="12" r="1"/>
          <circle cx="12" cy="5" r="1"/>
          <circle cx="12" cy="19" r="1"/>
          <line x1="12" y1="6" x2="12" y2="11"/>
          <line x1="12" y1="13" x2="12" y2="18"/>
          <line x1="6" y1="12" x2="11" y2="12"/>
          <line x1="13" y1="12" x2="18" y2="12"/>
        </svg>
      </button>
      
      <button 
        class="canvas-controls__btn" 
        title="网格布局 (Grid Layout)"
        @click="applyGridLayout"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
      </button>
      
      <button 
        class="canvas-controls__btn" 
        title="圆形布局 (Circular Layout)"
        @click="applyCircularLayout"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <circle cx="12" cy="5" r="2"/>
          <circle cx="19" cy="12" r="2"/>
          <circle cx="12" cy="19" r="2"/>
          <circle cx="5" cy="12" r="2"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.graph-canvas {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: #0d0d1a;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.graph-canvas__flow {
  width: 100%;
  height: 100%;
}

/* 画布控制按钮 */
.canvas-controls {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(26, 26, 46, 0.95);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 6px;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.canvas-controls__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #888;
  cursor: pointer;
  transition: all 0.2s ease;
}

.canvas-controls__btn:hover {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.canvas-controls__btn:active {
  background: rgba(59, 130, 246, 0.25);
  transform: scale(0.95);
}

.canvas-controls__divider {
  width: 100%;
  height: 1px;
  background: #333;
  margin: 4px 0;
}

/* Vue Flow 默认样式覆盖 */
:deep(.vue-flow__pane) {
  cursor: grab;
}

:deep(.vue-flow__pane:active) {
  cursor: grabbing;
}

:deep(.vue-flow__node) {
  cursor: pointer;
}

:deep(.vue-flow__node.dragging) {
  cursor: grabbing;
}

:deep(.vue-flow__edge) {
  cursor: pointer;
}

:deep(.vue-flow__connection-line) {
  stroke: #3b82f6;
  stroke-width: 2;
  stroke-dasharray: 5, 5;
}

:deep(.vue-flow__handle) {
  opacity: 0;
  transition: opacity 0.2s ease;
}

:deep(.vue-flow__node:hover .vue-flow__handle) {
  opacity: 1;
}

/* 选中节点时始终显示连接点 */
:deep(.vue-flow__node.selected .vue-flow__handle) {
  opacity: 1;
}

/* 背景样式 */
:deep(.vue-flow__background) {
  background-color: #0d0d1a;
}

/* 小地图样式（如果需要） */
:deep(.vue-flow__minimap) {
  background: #1a1a2e;
  border: 1px solid #333;
  border-radius: 4px;
}

:deep(.vue-flow__minimap-mask) {
  fill: rgba(59, 130, 246, 0.1);
}

:deep(.vue-flow__minimap-node) {
  fill: #3b82f6;
}
</style>
