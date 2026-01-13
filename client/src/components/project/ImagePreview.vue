<script setup lang="ts">
/**
 * 图片预览组件
 * 显示当前版本图片，支持缩放查看
 */
import { ref, computed, watch } from 'vue';

// ==================== Props ====================
interface Props {
  imageUrl: string | null;
  alt?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  alt: '图片预览',
  loading: false,
});

// ==================== 状态 ====================
const scale = ref(1);
const position = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const imageLoaded = ref(false);
const imageError = ref(false);

// ==================== 常量 ====================
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const SCALE_STEP = 0.1;

// ==================== 计算属性 ====================
const scalePercent = computed(() => Math.round(scale.value * 100));

const transformStyle = computed(() => ({
  transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${scale.value})`,
}));

// ==================== 监听 ====================
watch(() => props.imageUrl, () => {
  // 重置状态
  scale.value = 1;
  position.value = { x: 0, y: 0 };
  imageLoaded.value = false;
  imageError.value = false;
});

// ==================== 方法 ====================
function handleZoomIn(): void {
  scale.value = Math.min(MAX_SCALE, scale.value + SCALE_STEP);
}

function handleZoomOut(): void {
  scale.value = Math.max(MIN_SCALE, scale.value - SCALE_STEP);
}

function handleReset(): void {
  scale.value = 1;
  position.value = { x: 0, y: 0 };
}

function handleFit(): void {
  scale.value = 1;
  position.value = { x: 0, y: 0 };
}

function handleWheel(event: WheelEvent): void {
  event.preventDefault();
  const delta = event.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
  const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale.value + delta));
  scale.value = newScale;
}

function handleMouseDown(event: MouseEvent): void {
  if (event.button !== 0) return; // 只响应左键
  isDragging.value = true;
  dragStart.value = {
    x: event.clientX - position.value.x,
    y: event.clientY - position.value.y,
  };
}

function handleMouseMove(event: MouseEvent): void {
  if (!isDragging.value) return;
  position.value = {
    x: event.clientX - dragStart.value.x,
    y: event.clientY - dragStart.value.y,
  };
}

function handleMouseUp(): void {
  isDragging.value = false;
}

function handleImageLoad(): void {
  imageLoaded.value = true;
  imageError.value = false;
}

function handleImageError(): void {
  imageLoaded.value = false;
  imageError.value = true;
}
</script>

<template>
  <div class="image-preview">
    <!-- 工具栏 -->
    <div class="image-preview__toolbar">
      <div class="image-preview__zoom-controls">
        <button
          class="image-preview__btn"
          title="缩小"
          :disabled="scale <= MIN_SCALE"
          @click="handleZoomOut"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35M8 11h6" />
          </svg>
        </button>
        <span class="image-preview__scale">{{ scalePercent }}%</span>
        <button
          class="image-preview__btn"
          title="放大"
          :disabled="scale >= MAX_SCALE"
          @click="handleZoomIn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
          </svg>
        </button>
      </div>
      <div class="image-preview__actions">
        <button class="image-preview__btn" title="适应窗口" @click="handleFit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
        <button class="image-preview__btn" title="重置" @click="handleReset">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 图片容器 -->
    <div
      class="image-preview__container"
      :class="{ 'image-preview__container--dragging': isDragging }"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    >
      <!-- 加载状态 -->
      <div v-if="loading" class="image-preview__loading">
        <div class="image-preview__spinner"></div>
        <span>加载中...</span>
      </div>

      <!-- 无图片 -->
      <div v-else-if="!imageUrl" class="image-preview__empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        <span>暂无图片</span>
      </div>

      <!-- 加载错误 -->
      <div v-else-if="imageError" class="image-preview__error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6M9 9l6 6" />
        </svg>
        <span>图片加载失败</span>
      </div>

      <!-- 图片 -->
      <div v-else class="image-preview__image-wrapper" :style="transformStyle">
        <img
          :src="imageUrl"
          :alt="alt"
          class="image-preview__image"
          :class="{ 'image-preview__image--loading': !imageLoaded }"
          draggable="false"
          @load="handleImageLoad"
          @error="handleImageError"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
}

.image-preview__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #1e1e1e;
  border-bottom: 1px solid #333;
}

.image-preview__zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.image-preview__scale {
  min-width: 48px;
  text-align: center;
  font-size: 12px;
  color: #888;
  font-variant-numeric: tabular-nums;
}

.image-preview__actions {
  display: flex;
  gap: 4px;
}

.image-preview__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #888;
  cursor: pointer;
  transition: all 0.15s;
}

.image-preview__btn:hover:not(:disabled) {
  background: #333;
  color: #fff;
}

.image-preview__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.image-preview__btn svg {
  width: 16px;
  height: 16px;
}

.image-preview__container {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  /* 棋盘格背景 */
  background-image: 
    linear-gradient(45deg, #252525 25%, transparent 25%),
    linear-gradient(-45deg, #252525 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #252525 75%),
    linear-gradient(-45deg, transparent 75%, #252525 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  background-color: #1a1a1a;
}

.image-preview__container--dragging {
  cursor: grabbing;
}

.image-preview__loading,
.image-preview__empty,
.image-preview__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #666;
  font-size: 14px;
}

.image-preview__loading svg,
.image-preview__empty svg,
.image-preview__error svg {
  width: 48px;
  height: 48px;
}

.image-preview__error {
  color: #ef4444;
}

.image-preview__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #333;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.image-preview__image-wrapper {
  transform-origin: center center;
  transition: transform 0.1s ease-out;
}

.image-preview__container--dragging .image-preview__image-wrapper {
  transition: none;
}

.image-preview__image {
  max-width: 100%;
  max-height: 100%;
  display: block;
  user-select: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.image-preview__image--loading {
  opacity: 0;
}
</style>
