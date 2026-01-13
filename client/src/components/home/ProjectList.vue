<script setup lang="ts">
/**
 * ProjectList 组件
 * 项目列表，采用毛玻璃风格卡片
 * 
 * Requirements: 9.1, 9.3
 */
import { computed } from 'vue';
import { useI18n } from '@/composables/useI18n';
import type { Project } from '@/types';

interface Props {
  projects: Project[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'select', project: Project): void;
}>();

const { t, locale } = useI18n();

/** 格式化日期 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const localeStr = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US';
  return date.toLocaleDateString(localeStr, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
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
  <div class="project-list">
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
      <p class="empty-hint">{{ t('chat.uploadHint') }}</p>
    </div>

    <!-- 项目网格 -->
    <div v-else class="project-grid">
      <div
        v-for="project in projects"
        :key="project.id"
        class="project-card"
        @click="handleProjectClick(project)"
        tabindex="0"
        role="button"
        @keydown.enter="handleProjectClick(project)"
        @keydown.space.prevent="handleProjectClick(project)"
      >
        <div class="project-thumbnail">
          <img
            v-if="getThumbnailUrl(project)"
            :src="getThumbnailUrl(project)!"
            :alt="project.name"
            loading="lazy"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
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
          <h3 class="project-name" :title="project.name">{{ project.name }}</h3>
          <p class="project-date">{{ formatDate(project.createdAt) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-list {
  width: 100%;
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
  to {
    transform: rotate(360deg);
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) var(--spacing-md);
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: var(--text-muted);
  margin-bottom: var(--spacing-md);
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.empty-hint {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 项目网格 */
.project-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md);
}

/* 项目卡片 - 毛玻璃风格 */
.project-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm);
  
  /* Glassmorphism 效果 */
  background: var(--bg-glass);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg);
  
  cursor: pointer;
  transition: 
    background-color var(--transition-fast) ease-out,
    transform var(--transition-fast) ease-out,
    box-shadow var(--transition-fast) ease-out,
    border-color var(--transition-fast) ease-out;
}

.project-card:hover {
  background: var(--bg-glass-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--accent-light);
}

.project-card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.project-card:active {
  transform: translateY(0);
}

/* 缩略图 */
.project-thumbnail {
  position: relative;
  width: 64px;
  height: 64px;
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
  background: var(--bg-secondary);
  color: var(--text-muted);
}

.thumbnail-placeholder svg {
  width: 24px;
  height: 24px;
}

/* 项目信息 */
.project-info {
  flex: 1;
  min-width: 0;
}

.project-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-date {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .project-grid {
    gap: var(--spacing-sm);
  }
  
  .project-card {
    padding: var(--spacing-sm);
  }
  
  .project-thumbnail {
    width: 56px;
    height: 56px;
  }
}

/* Reduced motion 支持 */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation: none;
  }
  
  .project-card {
    transition: none;
  }
  
  .project-card:hover {
    transform: none;
  }
}
</style>
