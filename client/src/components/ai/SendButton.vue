<script setup lang="ts">
/**
 * SendButton 组件
 * 发送按钮，支持禁用、加载和交互状态
 * 
 * Requirements: 8.1, 8.2, 8.5
 */
import { computed } from 'vue';
import { useI18n } from '../../composables/useI18n';

export interface SendButtonProps {
  /** 是否禁用（空输入时） */
  disabled?: boolean;
  /** 是否加载中（处理中） */
  loading?: boolean;
  /** 按钮大小 */
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<SendButtonProps>(), {
  disabled: false,
  loading: false,
  size: 'md'
});

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const { t } = useI18n();

// 计算按钮是否可点击
const isClickable = computed(() => !props.disabled && !props.loading);

// 处理点击
const handleClick = () => {
  if (isClickable.value) {
    emit('click');
  }
};
</script>

<template>
  <button
    type="button"
    class="send-button"
    :class="[
      `send-button--${size}`,
      { 'send-button--disabled': disabled },
      { 'send-button--loading': loading }
    ]"
    :disabled="!isClickable"
    :aria-label="t('common.send')"
    :title="t('common.send')"
    @click="handleClick"
  >
    <!-- 加载状态 -->
    <svg 
      v-if="loading"
      class="send-icon send-icon--spin" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      stroke-width="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32" />
    </svg>
    
    <!-- 发送图标 -->
    <svg 
      v-else
      class="send-icon" 
      viewBox="0 0 24 24" 
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
    </svg>
    
    <span class="sr-only">{{ t('common.send') }}</span>
  </button>
</template>

<style scoped>
.send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  cursor: pointer;
  transition: 
    background-color var(--transition-fast) ease-out,
    transform var(--transition-fast) ease-out,
    box-shadow var(--transition-fast) ease-out,
    opacity var(--transition-fast) ease-out;
}

/* 尺寸变体 */
.send-button--sm {
  width: 32px;
  height: 32px;
}

.send-button--sm .send-icon {
  width: 16px;
  height: 16px;
}

.send-button--md {
  width: 40px;
  height: 40px;
}

.send-button--md .send-icon {
  width: 20px;
  height: 20px;
}

.send-button--lg {
  width: 48px;
  height: 48px;
}

.send-button--lg .send-icon {
  width: 24px;
  height: 24px;
}

/* Hover 状态 */
.send-button:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(var(--accent), 0.3);
}

/* Active 状态 */
.send-button:active:not(:disabled) {
  transform: scale(0.95);
}

/* Focus 状态 */
.send-button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* 禁用状态 */
.send-button--disabled {
  background: var(--text-muted);
  cursor: not-allowed;
  opacity: 0.5;
}

.send-button--disabled:hover {
  transform: none;
  box-shadow: none;
}

/* 加载状态 */
.send-button--loading {
  cursor: wait;
}

.send-button--loading:hover {
  transform: none;
}

/* 图标 */
.send-icon {
  flex-shrink: 0;
}

/* 发送图标微调位置 */
.send-button:not(.send-button--loading) .send-icon {
  transform: translateX(1px);
}

/* 加载动画 */
.send-icon--spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 屏幕阅读器专用文本 */
.sr-only {
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

/* Reduced Motion 支持 */
@media (prefers-reduced-motion: reduce) {
  .send-button {
    transition: none;
  }
  
  .send-icon--spin {
    animation: none;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .send-button {
    -webkit-tap-highlight-color: transparent;
  }
  
  /* Ensure minimum touch target on mobile */
  .send-button--sm {
    width: 40px;
    height: 40px;
  }
  
  .send-button--md {
    width: var(--touch-target-min, 44px);
    height: var(--touch-target-min, 44px);
  }
  
  .send-button--lg {
    width: var(--touch-target-comfortable, 48px);
    height: var(--touch-target-comfortable, 48px);
  }
  
  .send-button:active:not(:disabled) {
    transform: scale(0.92);
    opacity: 0.9;
  }
  
  /* Disable hover effects on touch */
  .send-button:hover:not(:disabled) {
    transform: none;
    box-shadow: none;
  }
}
</style>
