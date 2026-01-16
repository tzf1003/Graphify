<script setup lang="ts">
/**
 * 图片生成面板组件（合并版）
 * 包含生成设置和候选图网格，共用一个滚动区域
 */
import { ref, computed } from 'vue';
import type { JobStatus, CandidateImage } from '../../types';

// ==================== Props ====================
interface Props {
  generating?: boolean;
  jobStatus?: JobStatus | null;
  errorMessage?: string | null;
  disabled?: boolean;
  candidates: CandidateImage[];
  selectedCandidateId: string | null;
  confirmingSelection?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  generating: false,
  jobStatus: null,
  errorMessage: null,
  disabled: false,
  confirmingSelection: false,
});

// ==================== Emits ====================
const emit = defineEmits<{
  (e: 'generate', options: { count: number; seed?: number; strength?: number }): void;
  (e: 'cancel'): void;
  (e: 'select-candidate', candidateId: string): void;
  (e: 'confirm-selection'): void;
  (e: 'cancel-selection'): void;
}>();

// ==================== 状态 ====================
const count = ref(4);
const seed = ref<string>('');
const strength = ref(0.7);
const showAdvanced = ref(false);
const previewImageUrl = ref<string | null>(null);

// ==================== 计算属性 ====================
const statusText = computed(() => {
  switch (props.jobStatus) {
    case 'queued': return '排队中...';
    case 'running': return '生成中...';
    case 'succeeded': return '生成完成';
    case 'failed': return '生成失败';
    default: return '';
  }
});

const statusClass = computed(() => {
  switch (props.jobStatus) {
    case 'succeeded': return 'generation-panel__status--success';
    case 'failed': return 'generation-panel__status--error';
    default: return '';
  }
});

const isRunning = computed(() => props.jobStatus === 'queued' || props.jobStatus === 'running');

const sortedCandidates = computed(() => 
  [...props.candidates].sort((a, b) => a.indexNum - b.indexNum)
);

const hasCandidates = computed(() => props.candidates.length > 0);
const hasSelection = computed(() => props.selectedCandidateId !== null);

// ==================== 方法 ====================
function handleGenerate(): void {
  const options: { count: number; seed?: number; strength?: number } = { count: count.value };
  if (seed.value.trim()) {
    const seedNum = parseInt(seed.value, 10);
    if (!isNaN(seedNum)) options.seed = seedNum;
  }
  options.strength = strength.value;
  emit('generate', options);
}

function handleCancel(): void {
  emit('cancel');
}

function handleCountChange(delta: number): void {
  const newCount = count.value + delta;
  if (newCount >= 1 && newCount <= 8) count.value = newCount;
}

function handleSelectCandidate(candidateId: string): void {
  emit('select-candidate', candidateId);
}

function handleConfirmSelection(): void {
  emit('confirm-selection');
}

function handleCancelSelection(): void {
  emit('cancel-selection');
}

function isSelected(candidateId: string): boolean {
  return candidateId === props.selectedCandidateId;
}

function openPreview(imageUrl: string, event: Event): void {
  event.stopPropagation();
  previewImageUrl.value = imageUrl;
}

function closePreview(): void {
  previewImageUrl.value = null;
}
</script>

<template>
  <div class="generation-panel">
    <!-- 可滚动内容区域 -->
    <div class="generation-panel__scroll">
      <!-- 生成设置区域 -->
      <section class="generation-panel__section">
        <div class="generation-panel__header">
          <h3 class="generation-panel__title">图片生成</h3>
        </div>

        <div class="generation-panel__content">
          <!-- 生成数量 -->
          <div class="generation-panel__field">
            <label class="generation-panel__label">生成数量</label>
            <div class="generation-panel__counter">
              <button
                class="generation-panel__counter-btn"
                :disabled="count <= 1 || generating"
                @click="handleCountChange(-1)"
              >−</button>
              <span class="generation-panel__counter-value">{{ count }}</span>
              <button
                class="generation-panel__counter-btn"
                :disabled="count >= 8 || generating"
                @click="handleCountChange(1)"
              >+</button>
            </div>
            <span class="generation-panel__hint">1-8 张</span>
          </div>

          <!-- 高级选项切换 -->
          <button class="generation-panel__toggle" @click="showAdvanced = !showAdvanced">
            <span>高级选项</span>
            <svg :class="{ 'generation-panel__toggle-icon--open': showAdvanced }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <!-- 高级选项 -->
          <div v-if="showAdvanced" class="generation-panel__advanced">
            <div class="generation-panel__field">
              <label class="generation-panel__label">随机种子 (可选)</label>
              <input v-model="seed" type="text" class="generation-panel__input" placeholder="留空使用随机值" :disabled="generating" />
            </div>
            <div class="generation-panel__field">
              <label class="generation-panel__label">
                变化强度
                <span class="generation-panel__value">{{ (strength * 100).toFixed(0) }}%</span>
              </label>
              <input v-model.number="strength" type="range" class="generation-panel__slider" min="0" max="1" step="0.05" :disabled="generating" />
              <div class="generation-panel__slider-labels"><span>保守</span><span>激进</span></div>
            </div>
          </div>

          <!-- 状态显示 -->
          <div v-if="jobStatus" class="generation-panel__status" :class="statusClass">
            <div v-if="isRunning" class="generation-panel__spinner"></div>
            <svg v-else-if="jobStatus === 'succeeded'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <svg v-else-if="jobStatus === 'failed'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" />
            </svg>
            <span>{{ statusText }}</span>
          </div>

          <!-- 错误信息 -->
          <div v-if="errorMessage" class="generation-panel__error">{{ errorMessage }}</div>

          <!-- 生成按钮 -->
          <div class="generation-panel__actions">
            <button v-if="isRunning" class="generation-panel__btn generation-panel__btn--secondary" @click="handleCancel">取消</button>
            <button class="generation-panel__btn generation-panel__btn--primary" :disabled="disabled || generating" @click="handleGenerate">
              <template v-if="generating">
                <div class="generation-panel__btn-spinner"></div><span>生成中...</span>
              </template>
              <template v-else>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>开始生成</span>
              </template>
            </button>
          </div>
        </div>
      </section>

      <!-- 候选图区域 -->
      <section v-if="hasCandidates || (generating && !hasCandidates)" class="generation-panel__section">
        <div class="generation-panel__header">
          <h3 class="generation-panel__title">候选图片</h3>
          <span class="generation-panel__count">{{ candidates.length }} 张</span>
        </div>

        <!-- 加载状态 -->
        <div v-if="generating && !hasCandidates" class="generation-panel__loading">
          <div class="generation-panel__spinner"></div>
          <span>生成中...</span>
        </div>

        <!-- 候选图网格 -->
        <div v-else class="generation-panel__content">
          <div class="generation-panel__grid">
            <div
              v-for="candidate in sortedCandidates"
              :key="candidate.id"
              class="generation-panel__item"
              :class="{ 'generation-panel__item--selected': isSelected(candidate.id) }"
              @click="handleSelectCandidate(candidate.id)"
            >
              <img :src="candidate.imageUrl" :alt="`候选图 ${candidate.indexNum + 1}`" class="generation-panel__image" />
              <div class="generation-panel__index">{{ candidate.indexNum + 1 }}</div>
              <div v-if="isSelected(candidate.id)" class="generation-panel__check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <button class="generation-panel__zoom-btn" title="放大查看" @click="openPreview(candidate.imageUrl, $event)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /><path d="M11 8v6M8 11h6" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 选择操作按钮 -->
          <div class="generation-panel__actions">
            <button class="generation-panel__btn generation-panel__btn--secondary" @click="handleCancelSelection">取消</button>
            <button class="generation-panel__btn generation-panel__btn--primary" :disabled="!hasSelection || confirmingSelection" @click="handleConfirmSelection">
              <template v-if="confirmingSelection">
                <div class="generation-panel__btn-spinner"></div><span>确认中...</span>
              </template>
              <template v-else>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12" /></svg>
                <span>确认选择</span>
              </template>
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- 图片放大预览弹窗 -->
    <Teleport to="body">
      <div v-if="previewImageUrl" class="generation-panel__preview-modal" @click="closePreview">
        <div class="generation-panel__preview-content" @click.stop>
          <img :src="previewImageUrl" alt="放大预览" class="generation-panel__preview-image" />
          <button class="generation-panel__preview-close" title="关闭" @click="closePreview">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>


<style scoped>
.generation-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e1e;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}

.generation-panel__scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.generation-panel__section {
  border-bottom: 1px solid #333;
}

.generation-panel__section:last-child {
  border-bottom: none;
}

.generation-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #333;
}

.generation-panel__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.generation-panel__count {
  font-size: 12px;
  color: #888;
}

.generation-panel__content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.generation-panel__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.generation-panel__label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #888;
}

.generation-panel__value {
  color: #fff;
  font-variant-numeric: tabular-nums;
}

.generation-panel__hint {
  font-size: 11px;
  color: #666;
  text-align: center;
}

.generation-panel__counter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.generation-panel__counter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #444;
  border-radius: 6px;
  background: transparent;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s;
}

.generation-panel__counter-btn:hover:not(:disabled) {
  background: #333;
  border-color: #555;
}

.generation-panel__counter-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.generation-panel__counter-value {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
  min-width: 32px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.generation-panel__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 0;
  border: none;
  background: transparent;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  transition: color 0.15s;
}

.generation-panel__toggle:hover {
  color: #fff;
}

.generation-panel__toggle svg {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}

.generation-panel__toggle-icon--open {
  transform: rotate(180deg);
}

.generation-panel__advanced {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid #333;
}

.generation-panel__input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #444;
  border-radius: 6px;
  background: #2a2a2a;
  color: #fff;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.generation-panel__input:focus {
  border-color: #3b82f6;
}

.generation-panel__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.generation-panel__input::placeholder {
  color: #666;
}

.generation-panel__slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #333;
  appearance: none;
  cursor: pointer;
}

.generation-panel__slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  transition: transform 0.15s;
}

.generation-panel__slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.generation-panel__slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.generation-panel__slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #666;
}

.generation-panel__status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: 6px;
  background: #2a2a2a;
  font-size: 13px;
  color: #888;
}

.generation-panel__status svg {
  width: 16px;
  height: 16px;
}

.generation-panel__status--success {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.generation-panel__status--error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.generation-panel__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #333;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.generation-panel__error {
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  font-size: 12px;
}

.generation-panel__actions {
  display: flex;
  gap: 8px;
}

.generation-panel__btn {
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

.generation-panel__btn svg {
  width: 16px;
  height: 16px;
}

.generation-panel__btn--primary {
  background: #3b82f6;
  color: #fff;
}

.generation-panel__btn--primary:hover:not(:disabled) {
  background: #2563eb;
}

.generation-panel__btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.generation-panel__btn--secondary {
  background: #333;
  color: #fff;
}

.generation-panel__btn--secondary:hover {
  background: #444;
}

.generation-panel__btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.generation-panel__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #666;
  font-size: 14px;
  gap: 12px;
}

.generation-panel__loading .generation-panel__spinner {
  width: 32px;
  height: 32px;
  border-width: 3px;
}

.generation-panel__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.generation-panel__item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.15s;
}

.generation-panel__item:hover {
  border-color: #444;
}

.generation-panel__item--selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.generation-panel__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.generation-panel__index {
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

.generation-panel__check {
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

.generation-panel__check svg {
  width: 14px;
  height: 14px;
  color: #fff;
}

.generation-panel__zoom-btn {
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

.generation-panel__item:hover .generation-panel__zoom-btn {
  opacity: 1;
}

.generation-panel__zoom-btn:hover {
  background: rgba(59, 130, 246, 0.9);
}

.generation-panel__zoom-btn svg {
  width: 16px;
  height: 16px;
}

.generation-panel__preview-modal {
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

.generation-panel__preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.generation-panel__preview-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.generation-panel__preview-close {
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

.generation-panel__preview-close:hover {
  background: #ef4444;
}

.generation-panel__preview-close svg {
  width: 18px;
  height: 18px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
