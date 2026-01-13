<script setup lang="ts">
/**
 * 图谱JSON编辑器组件
 * 替换现有的JsonEditor.vue，作为图谱编辑器的入口组件
 * 
 * 功能：
 * - 集成所有子组件（GraphCanvas, NodeDetailPanel, ViewSwitcher）
 * - 实现视图切换逻辑（Graph View / JSON View）
 * - 实现数据双向同步
 * - 实现保存/重置功能
 * - 实现修改状态追踪
 * 
 * Requirements: 5.2, 5.3, 6.1, 6.2, 6.3
 */
import { ref, computed, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue';
import * as monaco from 'monaco-editor';
import type { 
  CanonicalJSON, 
  CanonicalElement, 
  CanonicalRelation,
  RelationType,
} from '@/types';
import type { NodePosition, GraphData } from '@/utils/graphTransform';
import { canonicalToGraph } from '@/utils/graphTransform';
import { validateGraphData } from '@/utils/graphValidation';
import GraphCanvas from './graph/GraphCanvas.vue';
import NodeDetailPanel from './graph/NodeDetailPanel.vue';
import ViewSwitcher from './graph/ViewSwitcher.vue';
import RelationTypeSelector from './graph/RelationTypeSelector.vue';

// ==================== Props ====================
interface Props {
  modelValue: CanonicalJSON | null;
  readonly?: boolean;
  saving?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  saving: false,
});

// ==================== Emits ====================
const emit = defineEmits<{
  (e: 'update:modelValue', value: CanonicalJSON): void;
  (e: 'save', jsonString: string): void;
  (e: 'error', error: string): void;
}>();

// ==================== 状态 ====================

/** 当前视图模式 */
const viewMode = ref<'graph' | 'json'>('graph');

/** 选中的节点ID */
const selectedNodeId = ref<string | null>(null);

/** 是否有未保存的修改 */
const hasChanges = ref(false);

/** JSON解析错误 */
const parseError = ref<string | null>(null);

/** 内部数据（深拷贝，避免直接修改props） */
const internalData = ref<CanonicalJSON | null>(null);

/** 图谱数据 */
const graphData = ref<GraphData>({ nodes: [], edges: [] });

/** 节点位置缓存 */
const nodePositions = ref<Record<string, NodePosition>>({});

/** Monaco编辑器容器 */
const editorContainer = ref<HTMLDivElement | null>(null);

/** Monaco编辑器实例 */
const editor = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null);

/** JSON编辑器内容 */
const jsonContent = ref('');

/** GraphCanvas组件引用 */
const graphCanvasRef = ref<InstanceType<typeof GraphCanvas> | null>(null);

/** 关系类型选择器状态 */
const relationSelector = ref<{
  visible: boolean;
  position: { x: number; y: number };
  from: string;
  to: string;
}>({
  visible: false,
  position: { x: 0, y: 0 },
  from: '',
  to: '',
});

// ==================== 计算属性 ====================

/** 当前选中的元素 */
const selectedElement = computed<CanonicalElement | null>(() => {
  if (!selectedNodeId.value || !internalData.value) return null;
  return internalData.value.elements.find(el => el.id === selectedNodeId.value) ?? null;
});

/** 所有元素 */
const elements = computed<CanonicalElement[]>(() => {
  return internalData.value?.elements ?? [];
});

/** 所有关系 */
const relations = computed<CanonicalRelation[]>(() => {
  return internalData.value?.relations ?? [];
});

/** 是否有JSON验证错误 */
const hasValidationError = computed(() => !!parseError.value);

// ==================== 监听器 ====================

/** 监听外部数据变化 */
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      // 深拷贝避免直接修改props
      internalData.value = JSON.parse(JSON.stringify(newValue));
      updateGraphFromData();
      
      // 如果在JSON视图，更新编辑器内容
      if (viewMode.value === 'json' && editor.value) {
        const newContent = formatJson(internalData.value);
        if (newContent !== editor.value.getValue()) {
          editor.value.setValue(newContent);
        }
      }
      
      hasChanges.value = false;
      parseError.value = null;
    } else {
      internalData.value = null;
      graphData.value = { nodes: [], edges: [] };
    }
  },
  { immediate: true, deep: true }
);

/** 监听视图模式变化 */
watch(viewMode, (newMode, oldMode) => {
  if (newMode === 'json' && oldMode === 'graph') {
    // 从图谱视图切换到JSON视图
    syncJsonFromGraph();
    initMonacoEditor();
  } else if (newMode === 'graph' && oldMode === 'json') {
    // 从JSON视图切换到图谱视图
    syncGraphFromJson();
    disposeMonacoEditor();
  }
});

// ==================== 生命周期 ====================

onMounted(() => {
  // 如果初始是JSON视图，初始化编辑器
  if (viewMode.value === 'json') {
    initMonacoEditor();
  }
});

onBeforeUnmount(() => {
  disposeMonacoEditor();
});

// ==================== 方法 ====================

/** 格式化JSON */
function formatJson(value: CanonicalJSON | null): string {
  if (!value) return '{}';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '{}';
  }
}

/** 从内部数据更新图谱 */
function updateGraphFromData() {
  if (!internalData.value) {
    graphData.value = { nodes: [], edges: [] };
    return;
  }
  
  graphData.value = canonicalToGraph(
    internalData.value,
    { width: 800, height: 600, padding: 50 },
    nodePositions.value
  );
}

/** 从图谱同步到JSON编辑器 */
function syncJsonFromGraph() {
  if (!internalData.value) return;
  jsonContent.value = formatJson(internalData.value);
}

/** 从JSON编辑器同步到图谱 */
function syncGraphFromJson() {
  if (!jsonContent.value) return;
  
  try {
    const parsed = JSON.parse(jsonContent.value) as CanonicalJSON;
    internalData.value = parsed;
    updateGraphFromData();
    parseError.value = null;
  } catch (err) {
    if (err instanceof SyntaxError) {
      parseError.value = err.message;
    } else {
      parseError.value = '无效的JSON格式';
    }
  }
}

/** 初始化Monaco编辑器 */
function initMonacoEditor() {
  // 等待DOM更新
  setTimeout(() => {
    if (!editorContainer.value || editor.value) return;
    
    // 配置Monaco主题
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.lineHighlightBackground': '#2a2a2a',
      },
    });
    
    // 创建编辑器实例
    editor.value = monaco.editor.create(editorContainer.value, {
      value: formatJson(internalData.value),
      language: 'json',
      theme: 'custom-dark',
      readOnly: props.readonly,
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 13,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      tabSize: 2,
      formatOnPaste: true,
      formatOnType: true,
      folding: true,
      foldingStrategy: 'indentation',
      renderLineHighlight: 'line',
      scrollbar: {
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
      },
    });
    
    // 监听内容变化
    editor.value.onDidChangeModelContent(() => {
      const content = editor.value?.getValue() || '';
      jsonContent.value = content;
      hasChanges.value = true;
      validateJson(content);
    });
    
    jsonContent.value = formatJson(internalData.value);
  }, 0);
}

/** 销毁Monaco编辑器 */
function disposeMonacoEditor() {
  if (editor.value) {
    editor.value.dispose();
    editor.value = null;
  }
}

/** 验证JSON */
function validateJson(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    
    // 验证数据结构
    if (parsed.elements && parsed.relations) {
      const result = validateGraphData(parsed.elements, parsed.relations);
      if (!result.valid) {
        const errorMessages = result.errors
          .filter(e => e.severity === 'error')
          .slice(0, 3)
          .map(e => e.message)
          .join('; ');
        parseError.value = errorMessages || '数据验证失败';
        return false;
      }
    }
    
    parseError.value = null;
    return true;
  } catch (err) {
    if (err instanceof SyntaxError) {
      parseError.value = err.message;
    } else {
      parseError.value = '无效的JSON格式';
    }
    return false;
  }
}

/** 标记数据已修改 */
function markAsModified() {
  hasChanges.value = true;
}

/** 处理节点点击 */
function handleNodeClick(nodeId: string) {
  selectedNodeId.value = nodeId;
}

/** 处理节点拖拽 */
function handleNodeDrag(nodeId: string, position: NodePosition) {
  nodePositions.value[nodeId] = { ...position };
  // 节点位置变化不标记为数据修改（位置不存储在CanonicalJSON中）
}

/** 处理边点击 */
function handleEdgeClick(edgeId: string) {
  // 可以在这里实现边的选中逻辑
  console.log('Edge clicked:', edgeId);
}

/** 处理边创建请求 */
function handleEdgeCreate(from: string, to: string) {
  // 显示关系类型选择器
  relationSelector.value = {
    visible: true,
    position: { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 100 },
    from,
    to,
  };
}

/** 处理关系类型选择 */
function handleRelationTypeSelect(type: RelationType) {
  if (!internalData.value) return;
  
  const { from, to } = relationSelector.value;
  
  // 添加新关系
  const newRelation: CanonicalRelation = { from, to, type };
  internalData.value.relations = [...internalData.value.relations, newRelation];
  
  // 更新图谱
  updateGraphFromData();
  markAsModified();
  
  // 关闭选择器
  relationSelector.value.visible = false;
}

/** 取消关系类型选择 */
function handleRelationTypeCancel() {
  relationSelector.value.visible = false;
}

/** 处理边删除 */
function handleEdgeDelete(edgeId: string) {
  if (!internalData.value) return;
  
  // 从边ID解析关系信息
  // 边ID格式: edge-{from}-{to}-{index}
  const parts = edgeId.split('-');
  if (parts.length >= 4) {
    const from = parts[1];
    const to = parts[2];
    
    // 找到并删除对应的关系
    const relationIndex = internalData.value.relations.findIndex(
      rel => rel.from === from && rel.to === to
    );
    
    if (relationIndex !== -1) {
      internalData.value.relations.splice(relationIndex, 1);
      updateGraphFromData();
      markAsModified();
    }
  }
}

/** 处理元素更新（来自NodeDetailPanel） */
function handleElementUpdate(element: CanonicalElement) {
  if (!internalData.value) return;
  
  // 更新元素
  const index = internalData.value.elements.findIndex(el => el.id === element.id);
  if (index !== -1) {
    internalData.value.elements[index] = element;
    updateGraphFromData();
    markAsModified();
  }
}

/** 处理添加关系（来自NodeDetailPanel） */
function handleAddRelation(relation: CanonicalRelation) {
  if (!internalData.value) return;
  
  internalData.value.relations = [...internalData.value.relations, relation];
  updateGraphFromData();
  markAsModified();
}

/** 处理删除关系（来自NodeDetailPanel） */
function handleRemoveRelation(relationIndex: number) {
  if (!internalData.value) return;
  
  internalData.value.relations.splice(relationIndex, 1);
  updateGraphFromData();
  markAsModified();
}

/** 关闭节点详情面板 */
function handleClosePanel() {
  selectedNodeId.value = null;
}

/** 处理视图切换前的验证 */
function handleBeforeSwitch(targetView: 'graph' | 'json') {
  if (targetView === 'graph' && viewMode.value === 'json') {
    // 切换到图谱视图前验证JSON
    const content = editor.value?.getValue() || '';
    if (!validateJson(content)) {
      emit('error', parseError.value || 'JSON格式错误');
    }
  }
}

/** 格式化JSON（工具栏按钮） */
function handleFormat() {
  if (viewMode.value === 'json' && editor.value) {
    const content = editor.value.getValue();
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      editor.value.setValue(formatted);
      parseError.value = null;
    } catch (err) {
      if (err instanceof SyntaxError) {
        parseError.value = err.message;
      }
    }
  }
}

/** 重置到最后保存的状态 */
function handleReset() {
  if (!props.modelValue) return;
  
  // 恢复到props中的原始数据
  internalData.value = JSON.parse(JSON.stringify(props.modelValue));
  updateGraphFromData();
  
  // 如果在JSON视图，更新编辑器
  if (viewMode.value === 'json' && editor.value) {
    editor.value.setValue(formatJson(internalData.value));
  }
  
  hasChanges.value = false;
  parseError.value = null;
  selectedNodeId.value = null;
}

/** 保存数据 */
function handleSave() {
  if (!internalData.value) return;
  
  // 如果在JSON视图，先同步数据
  if (viewMode.value === 'json') {
    const content = editor.value?.getValue() || '';
    if (!validateJson(content)) {
      emit('error', parseError.value || 'JSON格式错误');
      return;
    }
    
    try {
      internalData.value = JSON.parse(content);
    } catch {
      emit('error', '无法解析JSON');
      return;
    }
  }
  
  // 发出保存事件
  const jsonString = JSON.stringify(internalData.value, null, 2);
  emit('save', jsonString);
  hasChanges.value = false;
}

// ==================== 画布控制方法 ====================

/** 放大 */
function zoomIn() {
  graphCanvasRef.value?.zoomIn();
}

/** 缩小 */
function zoomOut() {
  graphCanvasRef.value?.zoomOut();
}

/** 适应视图 */
function fitToView() {
  graphCanvasRef.value?.fitToView();
}

/** 重置视图 */
function resetView() {
  graphCanvasRef.value?.resetView();
}
</script>

<template>
  <div class="graph-json-editor">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <div class="editor-toolbar__left">
        <!-- 视图切换器 -->
        <ViewSwitcher
          v-model="viewMode"
          :disabled="readonly"
          :has-validation-error="hasValidationError"
          :validation-error-message="parseError ?? undefined"
          @before-switch="handleBeforeSwitch"
        />
      </div>
      
      <div class="editor-toolbar__center">
        <!-- 修改状态指示 -->
        <span v-if="hasChanges" class="editor-toolbar__modified">
          已修改
        </span>
      </div>
      
      <div class="editor-toolbar__right">
        <!-- 画布控制按钮（仅在图谱视图显示） -->
        <template v-if="viewMode === 'graph'">
          <button
            class="toolbar-btn"
            title="放大"
            @click="zoomIn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
              <path d="M11 8v6M8 11h6" />
            </svg>
          </button>
          <button
            class="toolbar-btn"
            title="缩小"
            @click="zoomOut"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
              <path d="M8 11h6" />
            </svg>
          </button>
          <button
            class="toolbar-btn"
            title="适应视图"
            @click="fitToView"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
          <button
            class="toolbar-btn"
            title="重置视图"
            @click="resetView"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
          <div class="toolbar-divider"></div>
        </template>
        
        <!-- 格式化按钮（仅在JSON视图显示） -->
        <button
          v-if="viewMode === 'json'"
          class="toolbar-btn"
          title="格式化"
          :disabled="readonly"
          @click="handleFormat"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 7h16M4 12h10M4 17h16" />
          </svg>
        </button>
        
        <!-- 重置按钮 -->
        <button
          class="toolbar-btn"
          title="重置"
          :disabled="readonly || !hasChanges"
          @click="handleReset"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
        
        <!-- 保存按钮 -->
        <button
          class="toolbar-btn toolbar-btn--primary"
          title="保存"
          :disabled="readonly || !hasChanges || !!parseError || saving"
          @click="handleSave"
        >
          <template v-if="saving">
            <div class="toolbar-spinner"></div>
          </template>
          <template v-else>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>保存</span>
          </template>
        </button>
      </div>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="parseError" class="editor-error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      <span>{{ parseError }}</span>
    </div>
    
    <!-- 主内容区域 -->
    <div class="editor-content">
      <!-- 图谱视图 -->
      <template v-if="viewMode === 'graph'">
        <div class="editor-graph">
          <!-- 图谱画布 -->
          <GraphCanvas
            ref="graphCanvasRef"
            :elements="elements"
            :relations="relations"
            :selected-node-id="selectedNodeId"
            :readonly="readonly"
            @node-click="handleNodeClick"
            @node-drag="handleNodeDrag"
            @edge-click="handleEdgeClick"
            @edge-create="handleEdgeCreate"
            @edge-delete="handleEdgeDelete"
          />
          
          <!-- 节点详情面板 -->
          <NodeDetailPanel
            v-if="selectedElement"
            :element="selectedElement"
            :relations="relations"
            :all-elements="elements"
            :readonly="readonly"
            @update="handleElementUpdate"
            @close="handleClosePanel"
            @add-relation="handleAddRelation"
            @remove-relation="handleRemoveRelation"
          />
        </div>
      </template>
      
      <!-- JSON视图 -->
      <template v-else>
        <div ref="editorContainer" class="editor-monaco"></div>
      </template>
    </div>
    
    <!-- 关系类型选择器 -->
    <RelationTypeSelector
      :visible="relationSelector.visible"
      :position="relationSelector.position"
      @select="handleRelationTypeSelect"
      @cancel="handleRelationTypeCancel"
    />
  </div>
</template>


<style scoped>
.graph-json-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
}

/* 工具栏 */
.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #1e1e1e;
  border-bottom: 1px solid #333;
  gap: 12px;
}

.editor-toolbar__left,
.editor-toolbar__center,
.editor-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-toolbar__center {
  flex: 1;
  justify-content: center;
}

.editor-toolbar__modified {
  font-size: 11px;
  font-weight: normal;
  color: #f59e0b;
  padding: 2px 8px;
  background: rgba(245, 158, 11, 0.15);
  border-radius: 4px;
}

/* 工具栏按钮 */
.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 28px;
  padding: 0 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.toolbar-btn:hover:not(:disabled) {
  background: #333;
  color: #fff;
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-btn svg {
  width: 14px;
  height: 14px;
}

.toolbar-btn--primary {
  background: #3b82f6;
  color: #fff;
  padding: 0 12px;
}

.toolbar-btn--primary:hover:not(:disabled) {
  background: #2563eb;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #333;
  margin: 0 4px;
}

.toolbar-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 错误提示 */
.editor-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  font-size: 12px;
}

.editor-error svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* 主内容区域 */
.editor-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 图谱视图布局 */
.editor-graph {
  display: flex;
  width: 100%;
  height: 100%;
}

.editor-graph > :first-child {
  flex: 1;
  min-width: 0;
}

/* Monaco编辑器容器 */
.editor-monaco {
  width: 100%;
  height: 100%;
}
</style>
