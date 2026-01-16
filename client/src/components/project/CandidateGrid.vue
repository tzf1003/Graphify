<script setup lang="ts">
/**
 * 候选图网格组件
 * 显示候选图缩略图网格
 * 实现点击选择高亮，确认选择按钮
 * 支持图片放大预览
 */
import { ref, computed } from 'vue';
import type { CandidateImage } from '../../types';

// ==================== Props ====================
interface Props {
  candidates: CandidateImage[];
  selectedId: string | null;
  loading?: boolean;
  confirming?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  confirming: false,
});

// ==================== Emits ====================
const emit = defineEmits<{
  (e: 'select', candidateId: string): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

// ==================== 状态 ====================
/** 放大预览的图片URL */
const previewImageUrl = ref<string | null>(null);

// ==================== 计算属性 ====================
const sortedCandidates = computed(() => {
  return [...props.candidates].sort((a, b) => a.indexNum - b.indexNum);
});

const hasSelection = computed(() => props.selectedId !== null);

// ==================== 方法 ====================
function handleSelect(candidateId: string): void {
  emit('select', candidateId);
}

function handleConfirm(): void {
  emit('confirm');
}

function handleCancel(): void {
  emit('cancel');
}

function isSelected(candidateId: string): boolean {
  return candidateId === props.selectedId;
}

/** 打开放大预览 */
function openPreview(imageUrl: string, event: Event): void {
  event.stopPropagation();
  previewImageUrl.value = imageUrl;
}

/** 关闭放大预览 */
function closePreview(): void {
  previewImageUrl.value = null;
}
</script>

<template>
  <div class="candidate-grid">
    <div class="candidate-grid__header">
      <h3 class="candidate-grid__title">候选图片</h3>
      <span class="candidate-grid__count">{{ candidates.length }} 张</span>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="candidate-grid__loading">
      <div class="candidate-grid__spinner"></div>
      <span>生成中...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="candidates.length === 0" class="candidate-grid__empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      <span>暂无候选图片</span>
      <span class="candidate-grid__hint">点击"开始生成"创建候选图</span>
    </div>

    <!-- 候选图网格 -->
    <div v-else class="candidate-grid__content">
      <div class="candidate-grid__grid">
        <div
          v-for="candidate in sortedCandidates"
          :key="candidate.id"
          class="candidate-grid__item"
          :class="{ 'candidate-grid__item--selected': isSelected(candidate.id) }"
          @click="handleSelect(candidate.id)"
        >
          <img
            :src="candidate.imageUrl"
            :alt="`候选图 ${candidate.indexNum + 1}`"
            class="candidate-grid__image"
          />
          <div class="candidate-grid__index">{{ candidate.indexNum + 1 }}</div>
          <!-- 右上角勾选标记 -->
          <div v-if="isSelected(candidate.id)" class="candidate-grid__check">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <!-- 悬停时显示放大按钮 -->
          <button
            class="candidate-grid__zoom-btn"
            title="放大查看"
            @click="openPreview(candidate.imageUrl, $event)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
              <path d="M11 8v6M8 11h6" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="candidate-grid__actions">
        <button
          class="candidate-grid__btn candidate-grid__btn--secondary"
          @click="handleCancel"
        >
          取消
        </button>
        <button
          class="candidate-grid__btn candidate-grid__btn--primary"
          :disabled="!hasSelection || confirming"
          @click="handleConfirm"
        >
          <template v-if="confirming">
            <div class="candidate-grid__btn-spinner"></div>
            <span>确认中...</span>
          </template>
          <template v-else>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>确认选择</span>
          </template>
        </button>
      </div>
    </div>

    <!-- 图片放大预览弹窗 -->
    <Teleport to="body">
      <div
        v-if="previewImageUrl"
        class="candidate-grid__preview-modal"
        @click="closePreview"
      >
        <div class="candidate-grid__preview-content" @click.stop>
          <img
            :src="previewImageUrl"
            alt="放大预览"
            class="candidate-grid__preview-image"
          />
          <button
            class="candidate-grid__preview-close"
            title="关闭"
            @click="closePreview"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.candidate-grid {
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
}

.candidate-grid__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #333;
}

.candidate-grid__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.candidate-grid__count {
  font-size: 12px;
  color: #888;
}

.candidate-grid__loading,
.candidate-grid__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #666;
  font-size: 14px;
  gap: 12px;
}

.candidate-grid__empty svg {
  width: 48px;
  height: 48px;
}

.candidate-grid__hint {
  font-size: 12px;
  color: #555;
}

.candidate-grid__spinner {
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

.candidate-grid__content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.candidate-grid__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.candidate-grid__item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.15s;
}

.candidate-grid__item:hover {
  border-color: #444;
}

.candidate-grid__item--selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.candidate-grid__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.candidate-grid__index {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}

.candidate-grid__check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  border-radius: 50%;
}

.candidate-grid__check svg {
  width: 14px;
  height: 14px;
  color: #fff;
}

/* 放大按钮 - 悬停时显示 */
.candidate-grid__zoom-btn {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, background-color 0.15s;
}

.candidate-grid__item:hover .candidate-grid__zoom-btn {
  opacity: 1;
}

.candidate-grid__zoom-btn:hover {
  background: rgba(59, 130, 246, 0.9);
}

.candidate-grid__zoom-btn svg {
  width: 16px;
  height: 16px;
}

.candidate-grid__actions {
  display: flex;
  gap: 8px;
}

.candidate-grid__btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.candidate-grid__btn svg {
  width: 16px;
  height: 16px;
}

.candidate-grid__btn--primary {
  background: #3b82f6;
  color: #fff;
}

.candidate-grid__btn--primary:hover:not(:disabled) {
  background: #2563eb;
}

.candidate-grid__btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.candidate-grid__btn--secondary {
  background: #333;
  color: #fff;
}

.candidate-grid__btn--secondary:hover {
  background: #444;
}

.candidate-grid__btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* 图片放大预览弹窗 */
.candidate-grid__preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  z-index: 9999;
  padding: 24px;
}

.candidate-grid__preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.candidate-grid__preview-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.candidate-grid__preview-close {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #333;
  border: none;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.15s;
}

.candidate-grid__preview-close:hover {
  background: #ef4444;
}

.candidate-grid__preview-close svg {
  width: 18px;
  height: 18px;
}
</style>
