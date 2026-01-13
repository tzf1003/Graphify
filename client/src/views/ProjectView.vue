<script setup lang="ts">
/**
 * 项目编辑页
 * 布局：左侧版本列表、中间图片预览、右侧编辑器和生成面板
 * 连接所有子组件和 Store
 */
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '../stores/project';
import { useGenerationStore } from '../stores/generation';
import VersionList from '../components/project/VersionList.vue';
import ImagePreview from '../components/project/ImagePreview.vue';
import GraphJsonEditor from '../components/project/GraphJsonEditor.vue';
import GeneratePanel from '../components/project/GeneratePanel.vue';
import CandidateGrid from '../components/project/CandidateGrid.vue';

// ==================== 路由 ====================
const route = useRoute();
const router = useRouter();
const projectId = computed(() => route.params.id as string);

// ==================== Store ====================
const projectStore = useProjectStore();
const generationStore = useGenerationStore();

// ==================== 状态 ====================
const savingJson = ref(false);
const activeTab = ref<'editor' | 'generate'>('editor');
const confirmingSelection = ref(false);

// ==================== 计算属性 ====================
const project = computed(() => projectStore.currentProject);
const versions = computed(() => projectStore.versions);
const currentVersion = computed(() => projectStore.currentVersion);
const currentVersionId = computed(() => currentVersion.value?.id ?? null);
const currentImageUrl = computed(() => projectStore.currentImageUrl);
const currentJsonContent = computed(() => projectStore.currentJsonContent);

const loading = computed(() => projectStore.loading);
const versionsLoading = computed(() => projectStore.versionsLoading);
const error = computed(() => projectStore.error);

const generating = computed(() => generationStore.generating);
const jobStatus = computed(() => generationStore.currentJob?.status ?? null);
const jobError = computed(() => generationStore.error);
const candidates = computed(() => generationStore.candidates);
const selectedCandidateId = computed(() => generationStore.selectedCandidateId);
const hasCandidates = computed(() => candidates.value.length > 0);

// ==================== 生命周期 ====================
onMounted(async () => {
  await loadProject();
});

onBeforeUnmount(() => {
  // 清理生成状态
  generationStore.clearGeneration();
});

// ==================== 监听路由变化 ====================
watch(projectId, async (newId: string) => {
  if (newId) {
    await loadProject();
  }
});

// ==================== 方法 ====================
async function loadProject(): Promise<void> {
  try {
    await projectStore.fetchProject(projectId.value);
  } catch (err) {
    console.error('加载项目失败:', err);
  }
}

function handleVersionSelect(versionId: string): void {
  projectStore.selectVersion(versionId);
}

async function handleVersionCheckout(versionId: string): Promise<void> {
  try {
    await projectStore.createCheckoutVersion(versionId);
  } catch (err) {
    console.error('Checkout 失败:', err);
  }
}

async function handleJsonSave(jsonString: string): Promise<void> {
  savingJson.value = true;
  try {
    await projectStore.createJsonEditVersion(jsonString);
  } catch (err) {
    console.error('保存 JSON 失败:', err);
  } finally {
    savingJson.value = false;
  }
}

function handleJsonError(errorMsg: string): void {
  console.error('JSON 错误:', errorMsg);
}

async function handleGenerate(options: { count: number; seed?: number; strength?: number }): Promise<void> {
  try {
    await generationStore.createJob(projectId.value, options);
    // 切换到生成标签页
    activeTab.value = 'generate';
  } catch (err) {
    console.error('创建生成任务失败:', err);
  }
}

function handleGenerateCancel(): void {
  generationStore.cancelGeneration();
}

function handleCandidateSelect(candidateId: string): void {
  generationStore.selectCandidateImage(candidateId);
}

async function handleCandidateConfirm(): Promise<void> {
  confirmingSelection.value = true;
  try {
    await generationStore.confirmSelection(projectId.value);
    // 切换回编辑器标签页
    activeTab.value = 'editor';
  } catch (err) {
    console.error('确认选择失败:', err);
  } finally {
    confirmingSelection.value = false;
  }
}

function handleCandidateCancel(): void {
  generationStore.clearGeneration();
}

function goBack(): void {
  router.push('/');
}
</script>

<template>
  <div class="project-view">
    <!-- 顶部导航 -->
    <header class="project-view__header">
      <button class="project-view__back" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
        <span>返回</span>
      </button>
      <div class="project-view__title">
        <h1 v-if="project">{{ project.name }}</h1>
        <span v-if="project" class="project-view__lang">{{ project.outputLanguage }}</span>
      </div>
      <div class="project-view__spacer"></div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading && !project" class="project-view__loading">
      <div class="project-view__spinner"></div>
      <span>加载项目中...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error && !project" class="project-view__error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6M9 9l6 6" />
      </svg>
      <span>{{ error }}</span>
      <button class="project-view__retry" @click="loadProject">重试</button>
    </div>

    <!-- 主内容区 -->
    <main v-else class="project-view__main">
      <!-- 左侧：版本列表 -->
      <aside class="project-view__sidebar project-view__sidebar--left">
        <VersionList
          :versions="versions"
          :current-version-id="currentVersionId"
          :loading="versionsLoading"
          @select="handleVersionSelect"
          @checkout="handleVersionCheckout"
        />
      </aside>

      <!-- 中间：图片预览 -->
      <section class="project-view__center">
        <ImagePreview
          :image-url="currentImageUrl"
          :loading="loading"
          alt="当前版本图片"
        />
      </section>

      <!-- 右侧：编辑器和生成面板 -->
      <aside class="project-view__sidebar project-view__sidebar--right">
        <!-- 标签切换 -->
        <div class="project-view__tabs">
          <button
            class="project-view__tab"
            :class="{ 'project-view__tab--active': activeTab === 'editor' }"
            @click="activeTab = 'editor'"
          >
            JSON 编辑
          </button>
          <button
            class="project-view__tab"
            :class="{ 
              'project-view__tab--active': activeTab === 'generate',
              'project-view__tab--badge': hasCandidates
            }"
            @click="activeTab = 'generate'"
          >
            图片生成
            <span v-if="hasCandidates" class="project-view__badge">{{ candidates.length }}</span>
          </button>
        </div>

        <!-- 编辑器面板 -->
        <div v-show="activeTab === 'editor'" class="project-view__panel">
          <GraphJsonEditor
            :model-value="currentJsonContent"
            :saving="savingJson"
            @save="handleJsonSave"
            @error="handleJsonError"
          />
        </div>

        <!-- 生成面板 -->
        <div v-show="activeTab === 'generate'" class="project-view__panel">
          <!-- 生成设置 -->
          <GeneratePanel
            :generating="generating"
            :job-status="jobStatus"
            :error-message="jobError"
            :disabled="!currentVersion"
            @generate="handleGenerate"
            @cancel="handleGenerateCancel"
          />

          <!-- 候选图网格 -->
          <CandidateGrid
            v-if="hasCandidates || generating"
            :candidates="candidates"
            :selected-id="selectedCandidateId"
            :loading="generating && !hasCandidates"
            :confirming="confirmingSelection"
            @select="handleCandidateSelect"
            @confirm="handleCandidateConfirm"
            @cancel="handleCandidateCancel"
          />
        </div>
      </aside>
    </main>
  </div>
</template>

<style scoped>
.project-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #121212;
  color: #fff;
}

.project-view__header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #1a1a1a;
  border-bottom: 1px solid #333;
  gap: 16px;
}

.project-view__back {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #888;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.project-view__back:hover {
  background: #333;
  color: #fff;
}

.project-view__back svg {
  width: 16px;
  height: 16px;
}

.project-view__title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-view__title h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.project-view__lang {
  padding: 2px 8px;
  background: #333;
  border-radius: 4px;
  font-size: 11px;
  color: #888;
}

.project-view__spacer {
  flex: 1;
}

.project-view__loading,
.project-view__error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #666;
  font-size: 14px;
}

.project-view__error svg {
  width: 48px;
  height: 48px;
  color: #ef4444;
}

.project-view__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #333;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.project-view__retry {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #3b82f6;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.project-view__retry:hover {
  background: #2563eb;
}

.project-view__main {
  flex: 1;
  display: flex;
  min-height: 0;
  padding: 16px;
  gap: 16px;
}

.project-view__sidebar {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.project-view__sidebar--left {
  width: 280px;
  flex-shrink: 0;
}

.project-view__sidebar--right {
  width: 400px;
  flex-shrink: 0;
}

.project-view__center {
  flex: 1;
  min-width: 0;
}

.project-view__tabs {
  display: flex;
  background: #1e1e1e;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
}

.project-view__tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: #888;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
}

.project-view__tab:hover {
  color: #fff;
  background: #2a2a2a;
}

.project-view__tab--active {
  color: #fff;
  background: #2a2a2a;
}

.project-view__tab--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #3b82f6;
}

.project-view__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #3b82f6;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}

.project-view__panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  background: #1e1e1e;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .project-view__sidebar--left {
    width: 240px;
  }
  
  .project-view__sidebar--right {
    width: 360px;
  }
}

@media (max-width: 992px) {
  .project-view__main {
    flex-direction: column;
  }
  
  .project-view__sidebar--left,
  .project-view__sidebar--right {
    width: 100%;
  }
  
  .project-view__center {
    height: 400px;
  }
}
</style>
