/**
 * 错误类定义
 * 定义系统中使用的自定义错误类型
 */

// ==================== 基础错误类 ====================

/**
 * 应用程序基础错误类
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// ==================== HTTP 错误类 ====================

/**
 * 400 Bad Request 错误
 */
export class BadRequestError extends AppError {
  constructor(message: string, code: string = 'BAD_REQUEST') {
    super(message, code, 400);
    this.name = 'BadRequestError';
  }
}

/**
 * 404 Not Found 错误
 */
export class NotFoundError extends AppError {
  constructor(message: string, code: string = 'NOT_FOUND') {
    super(message, code, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * 500 Internal Server Error 错误
 */
export class InternalServerError extends AppError {
  constructor(message: string, code: string = 'INTERNAL_ERROR') {
    super(message, code, 500);
    this.name = 'InternalServerError';
  }
}

// ==================== 业务错误类 ====================

/**
 * 文件上传错误
 * Requirements: 11.1, 11.2
 */
export class FileUploadError extends BadRequestError {
  constructor(message: string, code: string = 'FILE_UPLOAD_ERROR') {
    super(message, code);
    this.name = 'FileUploadError';
  }
}

/**
 * 文件过大错误
 * Requirements: 11.1
 */
export class FileTooLargeError extends FileUploadError {
  constructor(message: string = '文件大小超过 10MB 限制') {
    super(message, 'FILE_TOO_LARGE');
    this.name = 'FileTooLargeError';
  }
}

/**
 * 文件类型不支持错误
 * Requirements: 11.2
 */
export class InvalidFileTypeError extends FileUploadError {
  constructor(message: string = '仅支持 png/jpg/webp 格式') {
    super(message, 'INVALID_FILE_TYPE');
    this.name = 'InvalidFileTypeError';
  }
}

/**
 * JSON 格式错误
 * Requirements: 11.3
 */
export class InvalidJsonError extends BadRequestError {
  constructor(message: string, details?: string) {
    super(details ? `${message}: ${details}` : message, 'INVALID_JSON');
    this.name = 'InvalidJsonError';
  }
}

/**
 * JSON 过大错误
 */
export class JsonTooLargeError extends BadRequestError {
  constructor(message: string = 'JSON 大小超过 1MB 限制') {
    super(message, 'JSON_TOO_LARGE');
    this.name = 'JsonTooLargeError';
  }
}

/**
 * 生成任务参数错误
 */
export class InvalidCountRangeError extends BadRequestError {
  constructor(message: string = 'count 必须在 1-8 范围内') {
    super(message, 'INVALID_COUNT_RANGE');
    this.name = 'InvalidCountRangeError';
  }
}

/**
 * 项目不存在错误
 */
export class ProjectNotFoundError extends NotFoundError {
  constructor(message: string = '项目不存在') {
    super(message, 'PROJECT_NOT_FOUND');
    this.name = 'ProjectNotFoundError';
  }
}

/**
 * 版本不存在错误
 */
export class VersionNotFoundError extends NotFoundError {
  constructor(message: string = '版本不存在') {
    super(message, 'VERSION_NOT_FOUND');
    this.name = 'VersionNotFoundError';
  }
}

/**
 * 任务不存在错误
 */
export class JobNotFoundError extends NotFoundError {
  constructor(message: string = '任务不存在') {
    super(message, 'JOB_NOT_FOUND');
    this.name = 'JobNotFoundError';
  }
}

/**
 * 候选图不存在错误
 */
export class CandidateNotFoundError extends NotFoundError {
  constructor(message: string = '候选图不存在') {
    super(message, 'CANDIDATE_NOT_FOUND');
    this.name = 'CandidateNotFoundError';
  }
}

/**
 * AI Provider 错误
 * Requirements: 11.4
 */
export class ProviderError extends InternalServerError {
  constructor(message: string, public providerName?: string) {
    super(message, 'PROVIDER_ERROR');
    this.name = 'ProviderError';
  }
}

/**
 * 存储服务错误
 */
export class StorageError extends InternalServerError {
  constructor(message: string) {
    super(message, 'STORAGE_ERROR');
    this.name = 'StorageError';
  }
}

/**
 * 数据库错误
 */
export class DatabaseError extends InternalServerError {
  constructor(message: string) {
    super(message, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

// ==================== 错误响应接口 ====================

/**
 * 统一错误响应格式
 * Requirements: 11.5
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * 将错误转换为统一响应格式
 */
export function toErrorResponse(error: unknown, includeDetails: boolean = false): ErrorResponse {
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: error.message,
      code: error.code,
    };
    if (includeDetails) {
      response.details = error.stack;
    }
    return response;
  }

  if (error instanceof Error) {
    const response: ErrorResponse = {
      error: error.message,
      code: 'UNKNOWN_ERROR',
    };
    if (includeDetails) {
      response.details = error.stack;
    }
    return response;
  }

  return {
    error: String(error),
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * 获取错误的 HTTP 状态码
 */
export function getErrorStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return 500;
}
