/**
 * 项目相关路由
 * 处理项目的创建、查询、更新、版本管理和生成任务
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ProjectService } from '../services/projectService';
import { VersionService } from '../services/versionService';
import { GenerationService } from '../services/generationService';

// ==================== 请求类型定义 ====================

interface ProjectIdParams {
  id: string;
}

interface UpdateProjectBody {
  name?: string;
  outputLanguage?: string;
}

interface CreateVersionBody {
  versionType: 'json_edit' | 'checkout';
  jsonContent?: string;
  sourceVersionId?: string;
}

interface GenerateBody {
  count?: number;
  seed?: number;
  strength?: number;
}

interface GenerateFromTextBody {
  prompt: string;
  name?: string;
  outputLanguage?: string;
}

interface SelectCandidateBody {
  jobId: string;
  candidateId: string;
}

// ==================== 路由注册函数 ====================

export async function projectRoutes(
  fastify: FastifyInstance,
  options: {
    projectService: ProjectService;
    versionService: VersionService;
    generationService: GenerationService;
  }
): Promise<void> {
  const { projectService, versionService, generationService } = options;

  /**
   * POST /api/projects/upload
   * 上传图片创建项目
   * Requirements: 1.1, 1.2, 1.3
   */
  fastify.post('/upload', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await request.file();

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
    const fields = data.fields as Record<string, { value?: string }>;
    const projectName = fields.name?.value;
    const outputLanguage = fields.outputLanguage?.value || fields.output_language?.value;

    try {
      const result = await projectService.uploadAndInitialize({
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
    } catch (error: unknown) {
      const err = error as { code?: string; statusCode?: number; message: string };
      return reply.status(err.statusCode || 500).send({
        error: err.message,
        code: err.code || 'UPLOAD_FAILED',
      });
    }
  });

  /**
   * POST /api/projects/generate-from-text
   * 从文字描述生成图片并创建项目
   */
  fastify.post<{ Body: GenerateFromTextBody }>(
    '/generate-from-text',
    async (request, reply) => {
      const { prompt, name, outputLanguage } = request.body || {};

      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return reply.status(400).send({
          error: '请提供有效的文字描述',
          code: 'MISSING_PROMPT',
        });
      }

      if (prompt.length > 2000) {
        return reply.status(400).send({
          error: '文字描述过长，请限制在2000字符以内',
          code: 'PROMPT_TOO_LONG',
        });
      }

      try {
        const result = await projectService.generateFromText({
          prompt: prompt.trim(),
          projectName: name,
          outputLanguage: outputLanguage || 'zh-CN',
        });

        return reply.status(201).send({
          project: result.project,
          version: result.version,
          imageAsset: result.imageAsset,
        });
      } catch (error: unknown) {
        const err = error as { code?: string; statusCode?: number; message: string };
        return reply.status(err.statusCode || 500).send({
          error: err.message,
          code: err.code || 'GENERATE_FROM_TEXT_FAILED',
        });
      }
    }
  );

  /**
   * GET /api/projects/:id
   * 获取项目详情
   * Requirements: 2.4
   */
  fastify.get<{ Params: ProjectIdParams }>(
    '/:id',
    async (request, reply) => {
      const { id } = request.params;

      try {
        const project = await projectService.getProject(id);
        return reply.send({ project });
      } catch (error: unknown) {
        const err = error as { code?: string; statusCode?: number; message: string };
        return reply.status(err.statusCode || 500).send({
          error: err.message,
          code: err.code || 'GET_PROJECT_FAILED',
        });
      }
    }
  );

  /**
   * PATCH /api/projects/:id
   * 更新项目设置
   * Requirements: 2.4
   */
  fastify.patch<{ Params: ProjectIdParams; Body: UpdateProjectBody }>(
    '/:id',
    async (request, reply) => {
      const { id } = request.params;
      const { name, outputLanguage } = request.body || {};

      try {
        const project = await projectService.updateProject(id, {
          name,
          outputLanguage,
        });
        return reply.send({ project });
      } catch (error: unknown) {
        const err = error as { code?: string; statusCode?: number; message: string };
        return reply.status(err.statusCode || 500).send({
          error: err.message,
          code: err.code || 'UPDATE_PROJECT_FAILED',
        });
      }
    }
  );

  /**
   * GET /api/projects/:id/versions
   * 获取版本列表
   * Requirements: 5.1, 5.5
   */
  fastify.get<{ Params: ProjectIdParams }>(
    '/:id/versions',
    async (request, reply) => {
      const { id } = request.params;

      try {
        // 先验证项目存在
        await projectService.getProject(id);
        
        const versionsWithUrls = await versionService.getVersionsWithImageUrls(id);
        return reply.send({
          versions: versionsWithUrls.map(({ version, imageUrl }) => ({
            ...version,
            imageUrl,
          })),
        });
      } catch (error: unknown) {
        const err = error as { code?: string; statusCode?: number; message: string };
        return reply.status(err.statusCode || 500).send({
          error: err.message,
          code: err.code || 'GET_VERSIONS_FAILED',
        });
      }
    }
  );

  /**
   * POST /api/projects/:id/versions
   * 创建新版本（json_edit 或 checkout）
   * Requirements: 3.3, 5.2
   */
  fastify.post<{ Params: ProjectIdParams; Body: CreateVersionBody }>(
    '/:id/versions',
    async (request, reply) => {
      const { id } = request.params;
      const { versionType, jsonContent, sourceVersionId } = request.body || {};

      if (!versionType) {
        return reply.status(400).send({
          error: '缺少 versionType 参数',
          code: 'MISSING_VERSION_TYPE',
        });
      }

      try {
        let version;

        if (versionType === 'json_edit') {
          if (!jsonContent) {
            return reply.status(400).send({
              error: '创建 json_edit 版本需要提供 jsonContent',
              code: 'MISSING_JSON_CONTENT',
            });
          }
          version = await versionService.createJsonEditVersion({
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
          version = await versionService.createCheckoutVersion({
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
        const { imageUrl } = await versionService.getVersionWithImageUrl(version.id);

        return reply.status(201).send({
          version: {
            ...version,
            imageUrl,
          },
        });
      } catch (error: unknown) {
        const err = error as { code?: string; statusCode?: number; message: string };
        return reply.status(err.statusCode || 500).send({
          error: err.message,
          code: err.code || 'CREATE_VERSION_FAILED',
        });
      }
    }
  );

  /**
   * POST /api/projects/:id/generate
   * 创建生成任务
   * Requirements: 4.1, 4.2
   */
  fastify.post<{ Params: ProjectIdParams; Body: GenerateBody }>(
    '/:id/generate',
    async (request, reply) => {
      const { id } = request.params;
      const { count, seed, strength } = request.body || {};

      try {
        // 获取项目当前版本
        const project = await projectService.getProject(id);
        
        if (!project.currentVersionId) {
          return reply.status(400).send({
            error: '项目没有当前版本',
            code: 'NO_CURRENT_VERSION',
          });
        }

        // 创建生成任务
        const job = await generationService.createJob({
          projectId: id,
          sourceVersionId: project.currentVersionId,
          count,
          seed,
          strength,
        });

        // 异步执行任务（不等待完成）
        generationService.executeJob(job.id).catch((err) => {
          console.error(`生成任务 ${job.id} 执行失败:`, err.message);
        });

        return reply.status(201).send({ job });
      } catch (error: unknown) {
        const err = error as { code?: string; statusCode?: number; message: string };
        return reply.status(err.statusCode || 500).send({
          error: err.message,
          code: err.code || 'CREATE_JOB_FAILED',
        });
      }
    }
  );

  /**
   * POST /api/projects/:id/select
   * 选定候选图创建新版本
   * Requirements: 4.7
   */
  fastify.post<{ Params: ProjectIdParams; Body: SelectCandidateBody }>(
    '/:id/select',
    async (request, reply) => {
      const { id } = request.params;
      const { jobId, candidateId } = request.body || {};

      if (!jobId || !candidateId) {
        return reply.status(400).send({
          error: '缺少 jobId 或 candidateId 参数',
          code: 'MISSING_PARAMETERS',
        });
      }

      try {
        // 验证项目存在
        await projectService.getProject(id);

        // 选择候选图并创建新版本
        const version = await generationService.selectCandidate(jobId, candidateId);

        // 获取版本的图片 URL
        const { imageUrl } = await versionService.getVersionWithImageUrl(version.id);

        return reply.status(201).send({
          version: {
            ...version,
            imageUrl,
          },
        });
      } catch (error: unknown) {
        const err = error as { code?: string; statusCode?: number; message: string };
        return reply.status(err.statusCode || 500).send({
          error: err.message,
          code: err.code || 'SELECT_CANDIDATE_FAILED',
        });
      }
    }
  );

  /**
   * GET /api/projects
   * 获取项目列表
   */
  fastify.get('/', async (request: FastifyRequest<{ Querystring: { limit?: string; offset?: string } }>, reply) => {
    const limit = parseInt(request.query.limit || '20', 10);
    const offset = parseInt(request.query.offset || '0', 10);

    try {
      const projects = await projectService.listProjectsWithThumbnails(limit, offset);
      return reply.send({ projects });
    } catch (error: unknown) {
      const err = error as { code?: string; statusCode?: number; message: string };
      return reply.status(err.statusCode || 500).send({
        error: err.message,
        code: err.code || 'LIST_PROJECTS_FAILED',
      });
    }
  });
}
