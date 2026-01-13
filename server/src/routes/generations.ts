/**
 * 生成任务路由
 * 处理生成任务的状态查询
 */

import { FastifyInstance } from 'fastify';
import { GenerationService } from '../services/generationService';

// ==================== 请求类型定义 ====================

interface GenerationIdParams {
  id: string;
}

// ==================== 路由注册函数 ====================

export async function generationRoutes(
  fastify: FastifyInstance,
  options: {
    generationService: GenerationService;
  }
): Promise<void> {
  const { generationService } = options;

  /**
   * GET /api/generations/:id
   * 查询任务状态
   * Requirements: 6.1, 6.2, 6.3
   * 
   * 响应包含：
   * - status: queued | running | succeeded | failed
   * - 当 status 为 succeeded 时，包含所有候选图的 URL 和元数据
   * - 当 status 为 failed 时，包含错误信息
   */
  fastify.get<{ Params: GenerationIdParams }>(
    '/:id',
    async (request, reply) => {
      const { id } = request.params;

      try {
        const { job, candidates } = await generationService.getJob(id);

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

        // 当任务成功时，包含候选图信息
        if (job.status === 'succeeded') {
          response.candidates = candidates.map(({ candidate, imageUrl }) => ({
            id: candidate.id,
            indexNum: candidate.indexNum,
            imageUrl,
            createdAt: candidate.createdAt,
          }));
        }

        return reply.send(response);
      } catch (error: unknown) {
        const err = error as { code?: string; statusCode?: number; message: string };
        return reply.status(err.statusCode || 500).send({
          error: err.message,
          code: err.code || 'GET_JOB_FAILED',
        });
      }
    }
  );
}
