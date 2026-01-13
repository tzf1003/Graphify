<script setup lang="ts">
/**
 * TypingIndicator 组件
 * 显示 AI 正在输入的 3-dot pulse 动画
 * 
 * Requirements: 4.3
 */
import { useI18n } from '../../composables/useI18n';

export interface TypingIndicatorProps {
  /** 是否显示 */
  visible?: boolean;
  /** 自定义提示文本 */
  text?: string;
}

withDefaults(defineProps<TypingIndicatorProps>(), {
  visible: true,
  text: ''
});

const { t } = useI18n();
</script>

<template>
  <Transition name="typing-fade">
    <div 
      v-if="visible"
      class="typing-indicator"
      role="status"
      :aria-label="text || t('chat.generating')"
    >
      <!-- AI 头像 -->
      <div class="typing-avatar">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      </div>

      <!-- 打字动画气泡 -->
      <div class="typing-bubble">
        <div class="typing-dots">
          <span class="dot dot--1"></span>
          <span class="dot dot--2"></span>
          <span class="dot dot--3"></span>
        </div>
        <span v-if="text" class="typing-text">{{ text }}</span>
        <span v-else class="typing-text">{{ t('chat.generating') }}</span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.typing-indicator {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
}

/* 头像 */
.typing-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.typing-avatar svg {
  width: 20px;
  height: 20px;
}

/* 气泡 */
.typing-bubble {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm);
}

/* 三点动画 */
.typing-dots {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: dotPulse 1.4s ease-in-out infinite;
}

.dot--1 {
  animation-delay: 0s;
}

.dot--2 {
  animation-delay: 0.2s;
}

.dot--3 {
  animation-delay: 0.4s;
}

@keyframes dotPulse {
  0%, 60%, 100% {
    transform: scale(1);
    opacity: 0.4;
  }
  30% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* 提示文本 */
.typing-text {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 过渡动画 */
.typing-fade-enter-active,
.typing-fade-leave-active {
  transition: all var(--transition-normal) ease-out;
}

.typing-fade-enter-from,
.typing-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* 响应式 */
@media (max-width: 768px) {
  .typing-avatar {
    width: 32px;
    height: 32px;
  }
  
  .typing-avatar svg {
    width: 18px;
    height: 18px;
  }
  
  .dot {
    width: 6px;
    height: 6px;
  }
}

/* Reduced Motion 支持 */
@media (prefers-reduced-motion: reduce) {
  .dot {
    animation: none;
    opacity: 0.6;
  }
  
  .dot--2 {
    opacity: 0.8;
  }
  
  .dot--3 {
    opacity: 1;
  }
}
</style>
