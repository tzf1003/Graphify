<script setup lang="ts">
/**
 * 自定义边组件
 * 用于在 Vue Flow 图谱中渲染 CanonicalRelation
 * 
 * 功能：
 * - 根据关系类型显示不同样式（颜色、虚线）
 * - 显示关系类型标签
 * - 支持点击选中
 * 
 * Requirements: 1.4, 4.2
 */
import { computed } from 'vue';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@vue-flow/core';
import type { RelationType, CanonicalRelation } from '@/types';
import { EDGE_STYLES } from '@/utils/graphTransform';

// ==================== Props ====================
interface Props {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: string;
  targetPosition: string;
  data?: {
    relation: CanonicalRelation;
    isSelected?: boolean;
  };
  markerEnd?: string;
}

const props = defineProps<Props>();

// ==================== Emits ====================
const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

// ==================== 计算属性 ====================

/** 获取关系类型 */
const relationType = computed<RelationType>(() => {
  return props.data?.relation?.type ?? 'attached_to';
});

/** 获取当前关系类型对应的样式 */
const edgeStyle = computed(() => {
  return EDGE_STYLES[relationType.value] ?? EDGE_STYLES.attached_to;
});

/** 是否选中 */
const isSelected = computed(() => {
  return props.data?.isSelected ?? false;
});

/** 边的路径和标签位置 */
const pathData = computed(() => {
  return getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition as any,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition as any,
  });
});

/** 边路径 */
const edgePath = computed(() => pathData.value[0]);

/** 标签 X 坐标 */
const labelX = computed(() => pathData.value[1]);

/** 标签 Y 坐标 */
const labelY = computed(() => pathData.value[2]);

/** 边的样式对象 */
const edgeStyleObject = computed(() => ({
  stroke: edgeStyle.value.color,
  strokeWidth: isSelected.value ? 3 : 2,
  strokeDasharray: edgeStyle.value.strokeDasharray,
}));

/** 关系类型的中文标签 */
const typeLabel = computed(() => {
  const labels: Record<RelationType, string> = {
    occludes: '遮挡',
    attached_to: '附着',
    in_front_of: '前方',
    part_of: '部分',
  };
  return labels[relationType.value] ?? relationType.value;
});

// ==================== 事件处理 ====================

/** 处理边点击事件 */
function handleClick(event: MouseEvent) {
  event.stopPropagation();
  emit('click', event);
}
</script>

<template>
  <BaseEdge
    :id="id"
    :path="edgePath"
    :marker-end="markerEnd"
    :style="edgeStyleObject"
    class="relation-edge"
    :class="{ 'relation-edge--selected': isSelected }"
  />
  
  <!-- 可点击的透明宽边（增加点击区域） -->
  <path
    :d="edgePath"
    class="relation-edge__clickable"
    @click="handleClick"
  />
  
  <!-- 边标签 -->
  <EdgeLabelRenderer>
    <div
      class="relation-edge__label"
      :class="{ 'relation-edge__label--selected': isSelected }"
      :style="{
        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        '--edge-color': edgeStyle.color,
      }"
      @click="handleClick"
    >
      <span class="relation-edge__label-text">{{ typeLabel }}</span>
    </div>
  </EdgeLabelRenderer>
</template>

<style scoped>
.relation-edge {
  transition: stroke-width 0.15s ease;
}

.relation-edge--selected {
  filter: drop-shadow(0 0 4px var(--edge-color, #3b82f6));
}

/* 透明的可点击区域 */
.relation-edge__clickable {
  fill: none;
  stroke: transparent;
  stroke-width: 20px;
  cursor: pointer;
}

/* 边标签容器 */
.relation-edge__label {
  position: absolute;
  pointer-events: all;
  cursor: pointer;
  padding: 4px 8px;
  background: #1a1a2e;
  border: 1px solid var(--edge-color, #3b82f6);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  transition: all 0.15s ease;
  z-index: 10;
}

.relation-edge__label:hover {
  transform: translate(-50%, -50%) scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.relation-edge__label--selected {
  background: var(--edge-color, #3b82f6);
  color: #fff;
  box-shadow: 0 0 8px var(--edge-color, #3b82f6);
}

.relation-edge__label-text {
  display: block;
  line-height: 1;
}
</style>
