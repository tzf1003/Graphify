<script setup lang="ts">
/**
 * ProjectSidebar.vue - 项目侧边栏
 * 从左侧滑出的项目列表，支持展开/收起
 */
import { computed } from 'vue';
import { useI18n } from '@/composables/useI18n';
import type { Project } from '@/types';

interface Props {
  projects: Project[];
  loading?: boolean;
  isOpen: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'select', project: Project): void;
  (e: 'close'): void;
}>();

const { t, locale } = useI18n();

/** 格式化日期 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const localeStr = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US';
  return date.toLocaleDateString(localeStr, {
    month: 'short',
    day: 'numeric',
  });
}

/** 获取项目缩略图 URL */
function getThumbnailUrl(project: Project): string | null {
  return project.thumbnailUrl || null;
}

/** 处理项目点击 */
function handleProjectClick(project: Project): void {
  emit('select', project);
}

/** 是否有项目 */
const hasProjects = computed(() => props.projects.length > 0);
</script>

<template>
  <Transition name="sidebar">
    <aside v-if="isOpen" class="project-sidebar">
      <!-- 侧边栏头部 -->
      <div class="sidebar-header">
        <h2 class="sidebar-title">{{ t('common.myProjects') }}</h2>
        <button class="close-btn" @click="emit('close')" :title="t('common.close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- 项目列表 -->
      <div class="sidebar-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <span>{{ t('common.loading') }}</span>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!hasProjects" class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p class="empty-text">{{ t('project.empty') }}</p>
        </div>

        <!-- 项目列表 -->
        <div v-else class="project-list">
          <button
            v-for="project in projects"
            :key="project.id"
            class="project-item"
            @click="handleProjectClick(project)"
          >
            <div class="project-thumbnail">
              <img
                v-if="getThumbnailUrl(project)"
                :src="getThumbnailUrl(project)!"
                :alt="project.name"
                loading="lazy"
              />
              <div v-else class="thumbnail-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                  <path d="M21 15l-5-5L5 21" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <div class="project-info">
              <span class="project-name" :title="project.name">{{ project.name }}</span>
              <span class="project-date">{{ formatDate(project.createdAt) }}</span>
            </div>
          </button>
        </div>
      </div>
    </aside>
  </Transition>

  <!-- 遮罩层 -->
  <Transition name="fade">
    <div v-if="isOpen" class="sidebar-overlay" @click="emit('close')"></div>
  </Transition>
</template>

<style scoped>
.project-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 320px;
  max-width: 85vw;
  z-index: 200;
  display: flex;
  flex-direction: column;
  
  /* Glassmorphism */
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid var(--border-glass);
  box-shadow: var(--shadow-xl);
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 199;
  background: var(--bg-overlay);
  backdrop-filter: blur(4px);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-glass);
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast) ease-out;
}

.close-btn:hover {
  background: var(--accent-light);
  color: var(--text-primary);
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  gap: var(--spacing-md);
  color: var(--text-secondary);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-glass);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: var(--text-muted);
  margin-bottom: var(--spacing-md);
}

.empty-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

/* 项目列表 */
.project-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.project-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  width: 100%;
  padding: var(--spacing-sm);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  text-align: left;
  transition: all var(--transition-fast) ease-out;
}

.project-item:hover {
  background: var(--bg-glass-hover);
  border-color: var(--border-glass);
}

.project-thumbnail {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-secondary);
}

.project-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.thumbnail-placeholder svg {
  width: 24px;
  height: 24px;
}

.project-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.project-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-date {
  font-size: 12px;
  color: var(--text-muted);
}

/* 动画 */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: transform var(--transition-normal) ease-out;
}

.sidebar-enter-from,
.sidebar-leave-to {
  transform: translateX(-100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal) ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .project-sidebar {
    width: 100%;
    max-width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation: none;
  }
}
</style>
