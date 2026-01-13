/**
 * VersionService - 版本服务层
 * 负责版本的创建、查询和管理
 */

import { query, transaction } from '../db';
import { StorageProvider } from '../storage/interface';
import {
  Version,
  ImageAsset,
  CanonicalJSON,
  VersionType,
} from '../types';
import {
  parseAndValidateCanonicalJSON,
} from '../utils/validator';

// ==================== 错误类型 ====================

export class VersionServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'VersionServiceError';
  }
}

// ==================== 接口定义 ====================

export interface CreateVersionInput {
  projectId: string;
  versionType: VersionType;
  imageAssetId?: string | null;
  jsonContent?: CanonicalJSON | null;
  parentVersionId?: string | null;
}

export interface CreateJsonEditVersionInput {
  projectId: string;
  jsonString: string;
}

export interface CreateCheckoutVersionInput {
  projectId: string;
  sourceVersionId: string;
}

export interface CreateSelectedCandidateVersionInput {
  projectId: string;
  candidateImageId: string;
  jsonContent: CanonicalJSON;
}

// ==================== 数据库行类型 ====================

interface VersionRow {
  id: string;
  project_id: string;
  version_type: string;
  image_asset_id: string | null;
  json_content: CanonicalJSON | null;
  parent_version_id: string | null;
  created_at: Date;
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

interface CandidateImageRow {
  id: string;
  job_id: string;
  image_asset_id: string;
  index_num: number;
  created_at: Date;
}

interface ProjectRow {
  id: string;
  current_version_id: string | null;
}

// ==================== 行转换函数 ====================

function rowToVersion(row: VersionRow): Version {
  return {
    id: row.id,
    projectId: row.project_id,
    versionType: row.version_type as VersionType,
    imageAssetId: row.image_asset_id,
    jsonContent: row.json_content,
    parentVersionId: row.parent_version_id,
    createdAt: row.created_at,
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

// ==================== VersionService 类 ====================

export class VersionService {
  constructor(private storage: StorageProvider) {}

  /**
   * 创建新版本
   * @param input 版本创建参数
   * @returns 创建的版本
   */
  async createVersion(input: CreateVersionInput): Promise<Version> {
    const {
      projectId,
      versionType,
      imageAssetId = null,
      jsonContent = null,
      parentVersionId = null,
    } = input;

    const result = await query<VersionRow>(
      `INSERT INTO versions (project_id, version_type, image_asset_id, json_content, parent_version_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        projectId,
        versionType,
        imageAssetId,
        jsonContent ? JSON.stringify(jsonContent) : null,
        parentVersionId,
      ]
    );

    if (result.rows.length === 0) {
      throw new VersionServiceError('创建版本失败', 'CREATE_FAILED', 500);
    }

    return rowToVersion(result.rows[0]);
  }

  /**
   * 获取版本详情
   * @param versionId 版本 ID
   * @returns 版本详情
   */
  async getVersion(versionId: string): Promise<Version> {
    const result = await query<VersionRow>(
      `SELECT * FROM versions WHERE id = $1`,
      [versionId]
    );

    if (result.rows.length === 0) {
      throw new VersionServiceError('版本不存在', 'VERSION_NOT_FOUND', 404);
    }

    return rowToVersion(result.rows[0]);
  }

  /**
   * 获取项目的所有版本列表
   * 按创建时间倒序排列（Requirements 5.5）
   * @param projectId 项目 ID
   * @returns 版本列表
   */
  async getVersions(projectId: string): Promise<Version[]> {
    const result = await query<VersionRow>(
      `SELECT * FROM versions 
       WHERE project_id = $1 
       ORDER BY created_at DESC`,
      [projectId]
    );

    return result.rows.map(rowToVersion);
  }

  /**
   * 创建 JSON 编辑版本
   * 继承当前版本的 image_asset_id，使用新的 JSON 内容（Requirements 3.3, 3.4）
   * @param input 创建参数
   * @returns 创建的版本
   */
  async createJsonEditVersion(input: CreateJsonEditVersionInput): Promise<Version> {
    const { projectId, jsonString } = input;

    // 1. 验证并解析 JSON
    const validation = parseAndValidateCanonicalJSON(jsonString);
    if (!validation.valid) {
      throw new VersionServiceError(
        `JSON 格式错误: ${validation.errors.join('; ')}`,
        'INVALID_JSON',
        400
      );
    }

    const jsonContent = validation.data!;

    // 2. 获取当前版本
    const currentVersion = await this.getCurrentVersion(projectId);
    if (!currentVersion) {
      throw new VersionServiceError('项目没有当前版本', 'NO_CURRENT_VERSION', 400);
    }

    // 3. 使用事务创建新版本并更新项目
    return transaction(async (client) => {
      // 创建新版本，继承 image_asset_id
      const versionResult = await client.query<VersionRow>(
        `INSERT INTO versions (project_id, version_type, image_asset_id, json_content, parent_version_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          projectId,
          'json_edit',
          currentVersion.imageAssetId,
          JSON.stringify(jsonContent),
          currentVersion.id,
        ]
      );

      const newVersion = rowToVersion(versionResult.rows[0]);

      // 更新项目的 current_version_id
      await client.query(
        `UPDATE projects SET current_version_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [newVersion.id, projectId]
      );

      return newVersion;
    });
  }

  /**
   * 创建 Checkout 版本
   * 复制源版本的 image_asset_id 和 json_content（Requirements 5.2, 5.3）
   * @param input 创建参数
   * @returns 创建的版本
   */
  async createCheckoutVersion(input: CreateCheckoutVersionInput): Promise<Version> {
    const { projectId, sourceVersionId } = input;

    // 1. 获取源版本
    const sourceVersion = await this.getVersion(sourceVersionId);

    // 验证源版本属于该项目
    if (sourceVersion.projectId !== projectId) {
      throw new VersionServiceError('源版本不属于该项目', 'INVALID_SOURCE_VERSION', 400);
    }

    // 2. 使用事务创建新版本并更新项目
    return transaction(async (client) => {
      // 创建新版本，复制源版本的数据
      const versionResult = await client.query<VersionRow>(
        `INSERT INTO versions (project_id, version_type, image_asset_id, json_content, parent_version_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          projectId,
          'checkout',
          sourceVersion.imageAssetId,
          sourceVersion.jsonContent ? JSON.stringify(sourceVersion.jsonContent) : null,
          sourceVersion.id,
        ]
      );

      const newVersion = rowToVersion(versionResult.rows[0]);

      // 更新项目的 current_version_id
      await client.query(
        `UPDATE projects SET current_version_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [newVersion.id, projectId]
      );

      return newVersion;
    });
  }

  /**
   * 创建选中候选图版本
   * 引用选中的候选图作为 image_asset_id，保存当时的 JSON 快照（Requirements 4.7, 4.8）
   * @param input 创建参数
   * @returns 创建的版本
   */
  async createSelectedCandidateVersion(
    input: CreateSelectedCandidateVersionInput
  ): Promise<Version> {
    const { projectId, candidateImageId, jsonContent } = input;

    // 1. 获取候选图信息
    const candidateResult = await query<CandidateImageRow>(
      `SELECT * FROM candidate_images WHERE id = $1`,
      [candidateImageId]
    );

    if (candidateResult.rows.length === 0) {
      throw new VersionServiceError('候选图不存在', 'CANDIDATE_NOT_FOUND', 404);
    }

    const candidate = candidateResult.rows[0];

    // 2. 获取当前版本作为父版本
    const currentVersion = await this.getCurrentVersion(projectId);

    // 3. 使用事务创建新版本并更新项目
    return transaction(async (client) => {
      // 创建新版本
      const versionResult = await client.query<VersionRow>(
        `INSERT INTO versions (project_id, version_type, image_asset_id, json_content, parent_version_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          projectId,
          'selected_candidate',
          candidate.image_asset_id,
          JSON.stringify(jsonContent),
          currentVersion?.id || null,
        ]
      );

      const newVersion = rowToVersion(versionResult.rows[0]);

      // 更新项目的 current_version_id
      await client.query(
        `UPDATE projects SET current_version_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [newVersion.id, projectId]
      );

      return newVersion;
    });
  }

  /**
   * 获取项目的当前版本
   * @param projectId 项目 ID
   * @returns 当前版本或 null
   */
  async getCurrentVersion(projectId: string): Promise<Version | null> {
    // 先获取项目的 current_version_id
    const projectResult = await query<ProjectRow>(
      `SELECT id, current_version_id FROM projects WHERE id = $1`,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      throw new VersionServiceError('项目不存在', 'PROJECT_NOT_FOUND', 404);
    }

    const currentVersionId = projectResult.rows[0].current_version_id;
    if (!currentVersionId) {
      return null;
    }

    return this.getVersion(currentVersionId);
  }

  /**
   * 获取版本关联的图片资源
   * @param versionId 版本 ID
   * @returns 图片资源或 null
   */
  async getVersionImageAsset(versionId: string): Promise<ImageAsset | null> {
    const version = await this.getVersion(versionId);
    
    if (!version.imageAssetId) {
      return null;
    }

    const result = await query<ImageAssetRow>(
      `SELECT * FROM image_assets WHERE id = $1`,
      [version.imageAssetId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return rowToImageAsset(result.rows[0]);
  }

  /**
   * 获取版本的完整信息（包含图片 URL）
   * @param versionId 版本 ID
   * @returns 版本详情和图片 URL
   */
  async getVersionWithImageUrl(versionId: string): Promise<{
    version: Version;
    imageUrl: string | null;
  }> {
    const version = await this.getVersion(versionId);
    const imageAsset = await this.getVersionImageAsset(versionId);

    return {
      version,
      imageUrl: imageAsset ? this.storage.getUrl(imageAsset.filePath) : null,
    };
  }

  /**
   * 获取项目所有版本的完整信息（包含图片 URL）
   * @param projectId 项目 ID
   * @returns 版本列表和图片 URL
   */
  async getVersionsWithImageUrls(projectId: string): Promise<Array<{
    version: Version;
    imageUrl: string | null;
  }>> {
    const versions = await this.getVersions(projectId);

    // 批量获取所有图片资源
    const imageAssetIds = versions
      .map(v => v.imageAssetId)
      .filter((id): id is string => id !== null);

    if (imageAssetIds.length === 0) {
      return versions.map(version => ({ version, imageUrl: null }));
    }

    // 使用 IN 查询批量获取图片资源
    const placeholders = imageAssetIds.map((_, i) => `$${i + 1}`).join(', ');
    const imageAssetsResult = await query<ImageAssetRow>(
      `SELECT * FROM image_assets WHERE id IN (${placeholders})`,
      imageAssetIds
    );

    // 构建 ID -> ImageAsset 映射
    const imageAssetMap = new Map<string, ImageAsset>();
    for (const row of imageAssetsResult.rows) {
      imageAssetMap.set(row.id, rowToImageAsset(row));
    }

    // 组装结果
    return versions.map(version => {
      const imageAsset = version.imageAssetId
        ? imageAssetMap.get(version.imageAssetId)
        : null;
      return {
        version,
        imageUrl: imageAsset ? this.storage.getUrl(imageAsset.filePath) : null,
      };
    });
  }
}
