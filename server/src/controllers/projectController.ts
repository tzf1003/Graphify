/**
 * 项目控制器
 * 处理项目相关的请求验证和业务逻辑协调
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { ProjectService, ProjectServiceError } from '../services/projectService';
import { VersionService, VersionServiceError } from '../services/versionService';
import { GenerationService, GenerationServiceError } from '../services/generationService';
import { AppError, toErrorResponse, getErrorStatusCode } from '../utils/errors';

// ==================== 请求类型定义 ====================

export interface UploadRequest {
  file: () => Promise<{
    toBuffer: () => Promise<Buffer>;
    mimetype: string;
    filename: string;
    fields: Record<string, { value?: string }>;
  } | undefined>;
}

export interface ProjectIdParams {
  id: string;
}

export interface UpdateProjectBody {
  name?: string;
  outputLanguage?: string;
}

export interface CreateVersionBody {
  versionType: 'json_edit' | 'checkout';
  jsonContent?: string;
  sourceVersionId?: string;
}

export interface GenerateBody {
  count?: number;
  seed?: number;
  strength?: number;
}

export interface SelectCandidateBody {
  jobId: string;
  candidateId: string;
}

export interface ListProjectsQuery {
  limit?: string;
  offset?: string;
}

// ==================== 错误处理辅助函数 ====================

/**
 * 统一错误响应处理
 * Requirements: 11.5 - 所有 API 错误响应使用统一格式 { error: string, code?: string, details?: any }
 */
function handleError(
  error: unknown,
  reply: FastifyReply,
  defaultCode: string
): FastifyReply {
  // 处理 utils/errors.ts 中定义的 AppError 及其子类
  if (error instanceof AppError) {
    const response = toErrorResponse(error, process.env.NODE_ENV === 'development');
    return reply.status(error.statusCode).send(response);
  }

  // 处理服务层自定义错误
  if (
    error instanceof ProjectServiceError ||
    error instanceof VersionServiceError ||
    error instanceof GenerationServiceError
  ) {
    return reply.status(error.statusCode).send({
      error: error.message,
      code: error.code,
    });
  }

  // 处理其他未知错误
  const err = error as Error;
  const statusCode = getErrorStatusCode(error);
  return reply.status(statusCode).send({
    error: err.message || '服务器内部错误',
    code: defaultCode,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

// ==================== 控制器类 ====================

export class ProjectController {
  constructor(
    private projectService: ProjectService,
    private versionService: VersionService,
    private generationService: GenerationService
  ) {}

  /**
   * 上传图片创建项目
   * POST /api/projects/upload
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
   */
  async upload(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      const data = await (request as unknown as UploadRequest).file();

      if (!data) {
        return reply.status(400).send({
          error: '请上传图片文件',
          code: 'NO_FILE_UPLOADED',
        });
      }

      const fileBuffer = await data.toBuffer();
      const mimeType = data.mimetype;
      const originalName = data.filename;
      const fileSize = fileBuffer.length;

      // 从 fields 中获取可选参数
      const fields = data.fields;
      const projectName = fields.name?.value;
      const outputLanguage = fields.outputLanguage?.value || fields.output_language?.value;

      const result = await this.projectService.uploadAndInitialize({
        fileBuffer,
        mimeType,
        originalName,
        fileSize,
        projectName,
        outputLanguage,
      });

      return reply.status(201).send({
        project: result.project,
        version: result.version,
        imageAsset: result.imageAsset,
      });
    } catch (error) {
      return handleError(error, reply, 'UPLOAD_FAILED');
    }
  }

  /**
   * 获取项目详情
   * GET /api/projects/:id
   */
  async getProject(
    request: FastifyRequest<{ Params: ProjectIdParams }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      const { id } = request.params;
      const project = await this.projectService.getProject(id);
      return reply.send({ project });
    } catch (error) {
      return handleError(error, reply, 'GET_PROJECT_FAILED');
    }
  }

  /**
   * 更新项目设置
   * PATCH /api/projects/:id
   * Requirements: 2.4
   */
  async updateProject(
    request: FastifyRequest<{ Params: ProjectIdParams; Body: UpdateProjectBody }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      const { id } = request.params;
      const { name, outputLanguage } = request.body || {};

      const project = await this.projectService.updateProject(id, {
        name,
        outputLanguage,
      });

      return reply.send({ project });
    } catch (error) {
      return handleError(error, reply, 'UPDATE_PROJECT_FAILED');
    }
  }

  /**
   * 获取版本列表
   * GET /api/projects/:id/versions
   * Requirements: 5.1, 5.5
   */
  async getVersions(
    request: FastifyRequest<{ Params: ProjectIdParams }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      const { id } = request.params;

      // 先验证项目存在
      await this.projectService.getProject(id);

      const versionsWithUrls = await this.versionService.getVersionsWithImageUrls(id);

      return reply.send({
        versions: versionsWithUrls.map(({ version, imageUrl }) => ({
          ...version,
          imageUrl,
        })),
      });
    } catch (error) {
      return handleError(error, reply, 'GET_VERSIONS_FAILED');
    }
  }

  /**
   * 创建新版本
   * POST /api/projects/:id/versions
   * Requirements: 3.3, 5.2
   */
  async createVersion(
    request: FastifyRequest<{ Params: ProjectIdParams; Body: CreateVersionBody }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      const { id } = request.params;
      const { versionType, jsonContent, sourceVersionId } = request.body || {};

      // 参数验证
      if (!versionType) {
        return reply.status(400).send({
          error: '缺少 versionType 参数',
          code: 'MISSING_VERSION_TYPE',
        });
      }

      let version;

      if (versionType === 'json_edit') {
        if (!jsonContent) {
          return reply.status(400).send({
            error: '创建 json_edit 版本需要提供 jsonContent',
            code: 'MISSING_JSON_CONTENT',
          });
        }
        version = await this.versionService.createJsonEditVersion({
          projectId: id,
          jsonString: jsonContent,
        });
      } else if (versionType === 'checkout') {
        if (!sourceVersionId) {
          return reply.status(400).send({
            error: '创建 checkout 版本需要提供 sourceVersionId',
            code: 'MISSING_SOURCE_VERSION_ID',
          });
        }
        version = await this.versionService.createCheckoutVersion({
          projectId: id,
          sourceVersionId,
        });
      } else {
        return reply.status(400).send({
          error: 'versionType 必须是 json_edit 或 checkout',
          code: 'INVALID_VERSION_TYPE',
        });
      }

      // 获取版本的图片 URL
      const { imageUrl } = await this.versionService.getVersionWithImageUrl(version.id);

      return reply.status(201).send({
        version: {
          ...version,
          imageUrl,
        },
      });
    } catch (error) {
      return handleError(error, reply, 'CREATE_VERSION_FAILED');
    }
  }

  /**
   * 创建生成任务
   * POST /api/projects/:id/generate
   * Requirements: 4.1, 4.2, 4.3
   */
  async generate(
    request: FastifyRequest<{ Params: ProjectIdParams; Body: GenerateBody }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      const { id } = request.params;
      const { count, seed, strength } = request.body || {};

      // 获取项目当前版本
      const project = await this.projectService.getProject(id);

      if (!project.currentVersionId) {
        return reply.status(400).send({
          error: '项目没有当前版本',
          code: 'NO_CURRENT_VERSION',
        });
      }

      // 创建生成任务
      const job = await this.generationService.createJob({
        projectId: id,
        sourceVersionId: project.currentVersionId,
        count,
        seed,
        strength,
      });

      // 异步执行任务（不等待完成）
      this.generationService.executeJob(job.id).catch((err) => {
        console.error(`生成任务 ${job.id} 执行失败:`, err.message);
      });

      return reply.status(201).send({ job });
    } catch (error) {
      return handleError(error, reply, 'CREATE_JOB_FAILED');
    }
  }

  /**
   * 选定候选图
   * POST /api/projects/:id/select
   * Requirements: 4.7, 4.8
   */
  async selectCandidate(
    request: FastifyRequest<{ Params: ProjectIdParams; Body: SelectCandidateBody }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      const { id } = request.params;
      const { jobId, candidateId } = request.body || {};

      // 参数验证
      if (!jobId || !candidateId) {
        return reply.status(400).send({
          error: '缺少 jobId 或 candidateId 参数',
          code: 'MISSING_PARAMETERS',
        });
      }

      // 验证项目存在
      await this.projectService.getProject(id);

      // 选择候选图并创建新版本
      const version = await this.generationService.selectCandidate(jobId, candidateId);

      // 获取版本的图片 URL
      const { imageUrl } = await this.versionService.getVersionWithImageUrl(version.id);

      return reply.status(201).send({
        version: {
          ...version,
          imageUrl,
        },
      });
    } catch (error) {
      return handleError(error, reply, 'SELECT_CANDIDATE_FAILED');
    }
  }

  /**
   * 获取项目列表
   * GET /api/projects
   */
  async listProjects(
    request: FastifyRequest<{ Querystring: ListProjectsQuery }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      const limit = parseInt(request.query.limit || '20', 10);
      const offset = parseInt(request.query.offset || '0', 10);

      // 参数验证
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return reply.status(400).send({
          error: 'limit 必须是 1-100 之间的整数',
          code: 'INVALID_LIMIT',
        });
      }

      if (isNaN(offset) || offset < 0) {
        return reply.status(400).send({
          error: 'offset 必须是非负整数',
          code: 'INVALID_OFFSET',
        });
      }

      const projects = await this.projectService.listProjects(limit, offset);
      return reply.send({ projects });
    } catch (error) {
      return handleError(error, reply, 'LIST_PROJECTS_FAILED');
    }
  }
}
