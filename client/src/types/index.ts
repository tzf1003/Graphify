/**
 * 前端类型定义
 * 与后端类型保持一致
 */

// ==================== 枚举类型 ====================

/** 版本类型枚举 */
export type VersionType = 'imported' | 'json_edit' | 'selected_candidate' | 'checkout';

/** 任务状态枚举 */
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

// ==================== CanonicalJSON Schema ====================

/** 元数据 */
export interface CanonicalMeta {
  schema_version: string;
  output_language: string;
  width: number;
  height: number;
}

/** 场景风格 */
export interface SceneStyle {
  genre: string;
  palette: string;
  rendering: string;
}

/** 相机设置 */
export interface SceneCamera {
  shot: string;
  lens: string;
  angle: string;
  dof: string;
}

/** 光照设置 */
export interface SceneLighting {
  type: string;
  direction: string;
  contrast: string;
}

/** 场景描述 */
export interface CanonicalScene {
  summary: string;
  style: SceneStyle;
  camera: SceneCamera;
  lighting: SceneLighting;
}

/** 元素几何信息 */
export interface ElementGeometry {
  bbox: [number, number, number, number];
  polygon: number[][];
  depth_hint: number;
}

/** 文本外观 */
export interface TextAppearance {
  content: string;
  font_hint: string;
  language: string;
}

/** 元素外观 */
export interface ElementAppearance {
  material: string;
  color: string;
  texture: string;
  text?: TextAppearance;
}

/** 元素约束 */
export interface ElementConstraints {
  keep_identity: boolean;
  preserve_text_legibility: boolean;
}

/** 元素类型 */
export type ElementType = 'subject' | 'object' | 'text' | 'background' | 'effect';

/** 场景元素 */
export interface CanonicalElement {
  id: string;
  type: ElementType;
  name: string;
  description: string;
  geometry: ElementGeometry;
  appearance: ElementAppearance;
  constraints: ElementConstraints;
}

/** 关系类型 */
export type RelationType = 'occludes' | 'attached_to' | 'in_front_of' | 'part_of';

/** 元素关系 */
export interface CanonicalRelation {
  from: string;
  to: string;
  type: RelationType;
}

/** 安全设置 */
export interface EditSafety {
  avoid: string[];
}

/** 编辑意图 */
export interface EditIntent {
  goal: string;
  negatives: string[];
  safety: EditSafety;
}

/** Canonical JSON 完整结构 */
export interface CanonicalJSON {
  meta: CanonicalMeta;
  scene: CanonicalScene;
  elements: CanonicalElement[];
  relations: CanonicalRelation[];
  edit_intent: EditIntent;
}

// ==================== 实体类型 ====================

/** 项目实体 */
export interface Project {
  id: string;
  name: string;
  outputLanguage: string;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string | null;
}

/** 版本实体（带图片 URL） */
export interface Version {
  id: string;
  projectId: string;
  versionType: VersionType;
  imageAssetId: string | null;
  jsonContent: CanonicalJSON | null;
  parentVersionId: string | null;
  createdAt: string;
  imageUrl?: string;
}

/** 图片资源实体 */
export interface ImageAsset {
  id: string;
  filePath: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  createdAt: string;
  url?: string;
}

/** 生成任务实体 */
export interface GenerationJob {
  id: string;
  projectId: string;
  sourceVersionId: string;
  status: JobStatus;
  count: number;
  strength: number | null;
  seed: number | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 候选图实体 */
export interface CandidateImage {
  id: string;
  jobId: string;
  imageAssetId: string;
  indexNum: number;
  createdAt: string;
  imageUrl: string;
}

// ==================== API 响应类型 ====================

/** 错误响应 */
export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

/** 上传项目响应 */
export interface UploadProjectResponse {
  project: Project;
  version: Version;
  imageAsset: ImageAsset;
}

/** 获取项目响应 */
export interface GetProjectResponse {
  project: Project;
}

/** 项目列表响应 */
export interface ListProjectsResponse {
  projects: Project[];
}

/** 版本列表响应 */
export interface ListVersionsResponse {
  versions: Version[];
}

/** 创建版本响应 */
export interface CreateVersionResponse {
  version: Version;
}

/** 创建生成任务响应 */
export interface CreateJobResponse {
  job: GenerationJob;
}

/** 获取生成任务响应 */
export interface GetJobResponse {
  job: GenerationJob;
  candidates?: CandidateImage[];
}

// ==================== API 请求类型 ====================

/** 更新项目请求 */
export interface UpdateProjectRequest {
  name?: string;
  outputLanguage?: string;
}

/** 创建版本请求 */
export interface CreateVersionRequest {
  versionType: 'json_edit' | 'checkout';
  jsonContent?: string;
  sourceVersionId?: string;
}

/** 创建生成任务请求 */
export interface CreateJobRequest {
  count?: number;
  seed?: number;
  strength?: number;
}

/** 选择候选图请求 */
export interface SelectCandidateRequest {
  jobId: string;
  candidateId: string;
}
