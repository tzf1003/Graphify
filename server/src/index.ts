import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 导入服务和路由
import { registerRoutes } from './routes';
import { ProjectService } from './services/projectService';
import { VersionService } from './services/versionService';
import { GenerationService } from './services/generationService';
import { LocalStorageProvider } from './storage/local';
import { createGeminiExtractor } from './providers/gemini';
import { createNanoBananaEditor } from './providers/nanoBanana';
import { createTextToImageGenerator } from './providers/textToImage';
import { runMigrations } from './db/migrations';
import { AppError, toErrorResponse, getErrorStatusCode } from './utils/errors';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

async function bootstrap(): Promise<void> {
  // 运行数据库迁移
  try {
    await runMigrations();
    console.info('数据库迁移完成');
  } catch (err) {
    console.error('数据库迁移失败:', err);
    process.exit(1);
  }

  // Register CORS - 允许前端跨域访问
  // Requirements: 7.5 (静态文件通过 /uploads/ 路径访问)
  await fastify.register(cors, {
    origin: true, // 允许所有来源，生产环境应配置具体域名
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Register multipart for file uploads (10MB limit)
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  // Register static file serving for uploads
  // Requirements: 7.5 (静态文件通过 /uploads/ 路径访问)
  const uploadsPath = process.env.STORAGE_PATH || path.join(__dirname, '../../data/uploads');
  await fastify.register(fastifyStatic, {
    root: path.resolve(uploadsPath),
    prefix: '/uploads/',
    decorateReply: false,
    // 设置缓存控制头
    cacheControl: true,
    maxAge: '1d',
    // 允许列出目录（开发环境可用）
    list: process.env.NODE_ENV === 'development',
  });

  // 初始化存储服务
  const storage = new LocalStorageProvider({
    uploadDir: uploadsPath,
    urlPrefix: '/uploads',
  });

  // 初始化 AI Provider
  // Extractor: 根据 EXTRACTOR_PROVIDER 环境变量选择实现 (mock | gemini | openai)
  // NanoBananaEditor: 根据 IMAGE_PROVIDER 环境变量选择实现 (mock | nanobanana | openai)
  // TextToImageGenerator: 根据 TEXT_TO_IMAGE_PROVIDER 环境变量选择实现 (mock | openai)
  const geminiExtractor = createGeminiExtractor();
  const nanoBananaEditor = createNanoBananaEditor();
  const textToImageGenerator = createTextToImageGenerator();

  // 初始化服务
  const projectService = new ProjectService(storage, geminiExtractor, textToImageGenerator);
  const versionService = new VersionService(storage);
  const generationService = new GenerationService(storage, nanoBananaEditor);

  // 注册 API 路由
  await registerRoutes(fastify, {
    projectService,
    versionService,
    generationService,
  });

  // Health check endpoint
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Global error handler
  // Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
  // 统一错误响应格式: { error: string, code?: string, details?: any }
  fastify.setErrorHandler((error, request, reply) => {
    // 记录错误日志
    request.log.error({
      err: error,
      url: request.url,
      method: request.method,
    }, '请求处理错误');

    // 处理自定义 AppError 及其子类
    if (error instanceof AppError) {
      const response = toErrorResponse(error, process.env.NODE_ENV === 'development');
      return reply.status(error.statusCode).send(response);
    }

    // 处理 Fastify 内置错误（如文件上传大小限制）
    if (error.statusCode === 413) {
      return reply.status(413).send({
        error: '文件大小超过 10MB 限制',
        code: 'FILE_TOO_LARGE',
      });
    }

    // 处理 JSON 解析错误
    if (error.statusCode === 400 && error.message.includes('JSON')) {
      return reply.status(400).send({
        error: error.message,
        code: 'INVALID_JSON',
      });
    }

    // 处理其他已知状态码的错误
    const statusCode = getErrorStatusCode(error);
    const response = toErrorResponse(error, process.env.NODE_ENV === 'development');

    return reply.status(statusCode).send(response);
  });

  // 404 Not Found handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: `路由 ${request.method} ${request.url} 不存在`,
      code: 'ROUTE_NOT_FOUND',
    });
  });

  // Start server
  const port = parseInt(process.env.SERVER_PORT || '3000', 10);
  const host = process.env.SERVER_HOST || '0.0.0.0';

  try {
    await fastify.listen({ port, host });
    console.info(`Server running at http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

bootstrap();
