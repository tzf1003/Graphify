<script setup lang="ts">
/**
 * 生成设置面板组件
 * 实现 count（1-8）、seed、strength 配置
 * 实现生成按钮，显示生成进度状态
 */
import { ref, computed } from 'vue';
import type { JobStatus } from '../../types';

// ==================== Props ====================
interface Props {
  generating?: boolean;
  jobStatus?: JobStatus | null;
  errorMessage?: string | null;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  generating: false,
  jobStatus: null,
  errorMessage: null,
  disabled: false,
});

// ==================== Emits ====================
const emit = defineEmits<{
  (e: 'generate', options: { count: number; seed?: number; strength?: number }): void;
  (e: 'cancel'): void;
}>();

// ==================== 状态 ====================
const count = ref(4);
const seed = ref<string>('');
const strength = ref(0.7);
const showAdvanced = ref(false);

// ==================== 计算属性 ====================
const statusText = computed(() => {
  switch (props.jobStatus) {
    case 'queued':
      return '排队中...';
    case 'running':
      return '生成中...';
    case 'succeeded':
      return '生成完成';
    case 'failed':
      return '生成失败';
    default:
      return '';
  }
});

const statusClass = computed(() => {
  switch (props.jobStatus) {
    case 'succeeded':
      return 'generate-panel__status--success';
    case 'failed':
      return 'generate-panel__status--error';
    default:
      return '';
  }
});

const isRunning = computed(() => {
  return props.jobStatus === 'queued' || props.jobStatus === 'running';
});

// ==================== 方法 ====================
function handleGenerate(): void {
  const options: { count: number; seed?: number; strength?: number } = {
    count: count.value,
  };

  // 只有填写了 seed 才传递
  if (seed.value.trim()) {
    const seedNum = parseInt(seed.value, 10);
    if (!isNaN(seedNum)) {
      options.seed = seedNum;
    }
  }

  // 传递 strength
  options.strength = strength.value;

  emit('generate', options);
}

function handleCancel(): void {
  emit('cancel');
}

function handleCountChange(delta: number): void {
  const newCount = count.value + delta;
  if (newCount >= 1 && newCount <= 8) {
    count.value = newCount;
  }
}
</script>

<template>
  <div class="generate-panel">
    <div class="generate-panel__header">
      <h3 class="generate-panel__title">图片生成</h3>
    </div>

    <div class="generate-panel__content">
      <!-- 生成数量 -->
      <div class="generate-panel__field">
        <label class="generate-panel__label">生成数量</label>
        <div class="generate-panel__counter">
          <button
            class="generate-panel__counter-btn"
            :disabled="count <= 1 || generating"
            @click="handleCountChange(-1)"
          >
            −
          </button>
          <span class="generate-panel__counter-value">{{ count }}</span>
          <button
            class="generate-panel__counter-btn"
            :disabled="count >= 8 || generating"
            @click="handleCountChange(1)"
          >
            +
          </button>
        </div>
        <span class="generate-panel__hint">1-8 张</span>
      </div>

      <!-- 高级选项切换 -->
      <button
        class="generate-panel__toggle"
        @click="showAdvanced = !showAdvanced"
      >
        <span>高级选项</span>
        <svg
          :class="{ 'generate-panel__toggle-icon--open': showAdvanced }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <!-- 高级选项 -->
      <div v-if="showAdvanced" class="generate-panel__advanced">
        <!-- Seed -->
        <div class="generate-panel__field">
          <label class="generate-panel__label">随机种子 (可选)</label>
          <input
            v-model="seed"
            type="text"
            class="generate-panel__input"
            placeholder="留空使用随机值"
            :disabled="generating"
          />
        </div>

        <!-- Strength -->
        <div class="generate-panel__field">
          <label class="generate-panel__label">
            变化强度
            <span class="generate-panel__value">{{ (strength * 100).toFixed(0) }}%</span>
          </label>
          <input
            v-model.number="strength"
            type="range"
            class="generate-panel__slider"
            min="0"
            max="1"
            step="0.05"
            :disabled="generating"
          />
          <div class="generate-panel__slider-labels">
            <span>保守</span>
            <span>激进</span>
          </div>
        </div>
      </div>

      <!-- 状态显示 -->
      <div v-if="jobStatus" class="generate-panel__status" :class="statusClass">
        <template v-if="isRunning">
          <div class="generate-panel__spinner"></div>
        </template>
        <template v-else-if="jobStatus === 'succeeded'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </template>
        <template v-else-if="jobStatus === 'failed'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6M9 9l6 6" />
          </svg>
        </template>
        <span>{{ statusText }}</span>
      </div>

      <!-- 错误信息 -->
      <div v-if="errorMessage" class="generate-panel__error">
        {{ errorMessage }}
      </div>

      <!-- 操作按钮 -->
      <div class="generate-panel__actions">
        <button
          v-if="isRunning"
          class="generate-panel__btn generate-panel__btn--secondary"
          @click="handleCancel"
        >
          取消
        </button>
        <button
          class="generate-panel__btn generate-panel__btn--primary"
          :disabled="disabled || generating"
          @click="handleGenerate"
        >
          <template v-if="generating">
            <div class="generate-panel__btn-spinner"></div>
            <span>生成中...</span>
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
  </div>
</template>

<style scoped>
.generate-panel {
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
}

.generate-panel__header {
  padding: 12px 16px;
  border-bottom: 1px solid #333;
}

.generate-panel__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.generate-panel__content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.generate-panel__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.generate-panel__label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #888;
}

.generate-panel__value {
  color: #fff;
  font-variant-numeric: tabular-nums;
}

.generate-panel__hint {
  font-size: 11px;
  color: #666;
  text-align: center;
}

.generate-panel__counter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.generate-panel__counter-btn {
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

.generate-panel__counter-btn:hover:not(:disabled) {
  background: #333;
  border-color: #555;
}

.generate-panel__counter-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.generate-panel__counter-value {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
  min-width: 32px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.generate-panel__toggle {
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

.generate-panel__toggle:hover {
  color: #fff;
}

.generate-panel__toggle svg {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}

.generate-panel__toggle-icon--open {
  transform: rotate(180deg);
}

.generate-panel__advanced {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid #333;
}

.generate-panel__input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #444;
  border-radius: 6px;
  background: #2a2a2a;
  color: #fff;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
}

.generate-panel__input:focus {
  border-color: #3b82f6;
}

.generate-panel__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.generate-panel__input::placeholder {
  color: #666;
}

.generate-panel__slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #333;
  appearance: none;
  cursor: pointer;
}

.generate-panel__slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  transition: transform 0.15s;
}

.generate-panel__slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.generate-panel__slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.generate-panel__slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #666;
}

.generate-panel__status {
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

.generate-panel__status svg {
  width: 16px;
  height: 16px;
}

.generate-panel__status--success {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.generate-panel__status--error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.generate-panel__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #333;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.generate-panel__error {
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  font-size: 12px;
}

.generate-panel__actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.generate-panel__btn {
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

.generate-panel__btn svg {
  width: 16px;
  height: 16px;
}

.generate-panel__btn--primary {
  background: #3b82f6;
  color: #fff;
}

.generate-panel__btn--primary:hover:not(:disabled) {
  background: #2563eb;
}

.generate-panel__btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.generate-panel__btn--secondary {
  background: #333;
  color: #fff;
}

.generate-panel__btn--secondary:hover {
  background: #444;
}

.generate-panel__btn-spinner {
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
</style>
