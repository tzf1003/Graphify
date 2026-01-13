<script setup lang="ts">
/**
 * DynamicHint.vue - 动态提示组件
 * 打字机效果轮播提示
 */
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useI18n } from '@/composables/useI18n';

interface Props {
  /** 是否开始播放 */
  active?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  active: false,
});

const { t } = useI18n();

// 状态
const currentHintIndex = ref(0);
const displayedHint = ref('');
const isHintTyping = ref(false);

// 动态提示列表
const hints = computed(() => [
  t('hints.upload.desc') || '上传设计图，智能解析元素与布局...',
  t('hints.describe.desc') || '描述你的想法，AI 为你生成专业设计...',
  t('hints.edit.desc') || '实时编辑调整，所见即所得...',
]);

let hintTimer: ReturnType<typeof setInterval> | null = null;
let hintCycleTimer: ReturnType<typeof setTimeout> | null = null;
let started = false;

/**
 * 打字机效果 - 提示
 */
function typeHint(text: string, onComplete: () => void): void {
  let index = 0;
  displayedHint.value = '';
  isHintTyping.value = true;
  
  hintTimer = setInterval(() => {
    if (index < text.length) {
      displayedHint.value = text.slice(0, index + 1);
      index++;
    } else {
      if (hintTimer) clearInterval(hintTimer);
      isHintTyping.value = false;
      onComplete();
    }
  }, 40);
}

/**
 * 开始提示轮播
 */
function startHintCycle(): void {
  if (started) return;
  started = true;
  
  const cycleHint = () => {
    const hint = hints.value[currentHintIndex.value];
    
    typeHint(hint, () => {
      hintCycleTimer = setTimeout(() => {
        displayedHint.value = '';
        
        setTimeout(() => {
          currentHintIndex.value = (currentHintIndex.value + 1) % hints.value.length;
          cycleHint();
        }, 300);
      }, 3000);
    });
  };
  
  cycleHint();
}

// 监听 active 变化
onMounted(() => {
  if (props.active) {
    setTimeout(() => startHintCycle(), 500);
  }
});

// 当 active 变为 true 时开始
import { watch } from 'vue';
watch(() => props.active, (newVal) => {
  if (newVal && !started) {
    setTimeout(() => startHintCycle(), 500);
  }
});

onUnmounted(() => {
  if (hintTimer) clearInterval(hintTimer);
  if (hintCycleTimer) clearTimeout(hintCycleTimer);
});
</script>

<template>
  <div class="hint-container">
    <Transition name="fade" mode="out-in">
      <p v-if="displayedHint" :key="currentHintIndex" class="dynamic-hint">
        <span class="hint-icon">✦</span>
        <span class="hint-text">{{ displayedHint }}</span>
        <span v-if="isHintTyping" class="hint-cursor">|</span>
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.hint-container {
  min-height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dynamic-hint {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0;
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--bg-glass);
  border-radius: var(--radius-full);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.hint-icon {
  color: var(--accent);
  font-size: 0.8rem;
  opacity: 0.8;
}

.hint-text {
  color: var(--text-secondary);
}

.hint-cursor {
  color: var(--accent);
  animation: blink 0.8s step-end infinite;
  font-weight: 300;
  opacity: 0.7;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .dynamic-hint {
    font-size: 0.85rem;
    padding: var(--spacing-xs) var(--spacing-sm);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hint-cursor {
    animation: none;
    opacity: 1;
  }
}
</style>
