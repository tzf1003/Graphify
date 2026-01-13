<script setup lang="ts">
/**
 * InputModeToggle 组件
 * 实现文字/图片模式切换，两种模式互斥
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
import { computed, ref } from 'vue';
import { useI18n } from '../../composables/useI18n';

export type InputMode = 'text' | 'image';

export interface InputModeToggleProps {
  /** 当前模式 */
  modelValue: InputMode;
  /** 是否禁用 */
  disabled?: boolean;
}

const props = withDefaults(defineProps<InputModeToggleProps>(), {
  disabled: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', mode: InputMode): void;
  (e: 'file-selected', file: File): void;
}>();

const { t } = useI18n();

// 文件输入引用
const fileInputRef = ref<HTMLInputElement | null>(null);

// 计算当前模式
const isTextMode = computed(() => props.modelValue === 'text');
const isImageMode = computed(() => props.modelValue === 'image');

// 切换到文字模式
const switchToText = () => {
  if (props.disabled) return;
  emit('update:modelValue', 'text');
};

// 切换到图片模式（触发文件选择）
const switchToImage = () => {
  if (props.disabled) return;
  emit('update:modelValue', 'image');
  // 触发文件选择
  fileInputRef.value?.click();
};

// 处理文件选择
const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    emit('file-selected', file);
  }
  // 重置 input 以允许重复选择同一文件
  input.value = '';
};

// 支持的图片格式
const acceptedFormats = 'image/png,image/jpeg,image/webp';
</script>

<template>
  <div 
    class="input-mode-toggle"
    :class="{ 'input-mode-toggle--disabled': disabled }"
    role="group"
    :aria-label="t('inputMode.text') + ' / ' + t('inputMode.image')"
  >
    <!-- 文字模式按钮 -->
    <button
      type="button"
      class="mode-btn"
      :class="{ 'mode-btn--active': isTextMode }"
      :disabled="disabled"
      :aria-pressed="isTextMode"
      :title="t('inputMode.switchToText')"
      @click="switchToText"
    >
      <!-- 文字图标 -->
      <svg 
        class="mode-icon" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
        aria-hidden="true"
      >
        <path d="M4 7V4h16v3" />
        <path d="M9 20h6" />
        <path d="M12 4v16" />
      </svg>
      <span class="mode-label">{{ t('inputMode.text') }}</span>
    </button>

    <!-- 图片模式按钮 -->
    <button
      type="button"
      class="mode-btn"
      :class="{ 'mode-btn--active': isImageMode }"
      :disabled="disabled"
      :aria-pressed="isImageMode"
      :title="t('inputMode.switchToImage')"
      @click="switchToImage"
    >
      <!-- 图片图标 -->
      <svg 
        class="mode-icon" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      <span class="mode-label">{{ t('inputMode.image') }}</span>
    </button>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInputRef"
      type="file"
      class="file-input"
      :accept="acceptedFormats"
      @change="handleFileChange"
    />
  </div>
</template>

<style scoped>
.input-mode-toggle {
  display: inline-flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs);
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg);
  transition: opacity var(--transition-fast) ease-out;
}

.input-mode-toggle--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: 
    background-color var(--transition-fast) ease-out,
    color var(--transition-fast) ease-out,
    transform var(--transition-fast) ease-out;
}

.mode-btn:hover:not(:disabled) {
  background: var(--accent-light);
  color: var(--accent);
}

.mode-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.mode-btn--active {
  background: var(--accent);
  color: white;
}

.mode-btn--active:hover:not(:disabled) {
  background: var(--accent-hover);
  color: white;
}

.mode-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.mode-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.mode-label {
  white-space: nowrap;
}

.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 响应式：小屏幕隐藏文字标签 */
@media (max-width: 480px) {
  .mode-label {
    display: none;
  }
  
  .mode-btn {
    padding: var(--spacing-sm);
    /* Ensure minimum touch target size */
    min-width: var(--touch-target-min, 44px);
    min-height: var(--touch-target-min, 44px);
  }
  
  .mode-icon {
    width: 20px;
    height: 20px;
  }
  
  .input-mode-toggle {
    padding: var(--spacing-xs);
    gap: 2px;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .mode-btn {
    min-height: var(--touch-target-min, 44px);
    -webkit-tap-highlight-color: transparent;
  }
  
  .mode-btn:active:not(:disabled) {
    transform: scale(0.95);
  }
}
</style>
