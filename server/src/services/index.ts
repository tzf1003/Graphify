/**
 * 服务层统一导出
 */

export {
  ProjectService,
  ProjectServiceError,
  CreateProjectInput,
  UpdateProjectInput,
  UploadAndInitializeInput,
  UploadAndInitializeResult,
} from './projectService';

export {
  VersionService,
  VersionServiceError,
  CreateVersionInput,
  CreateJsonEditVersionInput,
  CreateCheckoutVersionInput,
  CreateSelectedCandidateVersionInput,
} from './versionService';

export {
  GenerationService,
  GenerationServiceError,
  CreateJobInput,
  JobWithCandidates,
  CandidateWithUrl,
} from './generationService';
