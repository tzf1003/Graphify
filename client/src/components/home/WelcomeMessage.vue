<script setup lang="ts">
/**
 * WelcomeMessage.vue - 欢迎消息组件
 * 打字机效果标题 + 副标题
 */
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useI18n } from '@/composables/useI18n';

const emit = defineEmits<{
  (e: 'title-complete'): void;
}>();

const { t } = useI18n();

// 打字机状态
const displayedTitle = ref('');
const isTitleTyping = ref(true);
const showSubtitle = ref(false);

// 欢迎标题
const welcomeTitle = computed(() => t('welcome.title') || '你好，我是你的设计助手');

// 副标题
const subtitle = computed(() => t('welcome.subtitle') || '上传图片或描述你的想法，让我帮你创建设计');

let titleTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 打字机效果 - 标题
 */
function typeTitle(): void {
  const text = welcomeTitle.value;
  let index = 0;
  
  titleTimer = setInterval(() => {
    if (index < text.length) {
      displayedTitle.value = text.slice(0, index + 1);
      index++;
    } else {
      if (titleTimer) clearInterval(titleTimer);
      isTitleTyping.value = false;
      // 标题打完后显示副标题
      setTimeout(() => {
        showSubtitle.value = true;
        // 通知父组件标题完成
        emit('title-complete');
      }, 300);
    }
  }, 60);
}

onMounted(() => {
  typeTitle();
});

onUnmounted(() => {
  if (titleTimer) clearInterval(titleTimer);
});
</script>

<template>
  <div class="welcome-message">
    <!-- 欢迎标题 -->
    <h1 class="welcome-title">
      <span class="title-text">{{ displayedTitle }}</span>
      <span v-if="isTitleTyping" class="cursor">|</span>
    </h1>
    
    <!-- 副标题 -->
    <Transition name="fade-up">
      <p v-if="showSubtitle" class="welcome-subtitle">
        {{ subtitle }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.welcome-message {
  text-align: center;
  padding: var(--spacing-md) var(--spacing-md) 0;
  max-width: 700px;
  margin: 0 auto;
}

/* 欢迎标题 */
.welcome-title {
  font-size: clamp(1.75rem, 5vw, 2.75rem);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-md) 0;
  line-height: 1.2;
  min-height: 1.2em;
}

.title-text {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.cursor {
  display: inline-block;
  color: var(--accent);
  animation: blink 1s step-end infinite;
  margin-left: 2px;
  font-weight: 400;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 副标题 */
.welcome-subtitle {
  font-size: 1.05rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
  opacity: 0.9;
}

/* 过渡动画 */
.fade-up-enter-active {
  transition: all 0.5s ease-out;
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

/* 响应式 */
@media (max-width: 768px) {
  .welcome-message {
    padding: var(--spacing-sm) var(--spacing-sm) 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cursor {
    animation: none;
    opacity: 1;
  }
}
</style>
