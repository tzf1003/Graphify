/**
 * Project Store
 * 管理当前项目、版本列表、当前版本状态
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  Project,
  Version,
  CanonicalJSON,
  UpdateProjectRequest,
} from '../types';
import {
  getProject,
  updateProject as apiUpdateProject,
  listVersions,
  createVersion,
  uploadProject,
} from '../api';

export const useProjectStore = defineStore('project', () => {
  // ==================== 状态 ====================

  /** 当前项目 */
  const currentProject = ref<Project | null>(null);

  /** 版本列表（按创建时间倒序） */
  const versions = ref<Version[]>([]);

  /** 当前选中的版本 */
  const currentVersion = ref<Version | null>(null);

  /** 加载状态 */
  const loading = ref(false);

  /** 错误信息 */
  const error = ref<string | null>(null);

  /** 版本加载状态 */
  const versionsLoading = ref(false);

  // ==================== 计算属性 ====================

  /** 当前版本的 JSON 内容 */
  const currentJsonContent = computed<CanonicalJSON | null>(() => {
    return currentVersion.value?.jsonContent ?? null;
  });

  /** 当前版本的图片 URL */
  const currentImageUrl = computed<string | null>(() => {
    return currentVersion.value?.imageUrl ?? null;
  });

  /** 是否有项目加载 */
  const hasProject = computed(() => currentProject.value !== null);

  // ==================== Actions ====================

  /**
   * 获取项目详情
   */
  async function fetchProject(projectId: string): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const { project } = await getProject(projectId);
      currentProject.value = project;

      // 同时加载版本列表
      await fetchVersions(projectId);

      // 设置当前版本为项目的 currentVersionId 对应的版本
      if (project.currentVersionId) {
        const version = versions.value.find((v: Version) => v.id === project.currentVersionId);
        if (version) {
          currentVersion.value = version;
        } else if (versions.value.length > 0) {
          // 如果找不到，使用最新版本
          currentVersion.value = versions.value[0];
        }
      } else if (versions.value.length > 0) {
        currentVersion.value = versions.value[0];
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取项目失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 更新项目设置
   */
  async function updateProjectSettings(data: UpdateProjectRequest): Promise<void> {
    if (!currentProject.value) {
      throw new Error('没有当前项目');
    }

    loading.value = true;
    error.value = null;

    try {
      const { project } = await apiUpdateProject(currentProject.value.id, data);
      currentProject.value = project;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新项目失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取版本列表
   */
  async function fetchVersions(projectId?: string): Promise<void> {
    const id = projectId || currentProject.value?.id;
    if (!id) {
      throw new Error('没有项目 ID');
    }

    versionsLoading.value = true;

    try {
      const { versions: versionList } = await listVersions(id);
      versions.value = versionList;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取版本列表失败';
      throw err;
    } finally {
      versionsLoading.value = false;
    }
  }

  /**
   * 创建 JSON 编辑版本
   */
  async function createJsonEditVersion(jsonContent: string): Promise<Version> {
    if (!currentProject.value) {
      throw new Error('没有当前项目');
    }

    loading.value = true;
    error.value = null;

    try {
      const { version } = await createVersion(currentProject.value.id, {
        versionType: 'json_edit',
        jsonContent,
      });

      // 添加到版本列表头部
      versions.value.unshift(version);

      // 更新当前版本
      currentVersion.value = version;

      // 更新项目的 currentVersionId
      if (currentProject.value) {
        currentProject.value.currentVersionId = version.id;
      }

      return version;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建版本失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 创建 Checkout 版本
   */
  async function createCheckoutVersion(sourceVersionId: string): Promise<Version> {
    if (!currentProject.value) {
      throw new Error('没有当前项目');
    }

    loading.value = true;
    error.value = null;

    try {
      const { version } = await createVersion(currentProject.value.id, {
        versionType: 'checkout',
        sourceVersionId,
      });

      // 添加到版本列表头部
      versions.value.unshift(version);

      // 更新当前版本
      currentVersion.value = version;

      // 更新项目的 currentVersionId
      if (currentProject.value) {
        currentProject.value.currentVersionId = version.id;
      }

      return version;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建 Checkout 版本失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 选择版本（不创建新版本，仅切换查看）
   */
  function selectVersion(versionId: string): void {
    const version = versions.value.find((v: Version) => v.id === versionId);
    if (version) {
      currentVersion.value = version;
    }
  }

  /**
   * 上传图片创建新项目
   */
  async function createProject(
    file: File,
    options?: { name?: string; outputLanguage?: string }
  ): Promise<Project> {
    loading.value = true;
    error.value = null;

    try {
      const { project, version } = await uploadProject(file, options);

      currentProject.value = project;
      versions.value = [version];
      currentVersion.value = version;

      return project;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建项目失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 添加新版本到列表（由 Generation Store 调用）
   */
  function addVersion(version: Version): void {
    versions.value.unshift(version);
    currentVersion.value = version;

    if (currentProject.value) {
      currentProject.value.currentVersionId = version.id;
    }
  }

  /**
   * 清除当前项目状态
   */
  function clearProject(): void {
    currentProject.value = null;
    versions.value = [];
    currentVersion.value = null;
    error.value = null;
  }

  // ==================== 返回 ====================

  return {
    // 状态
    currentProject,
    versions,
    currentVersion,
    loading,
    error,
    versionsLoading,

    // 计算属性
    currentJsonContent,
    currentImageUrl,
    hasProject,

    // Actions
    fetchProject,
    updateProjectSettings,
    fetchVersions,
    createJsonEditVersion,
    createCheckoutVersion,
    selectVersion,
    createProject,
    addVersion,
    clearProject,
  };
});
