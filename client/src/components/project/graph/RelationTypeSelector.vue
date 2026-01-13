<script setup lang="ts">
/**
 * 关系类型选择器组件
 * 创建新关系时的类型选择弹窗
 * 
 * 功能：
 * - 显示四种关系类型选项（occludes, attached_to, in_front_of, part_of）
 * - 支持键盘选择（1-4 数字键、上下方向键、Enter 确认、Escape 取消）
 * - 鼠标点击选择
 * 
 * Requirements: 4.1
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { RelationType } from '@/types';
import { EDGE_STYLES } from '@/utils/graphTransform';

// ==================== Props ====================
interface Props {
  visible: boolean;
  position: { x: number; y: number };
}

const props = defineProps<Props>();

// ==================== Emits ====================
const emit = defineEmits<{
  (e: 'select', type: RelationType): void;
  (e: 'cancel'): void;
}>();

// ==================== 关系类型配置 ====================
interface RelationTypeOption {
  type: RelationType;
  label: string;
  description: string;
  shortcut: string;
}

const relationTypes: RelationTypeOption[] = [
  {
    type: 'occludes',
    label: '遮挡',
    description: '源元素遮挡目标元素',
    shortcut: '1',
  },
  {
    type: 'attached_to',
    label: '附着',
    description: '源元素附着在目标元素上',
    shortcut: '2',
  },
  {
    type: 'in_front_of',
    label: '前方',
    description: '源元素在目标元素前方',
    shortcut: '3',
  },
  {
    type: 'part_of',
    label: '部分',
    description: '源元素是目标元素的一部分',
    shortcut: '4',
  },
];

// ==================== 状态 ====================

/** 当前高亮的选项索引 */
const highlightedIndex = ref(0);

/** 选择器容器引用 */
const selectorRef = ref<HTMLElement | null>(null);

// ==================== 计算属性 ====================

/** 弹窗位置样式 */
const positionStyle = computed(() => ({
  left: `${props.position.x}px`,
  top: `${props.position.y}px`,
}));

/** 获取关系类型对应的颜色 */
function getTypeColor(type: RelationType): string {
  return EDGE_STYLES[type]?.color ?? '#888';
}

// ==================== 方法 ====================

/** 选择关系类型 */
function selectType(type: RelationType) {
  emit('select', type);
}

/** 取消选择 */
function cancel() {
  emit('cancel');
}

/** 处理键盘事件 */
function handleKeyDown(event: KeyboardEvent) {
  if (!props.visible) return;

  switch (event.key) {
    case 'Escape':
      event.preventDefault();
      cancel();
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      selectType(relationTypes[highlightedIndex.value].type);
      break;
    case 'ArrowUp':
      event.preventDefault();
      highlightedIndex.value = (highlightedIndex.value - 1 + relationTypes.length) % relationTypes.length;
      break;
    case 'ArrowDown':
      event.preventDefault();
      highlightedIndex.value = (highlightedIndex.value + 1) % relationTypes.length;
      break;
    case '1':
    case '2':
    case '3':
    case '4':
      event.preventDefault();
      const index = parseInt(event.key) - 1;
      selectType(relationTypes[index].type);
      break;
  }
}

/** 处理鼠标悬停 */
function handleMouseEnter(index: number) {
  highlightedIndex.value = index;
}

/** 处理点击外部关闭 */
function handleClickOutside(event: MouseEvent) {
  if (!props.visible) return;
  
  const target = event.target as HTMLElement;
  if (selectorRef.value && !selectorRef.value.contains(target)) {
    cancel();
  }
}

// ==================== 监听器 ====================

/** 监听可见性变化，重置高亮索引 */
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      highlightedIndex.value = 0;
    }
  }
);

// ==================== 生命周期 ====================

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('mousedown', handleClickOutside);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="selector-fade">
      <div
        v-if="visible"
        ref="selectorRef"
        class="relation-type-selector"
        :style="positionStyle"
        role="listbox"
        aria-label="选择关系类型"
      >
        <div class="relation-type-selector__header">
          <span class="relation-type-selector__title">选择关系类型</span>
          <button
            class="relation-type-selector__close"
            type="button"
            aria-label="关闭"
            @click="cancel"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <ul class="relation-type-selector__list">
          <li
            v-for="(option, index) in relationTypes"
            :key="option.type"
            class="relation-type-selector__item"
            :class="{ 'relation-type-selector__item--highlighted': index === highlightedIndex }"
            role="option"
            :aria-selected="index === highlightedIndex"
            @click="selectType(option.type)"
            @mouseenter="handleMouseEnter(index)"
          >
            <span
              class="relation-type-selector__color"
              :style="{ backgroundColor: getTypeColor(option.type) }"
            />
            <div class="relation-type-selector__content">
              <span class="relation-type-selector__label">{{ option.label }}</span>
              <span class="relation-type-selector__description">{{ option.description }}</span>
            </div>
            <kbd class="relation-type-selector__shortcut">{{ option.shortcut }}</kbd>
          </li>
        </ul>
        
        <div class="relation-type-selector__footer">
          <span class="relation-type-selector__hint">
            <kbd>↑</kbd><kbd>↓</kbd> 导航 · <kbd>Enter</kbd> 确认 · <kbd>Esc</kbd> 取消
          </span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.relation-type-selector {
  position: fixed;
  z-index: 9999;
  min-width: 260px;
  background: #1a1a2e;
  border: 1px solid #333;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  user-select: none;
}

/* 头部 */
.relation-type-selector__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #333;
  background: #16162a;
}

.relation-type-selector__title {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.relation-type-selector__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #888;
  cursor: pointer;
  transition: all 0.15s ease;
}

.relation-type-selector__close:hover {
  background: #333;
  color: #fff;
}

/* 列表 */
.relation-type-selector__list {
  margin: 0;
  padding: 6px;
  list-style: none;
}

.relation-type-selector__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.relation-type-selector__item:hover,
.relation-type-selector__item--highlighted {
  background: #252540;
}

.relation-type-selector__item--highlighted {
  outline: 1px solid #3b82f6;
  outline-offset: -1px;
}

/* 颜色指示器 */
.relation-type-selector__color {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

/* 内容区域 */
.relation-type-selector__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.relation-type-selector__label {
  font-size: 13px;
  font-weight: 500;
  color: #fff;
}

.relation-type-selector__description {
  font-size: 11px;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 快捷键 */
.relation-type-selector__shortcut {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  color: #888;
  background: #0d0d1a;
  border: 1px solid #333;
  border-radius: 4px;
}

/* 底部提示 */
.relation-type-selector__footer {
  padding: 8px 12px;
  border-top: 1px solid #333;
  background: #16162a;
}

.relation-type-selector__hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 10px;
  color: #666;
}

.relation-type-selector__hint kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-family: inherit;
  font-size: 9px;
  color: #888;
  background: #0d0d1a;
  border: 1px solid #333;
  border-radius: 3px;
}

/* 过渡动画 */
.selector-fade-enter-active,
.selector-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.selector-fade-enter-from,
.selector-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
