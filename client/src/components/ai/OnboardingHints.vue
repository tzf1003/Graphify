<script setup lang="ts">
/**
 * OnboardingHints 组件
 * 创意引导提示系统，根据项目状态显示上下文相关的提示
 * 支持关闭/隐藏功能，session 级别持久化，多语言适配
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from '../../composables/useI18n';

// 提示上下文类型
export type HintContext = 'empty' | 'has-project' | 'generating';

// 提示项接口
export interface Hint {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: 'upload' | 'sparkles' | 'edit' | 'refresh';
  action?: string; // 可选的动作标识
}

// Props 定义
export interface OnboardingHintsProps {
  /** 当前上下文状态 */
  context?: HintContext;
  /** 是否显示组件 */
  visible?: boolean;
}

const props = withDefaults(defineProps<OnboardingHintsProps>(), {
  context: 'empty',
  visible: true
});

// Emits 定义
const emit = defineEmits<{
  (e: 'hint-click', hintId: string): void;
  (e: 'hint-dismiss', hintId: string): void;
}>();

const { t } = useI18n();

// Session Storage Key
const DISMISSED_HINTS_KEY = 'onboarding_dismissed_hints';

// 已关闭的提示 ID 集合
const dismissedHints = ref<Set<string>>(new Set());

// 根据上下文定义的提示配置
const hintsByContext: Record<HintContext, Hint[]> = {
  empty: [
    {
      id: 'upload',
      titleKey: 'hints.upload.title',
      descriptionKey: 'hints.upload.desc',
      icon: 'upload',
      action: 'upload'
    },
    {
      id: 'describe',
      titleKey: 'hints.describe.title',
      descriptionKey: 'hints.describe.desc',
      icon: 'sparkles',
      action: 'describe'
    }
  ],
  'has-project': [
    {
      id: 'edit',
      titleKey: 'hints.edit.title',
      descriptionKey: 'hints.edit.desc',
      icon: 'edit',
      action: 'edit'
    },
    {
      id: 'regenerate',
      titleKey: 'hints.regenerate.title',
      descriptionKey: 'hints.regenerate.desc',
      icon: 'refresh',
      action: 'regenerate'
    }
  ],
  generating: []
};

// 计算当前应显示的提示（排除已关闭的）
const visibleHints = computed(() => {
  const contextHints = hintsByContext[props.context] || [];
  return contextHints.filter(hint => !dismissedHints.value.has(hint.id));
});

// 是否有可显示的提示
const hasVisibleHints = computed(() => visibleHints.value.length > 0);

/**
 * 从 sessionStorage 加载已关闭的提示
 */
function loadDismissedHints(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = sessionStorage.getItem(DISMISSED_HINTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        dismissedHints.value = new Set(parsed);
      }
    }
  } catch (e) {
    console.warn('[OnboardingHints] Failed to load dismissed hints:', e);
  }
}

/**
 * 保存已关闭的提示到 sessionStorage
 */
function saveDismissedHints(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const arr = Array.from(dismissedHints.value);
    sessionStorage.setItem(DISMISSED_HINTS_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn('[OnboardingHints] Failed to save dismissed hints:', e);
  }
}

/**
 * 关闭/隐藏指定提示
 */
function dismissHint(hintId: string): void {
  dismissedHints.value.add(hintId);
  saveDismissedHints();
  emit('hint-dismiss', hintId);
}

/**
 * 点击提示卡片
 */
function handleHintClick(hint: Hint): void {
  emit('hint-click', hint.id);
}

/**
 * 获取图标 SVG 路径
 */
function getIconPath(icon: Hint['icon']): string {
  const icons: Record<Hint['icon'], string> = {
    upload: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
    sparkles: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
    edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
  };
  return icons[icon];
}

// 组件挂载时加载已关闭的提示
onMounted(() => {
  loadDismissedHints();
});

// 监听 dismissedHints 变化，自动保存
watch(dismissedHints, () => {
  saveDismissedHints();
}, { deep: true });
</script>

<template>
  <Transition name="hints-fade">
    <div 
      v-if="visible && hasVisibleHints"
      class="onboarding-hints"
      role="region"
      aria-label="Onboarding hints"
    >
      <TransitionGroup name="hint-card" tag="div" class="hints-grid">
        <div
          v-for="hint in visibleHints"
          :key="hint.id"
          class="hint-card"
          @click="handleHintClick(hint)"
        >
          <!-- 关闭按钮 -->
          <button
            class="hint-close"
            :aria-label="t('common.close')"
            @click.stop="dismissHint(hint.id)"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
              class="close-icon"
            >
              <path 
                fill-rule="evenodd" 
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                clip-rule="evenodd" 
              />
            </svg>
          </button>

          <!-- 图标 -->
          <div class="hint-icon">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                :d="getIconPath(hint.icon)" 
              />
            </svg>
          </div>

          <!-- 内容 -->
          <div class="hint-content">
            <h3 class="hint-title">{{ t(hint.titleKey) }}</h3>
            <p class="hint-description">{{ t(hint.descriptionKey) }}</p>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Transition>
</template>


<style scoped>
/* 容器样式 */
.onboarding-hints {
  width: 100%;
  margin-bottom: var(--spacing-md);
}

/* 提示卡片网格布局 */
.hints-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--spacing-md);
}

/* 单个提示卡片 */
.hint-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  
  /* Glassmorphism 效果 */
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg);
  
  /* 交互样式 */
  cursor: pointer;
  transition: 
    background-color var(--transition-normal) ease-out,
    transform var(--transition-fast) ease-out,
    box-shadow var(--transition-fast) ease-out,
    border-color var(--transition-normal) ease-out;
  
  box-shadow: var(--shadow-sm);
}

.hint-card:hover {
  background: var(--bg-glass-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--accent-muted, rgba(99, 102, 241, 0.3));
}

.hint-card:active {
  transform: translateY(0);
}

/* 关闭按钮 */
.hint-close {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  opacity: 0;
  transition: 
    opacity var(--transition-fast) ease-out,
    background-color var(--transition-fast) ease-out,
    color var(--transition-fast) ease-out;
}

.hint-card:hover .hint-close {
  opacity: 1;
}

.hint-close:hover {
  background: var(--bg-glass-hover);
  color: var(--text-primary);
}

.hint-close:focus-visible {
  opacity: 1;
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.close-icon {
  width: 14px;
  height: 14px;
}

/* 图标容器 */
.hint-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  
  background: var(--accent-bg, rgba(99, 102, 241, 0.1));
  border-radius: var(--radius-md);
  color: var(--accent);
  
  transition: 
    background-color var(--transition-normal) ease-out,
    transform var(--transition-fast) ease-out;
}

.hint-card:hover .hint-icon {
  background: var(--accent-bg-hover, rgba(99, 102, 241, 0.15));
  transform: scale(1.05);
}

.hint-icon svg {
  width: 20px;
  height: 20px;
}

/* 内容区域 */
.hint-content {
  flex: 1;
  min-width: 0;
  padding-right: var(--spacing-md);
}

.hint-title {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
}

.hint-description {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* 容器淡入淡出动画 */
.hints-fade-enter-active,
.hints-fade-leave-active {
  transition: opacity var(--transition-normal) ease-out;
}

.hints-fade-enter-from,
.hints-fade-leave-to {
  opacity: 0;
}

/* 单个卡片动画 */
.hint-card-enter-active {
  transition: 
    opacity var(--transition-normal) ease-out,
    transform var(--transition-normal) ease-out;
}

.hint-card-leave-active {
  transition: 
    opacity var(--transition-fast) ease-out,
    transform var(--transition-fast) ease-out;
  position: absolute;
}

.hint-card-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.hint-card-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

.hint-card-move {
  transition: transform var(--transition-normal) ease-out;
}

/* 响应式布局 */
@media (max-width: 767px) {
  .hints-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
  
  .hint-card {
    padding: var(--spacing-sm) var(--spacing-md);
    /* Ensure minimum touch target */
    min-height: var(--touch-target-comfortable, 48px);
  }
  
  .hint-icon {
    width: 36px;
    height: 36px;
  }
  
  .hint-icon svg {
    width: 18px;
    height: 18px;
  }
  
  /* Always show close button on mobile */
  .hint-close {
    opacity: 1;
    width: 32px;
    height: 32px;
    top: var(--spacing-xs);
    right: var(--spacing-xs);
  }
  
  .close-icon {
    width: 16px;
    height: 16px;
  }
  
  .hint-title {
    font-size: 0.875rem;
  }
  
  .hint-description {
    font-size: 0.75rem;
  }
  
  .hint-content {
    padding-right: var(--spacing-lg);
  }
}

/* Small mobile devices */
@media (max-width: 375px) {
  .onboarding-hints {
    margin-bottom: var(--spacing-sm);
  }
  
  .hint-card {
    padding: var(--spacing-xs) var(--spacing-sm);
    gap: var(--spacing-sm);
  }
  
  .hint-icon {
    width: 32px;
    height: 32px;
  }
  
  .hint-icon svg {
    width: 16px;
    height: 16px;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .hint-card {
    -webkit-tap-highlight-color: transparent;
  }
  
  .hint-card:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
  
  /* Disable hover effects on touch */
  .hint-card:hover {
    transform: none;
    box-shadow: var(--shadow-sm);
  }
  
  .hint-card:hover .hint-icon {
    transform: none;
  }
  
  .hint-close {
    opacity: 1;
  }
}

/* Reduced motion 支持 */
@media (prefers-reduced-motion: reduce) {
  .hint-card,
  .hint-close,
  .hint-icon,
  .hints-fade-enter-active,
  .hints-fade-leave-active,
  .hint-card-enter-active,
  .hint-card-leave-active,
  .hint-card-move {
    transition: none;
  }
  
  .hint-card:hover {
    transform: none;
  }
  
  .hint-card:hover .hint-icon {
    transform: none;
  }
}
</style>
