<script setup lang="ts">
/**
 * 自定义节点组件
 * 用于在 Vue Flow 图谱中渲染 CanonicalElement
 * 
 * 功能：
 * - 根据元素类型显示不同颜色和图标
 * - 显示元素名称
 * - 支持选中状态高亮
 * - 提供连接点用于创建关系
 * 
 * Requirements: 1.3, 2.3
 */
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import type { ElementType } from '@/types';
import { NODE_STYLES } from '@/utils/graphTransform';

// ==================== Props ====================
interface Props {
  id: string;
  data: {
    element: {
      id: string;
      type: ElementType;
      name: string;
      description: string;
    };
    isSelected: boolean;
  };
}

const props = defineProps<Props>();

// ==================== 计算属性 ====================

/** 获取当前元素类型对应的样式 */
const nodeStyle = computed(() => {
  return NODE_STYLES[props.data.element.type] ?? NODE_STYLES.object;
});

/** 节点背景色（带透明度） */
const backgroundColor = computed(() => {
  return `${nodeStyle.value.color}20`;
});

/** 节点边框色 */
const borderColor = computed(() => {
  return props.data.isSelected ? nodeStyle.value.color : `${nodeStyle.value.color}60`;
});

/** 图标颜色 */
const iconColor = computed(() => {
  return nodeStyle.value.color;
});

/** 元素类型的中文标签 */
const typeLabel = computed(() => {
  const labels: Record<ElementType, string> = {
    subject: '主体',
    object: '物体',
    text: '文本',
    background: '背景',
    effect: '特效',
  };
  return labels[props.data.element.type] ?? props.data.element.type;
});
</script>

<template>
  <div
    class="element-node"
    :class="{ 'element-node--selected': data.isSelected }"
    :style="{
      '--node-bg': backgroundColor,
      '--node-border': borderColor,
      '--node-icon': iconColor,
    }"
  >
    <!-- 顶部连接点（入口） -->
    <Handle
      type="target"
      :position="Position.Top"
      class="element-node__handle element-node__handle--target"
    />

    <!-- 节点内容 -->
    <div class="element-node__content">
      <!-- 图标 -->
      <div class="element-node__icon">
        <!-- subject: 用户图标 -->
        <svg v-if="data.element.type === 'subject'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <!-- object: 盒子图标 -->
        <svg v-else-if="data.element.type === 'object'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <!-- text: 文字图标 -->
        <svg v-else-if="data.element.type === 'text'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
        <!-- background: 图片图标 -->
        <svg v-else-if="data.element.type === 'background'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <!-- effect: 闪光图标 -->
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
        </svg>
      </div>

      <!-- 名称和类型 -->
      <div class="element-node__info">
        <div class="element-node__name" :title="data.element.name">
          {{ data.element.name }}
        </div>
        <div class="element-node__type">
          {{ typeLabel }}
        </div>
      </div>
    </div>

    <!-- 底部连接点（出口） -->
    <Handle
      type="source"
      :position="Position.Bottom"
      class="element-node__handle element-node__handle--source"
    />

    <!-- 左侧连接点（可选，用于更灵活的连线） -->
    <Handle
      type="target"
      :position="Position.Left"
      :id="`${id}-left`"
      class="element-node__handle element-node__handle--side"
    />

    <!-- 右侧连接点（可选，用于更灵活的连线） -->
    <Handle
      type="source"
      :position="Position.Right"
      :id="`${id}-right`"
      class="element-node__handle element-node__handle--side"
    />
  </div>
</template>

<style scoped>
.element-node {
  position: relative;
  min-width: 120px;
  max-width: 180px;
  padding: 10px 12px;
  background: var(--node-bg);
  border: 2px solid var(--node-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.element-node:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.element-node--selected {
  border-width: 2px;
  box-shadow: 0 0 0 3px var(--node-border);
}

.element-node__content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.element-node__icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--node-bg);
  border-radius: 6px;
  color: var(--node-icon);
}

.element-node__icon svg {
  width: 16px;
  height: 16px;
}

.element-node__info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.element-node__name {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.element-node__type {
  font-size: 10px;
  color: #888;
  margin-top: 2px;
}

/* 连接点样式 */
.element-node__handle {
  width: 8px;
  height: 8px;
  background: #444;
  border: 2px solid var(--node-border);
  border-radius: 50%;
  transition: all 0.15s ease;
}

.element-node__handle:hover {
  background: var(--node-icon);
  transform: scale(1.3);
}

.element-node__handle--target {
  top: -4px;
}

.element-node__handle--source {
  bottom: -4px;
}

.element-node__handle--side {
  width: 6px;
  height: 6px;
  opacity: 0.5;
}

.element-node__handle--side:hover {
  opacity: 1;
}

/* 选中状态下的连接点 */
.element-node--selected .element-node__handle {
  background: var(--node-icon);
}
</style>
