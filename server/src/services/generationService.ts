/**
 * GenerationService - 生成任务服务层
 * 负责生成任务的创建、执行、查询和候选图选择
 */

import { query, transaction } from '../db';
import { StorageProvider } from '../storage/interface';
import { NanoBananaEditor, GenerateOptions } from '../providers/nanoBanana/interface';
import {
  GenerationJob,
  CandidateImage,
  ImageAsset,
  Version,
  CanonicalJSON,
  JobStatus,
} from '../types';

// ==================== 错误类型 ====================

export class GenerationServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'GenerationServiceError';
  }
}

// ==================== 接口定义 ====================

export interface CreateJobInput {
  projectId: string;
  sourceVersionId: string;
  count?: number;
  seed?: number;
  strength?: number;
}

export interface JobWithCandidates {
  job: GenerationJob;
  candidates: CandidateWithUrl[];
}

export interface CandidateWithUrl {
  candidate: CandidateImage;
  imageUrl: string;
}

// ==================== 数据库行类型 ====================

interface GenerationJobRow {
  id: string;
  project_id: string;
  source_version_id: string;
  status: JobStatus;
  count: number;
  strength: number | null;
  seed: number | null;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

interface CandidateImageRow {
  id: string;
  job_id: string;
  image_asset_id: string;
  index_num: number;
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

function rowToGenerationJob(row: GenerationJobRow): GenerationJob {
  return {
    id: row.id,
    projectId: row.project_id,
    sourceVersionId: row.source_version_id,
    status: row.status,
    count: row.count,
    strength: row.strength,
    seed: row.seed,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToCandidateImage(row: CandidateImageRow): CandidateImage {
  return {
    id: row.id,
    jobId: row.job_id,
    imageAssetId: row.image_asset_id,
    indexNum: row.index_num,
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

// ==================== GenerationService 类 ====================

export class GenerationService {
  constructor(
    private storage: StorageProvider,
    private nanoBananaEditor: NanoBananaEditor
  ) {}

  /**
   * 创建生成任务（状态为 queued）
   * Requirements: 4.1, 4.2, 4.3
   * @param input 创建参数
   * @returns 创建的任务
   */
  async createJob(input: CreateJobInput): Promise<GenerationJob> {
    const {
      projectId,
      sourceVersionId,
      count = 4,
      seed,
      strength,
    } = input;

    // 验证 count 范围 (1-8)
    if (count < 1 || count > 8) {
      throw new GenerationServiceError(
        'count 必须在 1-8 范围内',
        'INVALID_COUNT_RANGE',
        400
      );
    }

    // 验证 strength 范围 (0-1)
    if (strength !== undefined && (strength < 0 || strength > 1)) {
      throw new GenerationServiceError(
        'strength 必须在 0-1 范围内',
        'INVALID_STRENGTH_RANGE',
        400
      );
    }

    // 验证源版本存在
    const versionResult = await query<VersionRow>(
      `SELECT * FROM versions WHERE id = $1`,
      [sourceVersionId]
    );

    if (versionResult.rows.length === 0) {
      throw new GenerationServiceError('源版本不存在', 'VERSION_NOT_FOUND', 404);
    }

    const sourceVersion = rowToVersion(versionResult.rows[0]);

    // 验证源版本属于该项目
    if (sourceVersion.projectId !== projectId) {
      throw new GenerationServiceError(
        '源版本不属于该项目',
        'INVALID_SOURCE_VERSION',
        400
      );
    }

    // 创建任务（状态为 queued）
    const result = await query<GenerationJobRow>(
      `INSERT INTO generation_jobs (project_id, source_version_id, status, count, seed, strength)
       VALUES ($1, $2, 'queued', $3, $4, $5)
       RETURNING *`,
      [projectId, sourceVersionId, count, seed ?? null, strength ?? null]
    );

    if (result.rows.length === 0) {
      throw new GenerationServiceError('创建任务失败', 'CREATE_FAILED', 500);
    }

    return rowToGenerationJob(result.rows[0]);
  }

  /**
   * 执行生成任务（调用 NanoBananaEditor）
   * Requirements: 4.4, 4.5, 4.6
   * 状态转换：queued → running → succeeded/failed
   * @param jobId 任务 ID
   * @returns 执行后的任务（包含候选图）
   */
  async executeJob(jobId: string): Promise<JobWithCandidates> {
    // 1. 获取任务
    const job = await this.getJobInternal(jobId);

    // 验证任务状态（只有 queued 状态可以执行）
    if (job.status !== 'queued') {
      throw new GenerationServiceError(
        `任务状态为 ${job.status}，无法执行`,
        'INVALID_JOB_STATUS',
        400
      );
    }

    // 2. 更新状态为 running
    await this.updateJobStatus(jobId, 'running');

    try {
      // 3. 获取源版本信息
      const versionResult = await query<VersionRow>(
        `SELECT * FROM versions WHERE id = $1`,
        [job.sourceVersionId]
      );

      if (versionResult.rows.length === 0) {
        throw new GenerationServiceError('源版本不存在', 'VERSION_NOT_FOUND', 404);
      }

      const sourceVersion = rowToVersion(versionResult.rows[0]);

      // 验证源版本有图片和 JSON
      if (!sourceVersion.imageAssetId) {
        throw new GenerationServiceError('源版本没有关联图片', 'NO_IMAGE_ASSET', 400);
      }

      if (!sourceVersion.jsonContent) {
        throw new GenerationServiceError('源版本没有 JSON 内容', 'NO_JSON_CONTENT', 400);
      }

      // 4. 获取源图片
      const imageAssetResult = await query<ImageAssetRow>(
        `SELECT * FROM image_assets WHERE id = $1`,
        [sourceVersion.imageAssetId]
      );

      if (imageAssetResult.rows.length === 0) {
        throw new GenerationServiceError('图片资源不存在', 'IMAGE_ASSET_NOT_FOUND', 404);
      }

      const imageAsset = rowToImageAsset(imageAssetResult.rows[0]);
      const baseImage = await this.storage.read(imageAsset.filePath);

      // 5. 调用 NanoBananaEditor 生成候选图
      const generateOptions: GenerateOptions = {
        count: job.count,
        seed: job.seed ?? undefined,
        strength: job.strength ?? undefined,
      };

      const generatedImages = await this.nanoBananaEditor.generate(
        baseImage,
        sourceVersion.jsonContent,
        generateOptions
      );

      // 6. 保存候选图并创建记录
      const candidates = await this.saveCandidateImages(jobId, generatedImages);

      // 7. 更新任务状态为 succeeded
      await this.updateJobStatus(jobId, 'succeeded');

      // 8. 返回完整结果
      const updatedJob = await this.getJobInternal(jobId);
      return {
        job: updatedJob,
        candidates,
      };
    } catch (error) {
      // 更新任务状态为 failed
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.updateJobStatusWithError(jobId, 'failed', errorMessage);

      throw new GenerationServiceError(
        `生成任务执行失败: ${errorMessage}`,
        'PROVIDER_ERROR',
        500
      );
    }
  }

  /**
   * 查询任务状态
   * Requirements: 6.1, 6.2, 6.3
   * @param jobId 任务 ID
   * @returns 任务详情（包含候选图）
   */
  async getJob(jobId: string): Promise<JobWithCandidates> {
    const job = await this.getJobInternal(jobId);
    const candidates = await this.getCandidatesWithUrls(jobId);

    return {
      job,
      candidates,
    };
  }

  /**
   * 选择候选图（创建 selected_candidate 版本）
   * Requirements: 4.7, 4.8
   * @param jobId 任务 ID
   * @param candidateId 候选图 ID
   * @returns 创建的新版本
   */
  async selectCandidate(jobId: string, candidateId: string): Promise<Version> {
    // 1. 获取任务
    const job = await this.getJobInternal(jobId);

    // 验证任务状态（只有 succeeded 状态可以选择候选图）
    if (job.status !== 'succeeded') {
      throw new GenerationServiceError(
        '任务未完成，无法选择候选图',
        'JOB_NOT_COMPLETED',
        400
      );
    }

    // 2. 获取候选图
    const candidateResult = await query<CandidateImageRow>(
      `SELECT * FROM candidate_images WHERE id = $1`,
      [candidateId]
    );

    if (candidateResult.rows.length === 0) {
      throw new GenerationServiceError('候选图不存在', 'CANDIDATE_NOT_FOUND', 404);
    }

    const candidate = rowToCandidateImage(candidateResult.rows[0]);

    // 验证候选图属于该任务
    if (candidate.jobId !== jobId) {
      throw new GenerationServiceError(
        '候选图不属于该任务',
        'INVALID_CANDIDATE',
        400
      );
    }

    // 3. 获取源版本的 JSON 内容
    const sourceVersionResult = await query<VersionRow>(
      `SELECT * FROM versions WHERE id = $1`,
      [job.sourceVersionId]
    );

    if (sourceVersionResult.rows.length === 0) {
      throw new GenerationServiceError('源版本不存在', 'VERSION_NOT_FOUND', 404);
    }

    const sourceVersion = rowToVersion(sourceVersionResult.rows[0]);

    // 4. 使用事务创建新版本并更新项目
    return transaction(async (client) => {
      // 创建新版本（type = 'selected_candidate'）
      const versionResult = await client.query<VersionRow>(
        `INSERT INTO versions (project_id, version_type, image_asset_id, json_content, parent_version_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          job.projectId,
          'selected_candidate',
          candidate.imageAssetId,
          sourceVersion.jsonContent ? JSON.stringify(sourceVersion.jsonContent) : null,
          job.sourceVersionId,
        ]
      );

      const newVersion = rowToVersion(versionResult.rows[0]);

      // 更新项目的 current_version_id
      await client.query(
        `UPDATE projects SET current_version_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [newVersion.id, job.projectId]
      );

      return newVersion;
    });
  }

  // ==================== 私有方法 ====================

  /**
   * 内部获取任务方法
   */
  private async getJobInternal(jobId: string): Promise<GenerationJob> {
    const result = await query<GenerationJobRow>(
      `SELECT * FROM generation_jobs WHERE id = $1`,
      [jobId]
    );

    if (result.rows.length === 0) {
      throw new GenerationServiceError('任务不存在', 'JOB_NOT_FOUND', 404);
    }

    return rowToGenerationJob(result.rows[0]);
  }

  /**
   * 更新任务状态
   */
  private async updateJobStatus(jobId: string, status: JobStatus): Promise<void> {
    await query(
      `UPDATE generation_jobs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [status, jobId]
    );
  }

  /**
   * 更新任务状态并记录错误信息
   */
  private async updateJobStatusWithError(
    jobId: string,
    status: JobStatus,
    errorMessage: string
  ): Promise<void> {
    await query(
      `UPDATE generation_jobs SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [status, errorMessage, jobId]
    );
  }

  /**
   * 保存候选图并创建数据库记录
   */
  private async saveCandidateImages(
    jobId: string,
    generatedImages: Array<{ buffer: Buffer; index: number }>
  ): Promise<CandidateWithUrl[]> {
    const candidates: CandidateWithUrl[] = [];

    for (const generated of generatedImages) {
      // 保存图片到存储
      const storageResult = await this.storage.save(
        generated.buffer,
        'png',
        'image/png'
      );

      // 使用事务创建 ImageAsset 和 CandidateImage
      const result = await transaction(async (client) => {
        // 创建 ImageAsset
        const imageAssetResult = await client.query<ImageAssetRow>(
          `INSERT INTO image_assets (file_path, original_name, mime_type, file_size)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [
            storageResult.path,
            `candidate_${generated.index}.png`,
            'image/png',
            storageResult.size,
          ]
        );

        const imageAsset = rowToImageAsset(imageAssetResult.rows[0]);

        // 创建 CandidateImage
        const candidateResult = await client.query<CandidateImageRow>(
          `INSERT INTO candidate_images (job_id, image_asset_id, index_num)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [jobId, imageAsset.id, generated.index]
        );

        const candidate = rowToCandidateImage(candidateResult.rows[0]);

        return {
          candidate,
          imageUrl: this.storage.getUrl(imageAsset.filePath),
        };
      });

      candidates.push(result);
    }

    return candidates;
  }

  /**
   * 获取任务的所有候选图（包含 URL）
   */
  private async getCandidatesWithUrls(jobId: string): Promise<CandidateWithUrl[]> {
    // 联合查询候选图和图片资源
    const result = await query<CandidateImageRow & { file_path: string }>(
      `SELECT ci.*, ia.file_path
       FROM candidate_images ci
       JOIN image_assets ia ON ci.image_asset_id = ia.id
       WHERE ci.job_id = $1
       ORDER BY ci.index_num ASC`,
      [jobId]
    );

    return result.rows.map((row) => ({
      candidate: rowToCandidateImage(row),
      imageUrl: this.storage.getUrl(row.file_path),
    }));
  }

  /**
   * 获取项目的所有生成任务
   * @param projectId 项目 ID
   * @returns 任务列表
   */
  async getJobsByProject(projectId: string): Promise<GenerationJob[]> {
    const result = await query<GenerationJobRow>(
      `SELECT * FROM generation_jobs 
       WHERE project_id = $1 
       ORDER BY created_at DESC`,
      [projectId]
    );

    return result.rows.map(rowToGenerationJob);
  }
}
