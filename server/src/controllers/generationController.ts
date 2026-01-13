/**
 * 生成任务控制器
 * 处理生成任务相关的请求验证和业务逻辑协调
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { GenerationService, GenerationServiceError } from '../services/generationService';
import { AppError, toErrorResponse, getErrorStatusCode } from '../utils/errors';

// ==================== 请求类型定义 ====================

export interface GenerationIdParams {
  id: string;
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
  if (error instanceof GenerationServiceError) {
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

export class GenerationController {
  constructor(private generationService: GenerationService) {}

  /**
   * 查询任务状态
   * GET /api/generations/:id
   * Requirements: 6.1, 6.2, 6.3
   * 
   * 响应格式：
   * - job: 任务详情（包含 status, count, seed, strength, errorMessage 等）
   * - candidates: 当 status 为 succeeded 时，包含所有候选图的 URL 和元数据
   */
  async getJob(
    request: FastifyRequest<{ Params: GenerationIdParams }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      const { id } = request.params;

      // 验证 ID 格式（UUID）
      if (!this.isValidUUID(id)) {
        return reply.status(400).send({
          error: '无效的任务 ID 格式',
          code: 'INVALID_JOB_ID',
        });
      }

      const { job, candidates } = await this.generationService.getJob(id);

      // 构建响应
      const response: {
        job: typeof job;
        candidates?: Array<{
          id: string;
          indexNum: number;
          imageUrl: string;
          createdAt: Date;
        }>;
      } = {
        job,
      };

      // 当任务成功时，包含候选图信息（Requirements 6.3）
      if (job.status === 'succeeded') {
        response.candidates = candidates.map(({ candidate, imageUrl }) => ({
          id: candidate.id,
          indexNum: candidate.indexNum,
          imageUrl,
          createdAt: candidate.createdAt,
        }));
      }

      return reply.send(response);
    } catch (error) {
      return handleError(error, reply, 'GET_JOB_FAILED');
    }
  }

  /**
   * 验证 UUID 格式
   */
  private isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
}
