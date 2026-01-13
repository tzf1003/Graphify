<script setup lang="ts">
/**
 * GlassCard 组件
 * 实现毛玻璃效果的卡片组件，支持多种变体、内边距和圆角配置
 * 自动适配 light/dark 主题
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

export interface GlassCardProps {
  /** 卡片变体 */
  variant?: 'default' | 'elevated' | 'interactive';
  /** 内边距大小 */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** 圆角大小 */
  rounded?: 'sm' | 'md' | 'lg' | 'xl';
  /** 是否作为按钮使用 */
  as?: 'div' | 'button';
}

withDefaults(defineProps<GlassCardProps>(), {
  variant: 'default',
  padding: 'md',
  rounded: 'lg',
  as: 'div'
});

defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();
</script>

<template>
  <component
    :is="as"
    :class="[
      'glass-card',
      `glass-card--${variant}`,
      `glass-card--padding-${padding}`,
      `glass-card--rounded-${rounded}`
    ]"
    @click="$emit('click', $event)"
  >
    <slot />
  </component>
</template>

<style scoped>
/* Base Glass Card Styles */
.glass-card {
  /* Glassmorphism 效果 - Requirements 1.1, 1.2 */
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  
  /* 边框 - Requirements 1.3 */
  border: 1px solid var(--border-glass);
  
  /* 过渡动画 */
  transition: 
    background-color var(--transition-normal) ease-out,
    border-color var(--transition-normal) ease-out,
    transform var(--transition-fast) ease-out,
    box-shadow var(--transition-fast) ease-out;
}

/* Variant: Default */
.glass-card--default {
  box-shadow: var(--shadow-sm);
}

/* Variant: Elevated - 更强的阴影效果 */
.glass-card--elevated {
  box-shadow: var(--shadow-md);
}

/* Variant: Interactive - 可交互，带 hover 效果 */
.glass-card--interactive {
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}

.glass-card--interactive:hover {
  background: var(--bg-glass-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.glass-card--interactive:active {
  transform: translateY(0);
  box-shadow: var(--shadow-md);
}

.glass-card--interactive:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Padding Variants */
.glass-card--padding-none {
  padding: 0;
}

.glass-card--padding-sm {
  padding: var(--spacing-sm);
}

.glass-card--padding-md {
  padding: var(--spacing-md);
}

.glass-card--padding-lg {
  padding: var(--spacing-lg);
}

/* Rounded Variants */
.glass-card--rounded-sm {
  border-radius: var(--radius-sm);
}

.glass-card--rounded-md {
  border-radius: var(--radius-md);
}

.glass-card--rounded-lg {
  border-radius: var(--radius-lg);
}

.glass-card--rounded-xl {
  border-radius: var(--radius-xl);
}

/* Button Reset (when as="button") */
button.glass-card {
  font: inherit;
  color: inherit;
  text-align: inherit;
  width: 100%;
}
</style>
