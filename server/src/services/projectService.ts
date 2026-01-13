/**
 * ProjectService - 项目服务层
 * 负责项目的创建、查询、更新和图片上传初始化
 */

import { query, transaction } from '../db';
import { StorageProvider } from '../storage/interface';
import { GeminiExtractor } from '../providers/gemini/interface';
import { TextToImageGenerator } from '../providers/textToImage/interface';
import {
  Project,
  Version,
  ImageAsset,
  CanonicalJSON,
} from '../types';
import {
  validateUploadFile,
  getExtensionFromMimeType,
} from '../utils/validator';

// ==================== 错误类型 ====================

export class ProjectServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ProjectServiceError';
  }
}

// ==================== 接口定义 ====================

export interface CreateProjectInput {
  name: string;
  outputLanguage?: string;
}

export interface UpdateProjectInput {
  name?: string;
  outputLanguage?: string;
  currentVersionId?: string;
}

export interface UploadAndInitializeInput {
  fileBuffer: Buffer;
  mimeType: string;
  originalName: string;
  fileSize: number;
  projectName?: string;
  outputLanguage?: string;
}

export interface UploadAndInitializeResult {
  project: Project;
  version: Version;
  imageAsset: ImageAsset;
}

export interface GenerateFromTextInput {
  prompt: string;
  projectName?: string;
  outputLanguage?: string;
}

export interface GenerateFromTextResult {
  project: Project;
  version: Version;
  imageAsset: ImageAsset;
}

// ==================== 数据库行类型 ====================

interface ProjectRow {
  id: string;
  name: string;
  output_language: string;
  current_version_id: string | null;
  created_at: Date;
  updated_at: Date;
}

interface ImageAssetRow {
  id: string;
  file_path: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  created_at: Date;
}

interface VersionRow {
  id: string;
  project_id: string;
  version_type: string;
  image_asset_id: string | null;
  json_content: CanonicalJSON | null;
  parent_version_id: string | null;
  created_at: Date;
}

// ==================== 行转换函数 ====================

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    outputLanguage: row.output_language,
    currentVersionId: row.current_version_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToImageAsset(row: ImageAssetRow): ImageAsset {
  return {
    id: row.id,
    filePath: row.file_path,
    originalName: row.original_name,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    width: row.width ?? 0,
    height: row.height ?? 0,
    createdAt: row.created_at,
  };
}

function rowToVersion(row: VersionRow): Version {
  return {
    id: row.id,
    projectId: row.project_id,
    versionType: row.version_type as Version['versionType'],
    imageAssetId: row.image_asset_id,
    jsonContent: row.json_content,
    parentVersionId: row.parent_version_id,
    createdAt: row.created_at,
  };
}

// ==================== ProjectService 类 ====================

export class ProjectService {
  constructor(
    private storage: StorageProvider,
    private geminiExtractor: GeminiExtractor,
    private textToImageGenerator?: TextToImageGenerator
  ) {}

  /**
   * 创建新项目
   * @param input 项目创建参数
   * @returns 创建的项目
   */
  async createProject(input: CreateProjectInput): Promise<Project> {
    const { name, outputLanguage = 'zh-CN' } = input;

    const result = await query<ProjectRow>(
      `INSERT INTO projects (name, output_language)
       VALUES ($1, $2)
       RETURNING *`,
      [name, outputLanguage]
    );

    if (result.rows.length === 0) {
      throw new ProjectServiceError('创建项目失败', 'CREATE_FAILED', 500);
    }

    return rowToProject(result.rows[0]);
  }

  /**
   * 获取项目详情
   * @param projectId 项目 ID
   * @returns 项目详情
   */
  async getProject(projectId: string): Promise<Project> {
    const result = await query<ProjectRow>(
      `SELECT * FROM projects WHERE id = $1`,
      [projectId]
    );

    if (result.rows.length === 0) {
      throw new ProjectServiceError('项目不存在', 'PROJECT_NOT_FOUND', 404);
    }

    return rowToProject(result.rows[0]);
  }

  /**
   * 更新项目
   * @param projectId 项目 ID
   * @param input 更新参数
   * @returns 更新后的项目
   */
  async updateProject(projectId: string, input: UpdateProjectInput): Promise<Project> {
    // 构建动态更新语句
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(input.name);
    }

    if (input.outputLanguage !== undefined) {
      updates.push(`output_language = $${paramIndex++}`);
      values.push(input.outputLanguage);
    }

    if (input.currentVersionId !== undefined) {
      updates.push(`current_version_id = $${paramIndex++}`);
      values.push(input.currentVersionId);
    }

    if (updates.length === 0) {
      // 没有更新内容，直接返回当前项目
      return this.getProject(projectId);
    }

    // 添加 updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // 添加 projectId 作为最后一个参数
    values.push(projectId);

    const result = await query<ProjectRow>(
      `UPDATE projects 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new ProjectServiceError('项目不存在', 'PROJECT_NOT_FOUND', 404);
    }

    return rowToProject(result.rows[0]);
  }

  /**
   * 上传图片并初始化项目
   * 完整流程：验证文件 → 保存图片 → 创建 ImageAsset → 创建 Project → 提取 JSON → 创建 Version
   * @param input 上传参数
   * @returns 创建的项目、版本和图片资源
   */
  async uploadAndInitialize(input: UploadAndInitializeInput): Promise<UploadAndInitializeResult> {
    const {
      fileBuffer,
      mimeType,
      originalName,
      fileSize,
      projectName,
      outputLanguage = 'zh-CN',
    } = input;

    // 1. 验证文件
    const validation = validateUploadFile({ size: fileSize, mimeType, originalName });
    if (!validation.valid) {
      const errorMessage = validation.errors.join('; ');
      // 根据错误类型返回不同的错误码
      if (errorMessage.includes('大小')) {
        throw new ProjectServiceError(errorMessage, 'FILE_TOO_LARGE', 400);
      }
      throw new ProjectServiceError(errorMessage, 'INVALID_FILE_TYPE', 400);
    }

    // 2. 保存图片到存储
    const ext = getExtensionFromMimeType(mimeType);
    const storageResult = await this.storage.save(fileBuffer, ext, mimeType);

    // 3. 使用事务创建数据库记录
    return transaction(async (client) => {
      // 3.1 创建 ImageAsset
      const imageAssetResult = await client.query<ImageAssetRow>(
        `INSERT INTO image_assets (file_path, original_name, mime_type, file_size)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [storageResult.path, originalName, mimeType, fileSize]
      );
      const imageAsset = rowToImageAsset(imageAssetResult.rows[0]);

      // 3.2 创建 Project
      const name = projectName || this.generateProjectName(originalName);
      const projectResult = await client.query<ProjectRow>(
        `INSERT INTO projects (name, output_language)
         VALUES ($1, $2)
         RETURNING *`,
        [name, outputLanguage]
      );
      const project = rowToProject(projectResult.rows[0]);

      // 3.3 调用 GeminiExtractor 提取 JSON
      let jsonContent: CanonicalJSON | null = null;
      let extractError: Error | null = null;

      try {
        const extractResult = await this.geminiExtractor.extract(fileBuffer, outputLanguage);
        jsonContent = extractResult.json;
      } catch (error) {
        // 记录错误但不中断流程（Requirements 1.6）
        extractError = error instanceof Error ? error : new Error(String(error));
        console.error('GeminiExtractor 调用失败:', extractError.message);
      }

      // 3.4 创建初始 Version (type = 'imported')
      const versionResult = await client.query<VersionRow>(
        `INSERT INTO versions (project_id, version_type, image_asset_id, json_content)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [project.id, 'imported', imageAsset.id, jsonContent ? JSON.stringify(jsonContent) : null]
      );
      const version = rowToVersion(versionResult.rows[0]);

      // 3.5 更新 Project 的 current_version_id
      await client.query(
        `UPDATE projects SET current_version_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [version.id, project.id]
      );

      // 更新返回的 project 对象
      const updatedProject: Project = {
        ...project,
        currentVersionId: version.id,
      };

      // 如果提取失败，抛出错误但保留已创建的数据
      if (extractError) {
        throw new ProjectServiceError(
          `项目已创建，但 JSON 提取失败: ${extractError.message}`,
          'PROVIDER_ERROR',
          500
        );
      }

      return {
        project: updatedProject,
        version,
        imageAsset,
      };
    });
  }

  /**
   * 根据原始文件名生成项目名称
   */
  private generateProjectName(originalName: string): string {
    // 移除扩展名
    const lastDot = originalName.lastIndexOf('.');
    const baseName = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
    
    // 添加时间戳后缀
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${baseName}_${timestamp}`;
  }

  /**
   * 根据文字描述生成项目名称
   */
  private generateProjectNameFromPrompt(prompt: string): string {
    // 取前20个字符作为项目名
    const baseName = prompt.slice(0, 20).replace(/[^\w\u4e00-\u9fa5]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${baseName}_${timestamp}`;
  }

  /**
   * 从文字描述生成图片并创建项目
   * 流程：生成图片 → 保存图片 → 创建 ImageAsset → 创建 Project → 提取 JSON → 创建 Version
   * @param input 生成参数
   * @returns 创建的项目、版本和图片资源
   */
  async generateFromText(input: GenerateFromTextInput): Promise<GenerateFromTextResult> {
    const {
      prompt,
      projectName,
      outputLanguage = 'zh-CN',
    } = input;

    // 检查是否配置了文字生成图片服务
    if (!this.textToImageGenerator) {
      throw new ProjectServiceError(
        '文字生成图片服务未配置',
        'TEXT_TO_IMAGE_NOT_CONFIGURED',
        503
      );
    }

    // 1. 调用 AI 生成图片
    let imageResult;
    try {
      imageResult = await this.textToImageGenerator.generate(prompt, {
        width: 1024,
        height: 1024,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ProjectServiceError(
        `图片生成失败: ${message}`,
        'IMAGE_GENERATION_FAILED',
        500
      );
    }

    // 2. 保存图片到存储
    const ext = imageResult.mimeType === 'image/png' ? 'png' : 'jpg';
    const storageResult = await this.storage.save(imageResult.buffer, ext, imageResult.mimeType);

    // 3. 使用事务创建数据库记录
    return transaction(async (client) => {
      // 3.1 创建 ImageAsset
      const originalName = `generated_${Date.now()}.${ext}`;
      const imageAssetResult = await client.query<ImageAssetRow>(
        `INSERT INTO image_assets (file_path, original_name, mime_type, file_size, width, height)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          storageResult.path,
          originalName,
          imageResult.mimeType,
          imageResult.buffer.length,
          imageResult.width,
          imageResult.height,
        ]
      );
      const imageAsset = rowToImageAsset(imageAssetResult.rows[0]);

      // 3.2 创建 Project
      const name = projectName || this.generateProjectNameFromPrompt(prompt);
      const projectResult = await client.query<ProjectRow>(
        `INSERT INTO projects (name, output_language)
         VALUES ($1, $2)
         RETURNING *`,
        [name, outputLanguage]
      );
      const project = rowToProject(projectResult.rows[0]);

      // 3.3 调用 GeminiExtractor 提取 JSON
      let jsonContent: CanonicalJSON | null = null;
      let extractError: Error | null = null;

      try {
        const extractResult = await this.geminiExtractor.extract(imageResult.buffer, outputLanguage);
        jsonContent = extractResult.json;
      } catch (error) {
        // 记录错误但不中断流程
        extractError = error instanceof Error ? error : new Error(String(error));
        console.error('GeminiExtractor 调用失败:', extractError.message);
      }

      // 3.4 创建初始 Version (type = 'generated')
      const versionResult = await client.query<VersionRow>(
        `INSERT INTO versions (project_id, version_type, image_asset_id, json_content)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [project.id, 'generated', imageAsset.id, jsonContent ? JSON.stringify(jsonContent) : null]
      );
      const version = rowToVersion(versionResult.rows[0]);

      // 3.5 更新 Project 的 current_version_id
      await client.query(
        `UPDATE projects SET current_version_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [version.id, project.id]
      );

      // 更新返回的 project 对象
      const updatedProject: Project = {
        ...project,
        currentVersionId: version.id,
      };

      // 如果提取失败，抛出错误但保留已创建的数据
      if (extractError) {
        throw new ProjectServiceError(
          `项目已创建，但 JSON 提取失败: ${extractError.message}`,
          'PROVIDER_ERROR',
          500
        );
      }

      return {
        project: updatedProject,
        version,
        imageAsset,
      };
    });
  }

  /**
   * 获取项目列表
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns 项目列表
   */
  async listProjects(limit: number = 20, offset: number = 0): Promise<Project[]> {
    const result = await query<ProjectRow>(
      `SELECT * FROM projects 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows.map(rowToProject);
  }

  /**
   * 获取项目列表（带缩略图 URL）
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns 项目列表（带缩略图）
   */
  async listProjectsWithThumbnails(
    limit: number = 20,
    offset: number = 0
  ): Promise<Array<Project & { thumbnailUrl: string | null }>> {
    // 联表查询获取项目及其当前版本的图片
    const result = await query<ProjectRow & { file_path: string | null }>(
      `SELECT p.*, ia.file_path
       FROM projects p
       LEFT JOIN versions v ON p.current_version_id = v.id
       LEFT JOIN image_assets ia ON v.image_asset_id = ia.id
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows.map(row => ({
      ...rowToProject(row),
      thumbnailUrl: row.file_path ? this.storage.getUrl(row.file_path) : null,
    }));
  }

  /**
   * 删除项目
   * @param projectId 项目 ID
   */
  async deleteProject(projectId: string): Promise<void> {
    const result = await query(
      `DELETE FROM projects WHERE id = $1`,
      [projectId]
    );

    if (result.rowCount === 0) {
      throw new ProjectServiceError('项目不存在', 'PROJECT_NOT_FOUND', 404);
    }
  }
}
