<script setup lang="ts">
/**
 * HomeView.vue - 首页视图
 * 布局顺序：欢迎消息 → 输入框 → 动态提示
 */
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import WelcomeMessage from '@/components/home/WelcomeMessage.vue';
import PromptInput from '@/components/home/PromptInput.vue';
import DynamicHint from '@/components/home/DynamicHint.vue';
import ProjectSidebar from '@/components/home/ProjectSidebar.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import GlassCard from '@/components/common/GlassCard.vue';
import { useI18n } from '@/composables/useI18n';
import type { Project } from '@/types';
import { listProjects, uploadProject, generateImage } from '@/api';

const router = useRouter();
const { t } = useI18n();

// ==================== 状态 ====================

/** 项目列表 */
const projects = ref<Project[]>([]);

/** 加载状态 */
const loading = ref(false);

/** 处理状态 */
const processing = ref(false);

/** 错误信息 */
const error = ref<string | null>(null);

/** 侧边栏是否打开 */
const isSidebarOpen = ref(false);

/** 动态提示是否激活 */
const hintActive = ref(false);

// ==================== 方法 ====================

/** 加载项目列表 */
async function loadProjects(): Promise<void> {
  loading.value = true;
  error.value = null;

  try {
    const response = await listProjects();
    projects.value = response.projects;
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('errors.networkError');
    console.error('加载项目列表失败:', err);
  } finally {
    loading.value = false;
  }
}

/** 处理文字提交 - AI生成图片 */
async function handleTextSubmit(text: string): Promise<void> {
  if (processing.value) return;
  
  processing.value = true;
  error.value = null;

  try {
    // 调用AI生成图片API
    const response = await generateImage(text);
    
    // 生成成功，跳转到项目编辑页
    if (response.project?.id) {
      router.push(`/p/${response.project.id}`);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('errors.generationFailed');
    console.error('AI生成失败:', err);
  } finally {
    processing.value = false;
  }
}

/** 处理图片提交 - 上传并解析 */
async function handleImageSubmit(file: File): Promise<void> {
  if (processing.value) return;
  
  processing.value = true;
  error.value = null;

  try {
    const response = await uploadProject(file, {
      name: file.name.replace(/\.[^/.]+$/, ''),
    });

    // 上传成功，跳转到项目编辑页
    router.push(`/p/${response.project.id}`);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('errors.networkError');
    console.error('上传失败:', err);
  } finally {
    processing.value = false;
  }
}

/** 处理项目选择 */
function handleProjectSelect(project: Project): void {
  isSidebarOpen.value = false;
  router.push(`/p/${project.id}`);
}

/** 切换侧边栏 */
function toggleSidebar(): void {
  isSidebarOpen.value = !isSidebarOpen.value;
}

/** 欢迎消息完成回调 */
function handleTitleComplete(): void {
  hintActive.value = true;
}

/** 关闭错误提示 */
function dismissError(): void {
  error.value = null;
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadProjects();
});

// 暴露给父组件
defineExpose({
  toggleSidebar,
});
</script>

<template>
  <div class="home-view">
    <!-- 项目侧边栏 -->
    <ProjectSidebar
      :projects="projects"
      :loading="loading"
      :is-open="isSidebarOpen"
      @select="handleProjectSelect"
      @close="isSidebarOpen = false"
    />

    <!-- 侧边栏切换按钮 (固定在左侧) -->
    <button 
      v-if="projects.length > 0"
      class="sidebar-toggle"
      @click="toggleSidebar"
      :title="t('common.myProjects')"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="project-count">{{ projects.length }}</span>
    </button>

    <!-- 处理遮罩 -->
    <Transition name="fade">
      <div v-if="processing" class="processing-overlay">
        <GlassCard variant="elevated" padding="lg" rounded="xl">
          <div class="processing-content">
            <LoadingSpinner size="large" />
            <p>{{ t('chat.generating') }}</p>
          </div>
        </GlassCard>
      </div>
    </Transition>

    <!-- 错误提示 -->
    <Transition name="slide-down">
      <div v-if="error" class="error-toast" @click="dismissError">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="error-message">{{ error }}</span>
        <button class="error-close" @click.stop="dismissError">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </Transition>

    <!-- 主内容区域 - 垂直居中 -->
    <div class="home-content">
      <div class="content-wrapper">
        <!-- 欢迎消息 -->
        <WelcomeMessage @title-complete="handleTitleComplete" />

        <!-- 输入区域 -->
        <div class="input-section">
          <PromptInput
            :disabled="processing"
            :loading="processing"
            @submit-text="handleTextSubmit"
            @submit-image="handleImageSubmit"
          />
        </div>

        <!-- 动态提示 -->
        <DynamicHint :active="hintActive" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 侧边栏切换按钮 */
.sidebar-toggle {
  position: fixed;
  left: var(--spacing-md);
  top: 50%;
  transform: translateY(-50%);
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--bg-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast) ease-out;
  box-shadow: var(--shadow-md);
}

.sidebar-toggle:hover {
  background: var(--bg-glass-hover);
  color: var(--text-primary);
  border-color: var(--accent-light);
}

.sidebar-toggle svg {
  width: 24px;
  height: 24px;
}

.project-count {
  font-size: 11px;
  font-weight: 600;
  background: var(--accent);
  color: #fff;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  min-width: 20px;
  text-align: center;
}

/* 主内容区域 */
.home-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
  padding-top: 60px;
  overflow: hidden;
}

.content-wrapper {
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

/* 输入区域 - 作为视觉焦点 */
.input-section {
  width: 100%;
}

/* 处理遮罩 */
.processing-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-overlay);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.processing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  color: var(--text-primary);
  padding: var(--spacing-lg);
}

.processing-content p {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

/* 错误提示 */
.error-toast {
  position: fixed;
  top: calc(56px + var(--spacing-md) * 2 + var(--spacing-lg));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  max-width: calc(100% - var(--spacing-lg) * 2);
  
  /* Glassmorphism 效果 */
  background: rgba(239, 68, 68, 0.9);
  backdrop-filter: blur(var(--blur-glass));
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 1001;
  cursor: pointer;
  color: #ffffff;
}

.error-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.error-message {
  font-size: 14px;
  font-weight: 500;
  flex: 1;
}

.error-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: var(--radius-sm);
  color: #ffffff;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color var(--transition-fast) ease-out;
}

.error-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.error-close svg {
  width: 14px;
  height: 14px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal) ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: 
    opacity var(--transition-normal) ease-out,
    transform var(--transition-normal) ease-out;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .sidebar-toggle {
    left: var(--spacing-sm);
  }
}

@media (max-width: 768px) {
  .home-content {
    padding: var(--spacing-sm);
    padding-top: 56px;
  }
  
  .content-wrapper {
    gap: var(--spacing-sm);
  }
  
  .sidebar-toggle {
    top: auto;
    bottom: var(--spacing-lg);
    transform: none;
  }
  
  .error-toast {
    left: var(--spacing-sm);
    right: var(--spacing-sm);
    transform: none;
    top: calc(56px + var(--spacing-md));
  }
}

@media (max-width: 375px) {
  .home-content {
    padding: var(--spacing-xs);
    padding-top: 48px;
  }
}

/* Reduced motion 支持 */
@media (prefers-reduced-motion: reduce) {
  .sidebar-toggle,
  .error-toast {
    transition: none;
  }
}
</style>
