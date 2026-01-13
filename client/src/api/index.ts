/**
 * API 客户端
 * 封装所有后端 API 调用，提供统一的错误处理和响应转换
 */

import type {
  ApiError,
  UploadProjectResponse,
  GetProjectResponse,
  ListProjectsResponse,
  ListVersionsResponse,
  CreateVersionResponse,
  CreateJobResponse,
  GetJobResponse,
  UpdateProjectRequest,
  CreateVersionRequest,
  CreateJobRequest,
  SelectCandidateRequest,
  Project,
} from '../types';

// ==================== 配置 ====================

const API_BASE_URL = '/api';

// ==================== 错误处理 ====================

/** API 请求错误 */
export class ApiRequestError extends Error {
  code?: string;
  details?: unknown;
  statusCode: number;

  constructor(message: string, statusCode: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/** 处理响应错误 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
    }
    throw new ApiRequestError(
      errorData.error,
      response.status,
      errorData.code,
      errorData.details
    );
  }
  return response.json();
}

// ==================== 项目 API ====================

/**
 * 上传图片创建项目
 * POST /api/projects/upload
 */
export async function uploadProject(
  file: File,
  options?: { name?: string; outputLanguage?: string }
): Promise<UploadProjectResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (options?.name) {
    formData.append('name', options.name);
  }
  if (options?.outputLanguage) {
    formData.append('outputLanguage', options.outputLanguage);
  }

  const response = await fetch(`${API_BASE_URL}/projects/upload`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse<UploadProjectResponse>(response);
}

/**
 * 获取项目列表
 * GET /api/projects
 */
export async function listProjects(
  limit = 20,
  offset = 0
): Promise<ListProjectsResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  const response = await fetch(`${API_BASE_URL}/projects?${params}`);
  return handleResponse<ListProjectsResponse>(response);
}

/**
 * 获取项目详情
 * GET /api/projects/:id
 */
export async function getProject(id: string): Promise<GetProjectResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`);
  return handleResponse<GetProjectResponse>(response);
}

/**
 * 更新项目设置
 * PATCH /api/projects/:id
 */
export async function updateProject(
  id: string,
  data: UpdateProjectRequest
): Promise<{ project: Project }> {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return handleResponse<{ project: Project }>(response);
}

// ==================== 版本 API ====================

/**
 * 获取项目版本列表
 * GET /api/projects/:id/versions
 */
export async function listVersions(projectId: string): Promise<ListVersionsResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/versions`);
  return handleResponse<ListVersionsResponse>(response);
}

/**
 * 创建新版本
 * POST /api/projects/:id/versions
 */
export async function createVersion(
  projectId: string,
  data: CreateVersionRequest
): Promise<CreateVersionResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return handleResponse<CreateVersionResponse>(response);
}

// ==================== 生成任务 API ====================

/**
 * 创建生成任务
 * POST /api/projects/:id/generate
 */
export async function createGenerationJob(
  projectId: string,
  data?: CreateJobRequest
): Promise<CreateJobResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data || {}),
  });

  return handleResponse<CreateJobResponse>(response);
}

/**
 * 获取生成任务状态
 * GET /api/generations/:id
 */
export async function getGenerationJob(id: string): Promise<GetJobResponse> {
  const response = await fetch(`${API_BASE_URL}/generations/${id}`);
  return handleResponse<GetJobResponse>(response);
}

/**
 * 选择候选图创建新版本
 * POST /api/projects/:id/select
 */
export async function selectCandidate(
  projectId: string,
  data: SelectCandidateRequest
): Promise<CreateVersionResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return handleResponse<CreateVersionResponse>(response);
}

// ==================== 文字生成图片 API ====================

/** 文字生成图片响应 */
export interface GenerateFromTextResponse {
  project: Project;
  job?: {
    id: string;
    status: string;
  };
}

/**
 * 从文字描述生成图片并创建项目
 * POST /api/projects/generate-from-text
 * 
 * 注意：此API需要后端实现支持
 */
export async function generateImage(
  prompt: string,
  options?: { name?: string; outputLanguage?: string }
): Promise<GenerateFromTextResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/generate-from-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      name: options?.name,
      outputLanguage: options?.outputLanguage,
    }),
  });

  return handleResponse<GenerateFromTextResponse>(response);
}

// ==================== 导出所有 API ====================

export const api = {
  // 项目
  uploadProject,
  listProjects,
  getProject,
  updateProject,
  // 版本
  listVersions,
  createVersion,
  // 生成任务
  createGenerationJob,
  getGenerationJob,
  selectCandidate,
  // 文字生成
  generateImage,
};

export default api;
