/**
 * Generation Store
 * 管理生成任务状态、候选图列表
 * 实现轮询任务状态逻辑
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  GenerationJob,
  CandidateImage,
  CreateJobRequest,
  Version,
} from '../types';
import {
  createGenerationJob,
  getGenerationJob,
  selectCandidate,
} from '../api';
import { useProjectStore } from './project';

/** 轮询间隔（毫秒） */
const POLL_INTERVAL = 1500;

/** 最大轮询次数 */
const MAX_POLL_COUNT = 120; // 3 分钟

export const useGenerationStore = defineStore('generation', () => {
  // ==================== 状态 ====================

  /** 当前生成任务 */
  const currentJob = ref<GenerationJob | null>(null);

  /** 候选图列表 */
  const candidates = ref<CandidateImage[]>([]);

  /** 选中的候选图 ID */
  const selectedCandidateId = ref<string | null>(null);

  /** 是否正在生成 */
  const generating = ref(false);

  /** 是否正在轮询 */
  const polling = ref(false);

  /** 错误信息 */
  const error = ref<string | null>(null);

  /** 轮询定时器 ID */
  let pollTimerId: ReturnType<typeof setTimeout> | null = null;

  /** 轮询计数 */
  let pollCount = 0;

  // ==================== 计算属性 ====================

  /** 任务是否完成 */
  const isCompleted = computed(() => {
    const status = currentJob.value?.status;
    return status === 'succeeded' || status === 'failed';
  });

  /** 任务是否成功 */
  const isSucceeded = computed(() => currentJob.value?.status === 'succeeded');

  /** 任务是否失败 */
  const isFailed = computed(() => currentJob.value?.status === 'failed');

  /** 任务是否进行中 */
  const isRunning = computed(() => {
    const status = currentJob.value?.status;
    return status === 'queued' || status === 'running';
  });

  /** 选中的候选图 */
  const selectedCandidate = computed<CandidateImage | null>(() => {
    if (!selectedCandidateId.value) return null;
    return candidates.value.find((c: CandidateImage) => c.id === selectedCandidateId.value) ?? null;
  });

  // ==================== Actions ====================

  /**
   * 创建生成任务
   */
  async function createJob(
    projectId: string,
    options?: CreateJobRequest
  ): Promise<GenerationJob> {
    generating.value = true;
    error.value = null;
    candidates.value = [];
    selectedCandidateId.value = null;

    try {
      const { job } = await createGenerationJob(projectId, options);
      currentJob.value = job;

      // 开始轮询任务状态
      startPolling(job.id);

      return job;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建生成任务失败';
      generating.value = false;
      throw err;
    }
  }

  /**
   * 获取任务状态
   */
  async function fetchJobStatus(jobId: string): Promise<void> {
    try {
      const { job, candidates: candidateList } = await getGenerationJob(jobId);
      currentJob.value = job;

      if (candidateList) {
        candidates.value = candidateList;
      }

      // 如果任务完成，停止轮询
      if (job.status === 'succeeded' || job.status === 'failed') {
        stopPolling();
        generating.value = false;

        if (job.status === 'failed') {
          error.value = job.errorMessage || '生成任务失败';
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取任务状态失败';
      stopPolling();
      generating.value = false;
      throw err;
    }
  }

  /**
   * 开始轮询任务状态
   */
  function startPolling(jobId: string): void {
    stopPolling(); // 确保没有重复轮询
    polling.value = true;
    pollCount = 0;

    const poll = async () => {
      if (!polling.value) return;

      pollCount++;

      // 超过最大轮询次数
      if (pollCount > MAX_POLL_COUNT) {
        error.value = '任务超时，请稍后重试';
        stopPolling();
        generating.value = false;
        return;
      }

      try {
        await fetchJobStatus(jobId);

        // 如果还在轮询中，继续下一次
        if (polling.value) {
          pollTimerId = setTimeout(poll, POLL_INTERVAL);
        }
      } catch {
        // 错误已在 fetchJobStatus 中处理
      }
    };

    // 立即执行第一次
    poll();
  }

  /**
   * 停止轮询
   */
  function stopPolling(): void {
    polling.value = false;
    if (pollTimerId) {
      clearTimeout(pollTimerId);
      pollTimerId = null;
    }
  }

  /**
   * 选择候选图
   */
  function selectCandidateImage(candidateId: string): void {
    selectedCandidateId.value = candidateId;
  }

  /**
   * 确认选择候选图，创建新版本
   */
  async function confirmSelection(projectId: string): Promise<Version> {
    if (!currentJob.value || !selectedCandidateId.value) {
      throw new Error('没有选中的候选图');
    }

    generating.value = true;
    error.value = null;

    try {
      const { version } = await selectCandidate(projectId, {
        jobId: currentJob.value.id,
        candidateId: selectedCandidateId.value,
      });

      // 通知 Project Store 添加新版本
      const projectStore = useProjectStore();
      projectStore.addVersion(version);

      // 清除生成状态
      clearGeneration();

      return version;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '选择候选图失败';
      throw err;
    } finally {
      generating.value = false;
    }
  }

  /**
   * 清除生成状态
   */
  function clearGeneration(): void {
    stopPolling();
    currentJob.value = null;
    candidates.value = [];
    selectedCandidateId.value = null;
    generating.value = false;
    error.value = null;
  }

  /**
   * 取消当前生成任务
   */
  function cancelGeneration(): void {
    stopPolling();
    generating.value = false;
    // 注意：后端可能仍在执行任务，这里只是前端停止轮询
  }

  // ==================== 返回 ====================

  return {
    // 状态
    currentJob,
    candidates,
    selectedCandidateId,
    generating,
    polling,
    error,

    // 计算属性
    isCompleted,
    isSucceeded,
    isFailed,
    isRunning,
    selectedCandidate,

    // Actions
    createJob,
    fetchJobStatus,
    startPolling,
    stopPolling,
    selectCandidateImage,
    confirmSelection,
    clearGeneration,
    cancelGeneration,
  };
});
