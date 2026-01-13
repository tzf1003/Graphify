/**
 * 路由统一导出和注册
 */

import { FastifyInstance } from 'fastify';
import { projectRoutes } from './projects';
import { generationRoutes } from './generations';
import { ProjectService } from '../services/projectService';
import { VersionService } from '../services/versionService';
import { GenerationService } from '../services/generationService';

export interface RouteOptions {
  projectService: ProjectService;
  versionService: VersionService;
  generationService: GenerationService;
}

/**
 * 注册所有 API 路由
 */
export async function registerRoutes(
  fastify: FastifyInstance,
  options: RouteOptions
): Promise<void> {
  const { projectService, versionService, generationService } = options;

  // 注册项目路由 - /api/projects
  await fastify.register(
    async (instance) => {
      await projectRoutes(instance, {
        projectService,
        versionService,
        generationService,
      });
    },
    { prefix: '/api/projects' }
  );

  // 注册生成任务路由 - /api/generations
  await fastify.register(
    async (instance) => {
      await generationRoutes(instance, {
        generationService,
      });
    },
    { prefix: '/api/generations' }
  );
}

export { projectRoutes } from './projects';
export { generationRoutes } from './generations';
