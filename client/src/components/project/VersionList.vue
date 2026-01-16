<script setup lang="ts">
/**
 * 版本列表组件
 * 显示版本时间线（时间、类型、缩略图）
 * 实现 Checkout 按钮功能
 */
import { computed } from 'vue';
import type { Version, VersionType } from '../../types';

// ==================== Props ====================
interface Props {
  versions: Version[];
  currentVersionId: string | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

// ==================== Emits ====================
const emit = defineEmits<{
  (e: 'select', versionId: string): void;
  (e: 'checkout', versionId: string): void;
}>();

// ==================== 版本类型映射 ====================
const versionTypeLabels: Record<VersionType, string> = {
  imported: '导入',
  json_edit: 'JSON 编辑',
  selected_candidate: '选择候选图',
  checkout: '回溯',
};

const versionTypeColors: Record<VersionType, string> = {
  imported: '#10b981',
  json_edit: '#3b82f6',
  selected_candidate: '#8b5cf6',
  checkout: '#f59e0b',
};

// ==================== 计算属性 ====================
const sortedVersions = computed(() => {
  return [...props.versions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
});

// ==================== 方法 ====================
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // 小于 1 分钟
  if (diff < 60 * 1000) {
    return '刚刚';
  }
  // 小于 1 小时
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes} 分钟前`;
  }
  // 小于 24 小时
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours} 小时前`;
  }
  // 其他情况显示日期时间
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function handleSelect(versionId: string): void {
  emit('select', versionId);
}

function handleCheckout(versionId: string, event: Event): void {
  event.stopPropagation();
  emit('checkout', versionId);
}

function isCurrentVersion(versionId: string): boolean {
  return versionId === props.currentVersionId;
}
</script>

<template>
  <div class="version-list">
    <div class="version-list__header">
      <h3 class="version-list__title">版本历史</h3>
      <span class="version-list__count">{{ versions.length }} 个版本</span>
    </div>

    <div v-if="loading" class="version-list__loading">
      <div class="version-list__spinner"></div>
      <span>加载中...</span>
    </div>

    <div v-else-if="sortedVersions.length === 0" class="version-list__empty">
      暂无版本记录
    </div>

    <div v-else class="version-list__timeline">
      <div
        v-for="version in sortedVersions"
        :key="version.id"
        class="version-item"
        :class="{ 'version-item--active': isCurrentVersion(version.id) }"
        @click="handleSelect(version.id)"
      >
        <!-- 时间线连接线 -->
        <div class="version-item__line">
          <div
            class="version-item__dot"
            :style="{ backgroundColor: versionTypeColors[version.versionType] }"
          ></div>
        </div>

        <!-- 版本内容 -->
        <div class="version-item__content">
          <!-- 缩略图 -->
          <div class="version-item__thumbnail">
            <img
              v-if="version.imageUrl"
              :src="version.imageUrl"
              :alt="`版本 ${version.id.slice(0, 8)}`"
              class="version-item__image"
            />
            <div v-else class="version-item__placeholder">
              <span>无图片</span>
            </div>
          </div>

          <!-- 版本信息 -->
          <div class="version-item__info">
            <div class="version-item__type">
              <span
                class="version-item__badge"
                :style="{ backgroundColor: versionTypeColors[version.versionType] }"
              >
                {{ versionTypeLabels[version.versionType] }}
              </span>
              <span v-if="isCurrentVersion(version.id)" class="version-item__current">
                当前
              </span>
            </div>
            <div class="version-item__time">
              {{ formatTime(version.createdAt) }}
            </div>
          </div>

          <!-- Checkout 按钮（禁止回溯到类型为"回溯"的版本） -->
          <button
            v-if="!isCurrentVersion(version.id) && version.versionType !== 'checkout'"
            class="version-item__checkout"
            title="回溯到此版本"
            @click="handleCheckout(version.id, $event)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.version-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
}

.version-list__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #333;
}

.version-list__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.version-list__count {
  font-size: 12px;
  color: #888;
}

.version-list__loading,
.version-list__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: #888;
  font-size: 14px;
  gap: 12px;
}

.version-list__spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #333;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.version-list__timeline {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.version-item {
  display: flex;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.version-item:hover {
  background: #2a2a2a;
}

.version-item--active {
  background: #2d3748;
}

.version-item__line {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
  margin-right: 12px;
}

.version-item__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.version-item:not(:last-child) .version-item__line::after {
  content: '';
  flex: 1;
  width: 2px;
  background: #333;
  margin-top: 4px;
}

.version-item__content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.version-item__thumbnail {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  background: #333;
}

.version-item__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.version-item__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #666;
}

.version-item__info {
  flex: 1;
  min-width: 0;
}

.version-item__type {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.version-item__badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
}

.version-item__current {
  font-size: 11px;
  color: #10b981;
  font-weight: 500;
}

.version-item__time {
  font-size: 12px;
  color: #888;
}

.version-item__checkout {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #888;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.version-item__checkout:hover {
  background: #3b82f6;
  color: #fff;
}

.version-item__checkout svg {
  width: 16px;
  height: 16px;
}
</style>
