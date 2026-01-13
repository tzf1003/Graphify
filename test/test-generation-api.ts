/**
 * 图片生成 API 端到端测试
 * 测试完整的生成流程：创建项目 -> 上传图片 -> 创建生成任务 -> 执行生成 -> 选择候选图
 */

import * as fs from 'fs';
import * as path from 'path';

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

interface Project {
  id: string;
  name: string;
  outputLanguage: string;
  currentVersionId: string | null;
}

interface Version {
  id: string;
  projectId: string;
  versionType: string;
  imageAssetId: string | null;
  jsonContent: unknown;
}

interface GenerationJob {
  id: string;
  projectId: string;
  sourceVersionId: string;
  status: string;
  count: number;
  errorMessage: string | null;
}

interface CandidateWithUrl {
  candidate: {
    id: string;
    jobId: string;
    imageAssetId: string;
    indexNum: number;
  };
  imageUrl: string;
}

/**
 * 创建测试项目
 */
async function createProject(name: string): Promise<Project> {
  console.log(`创建项目: ${name}`);
  
  const response = await fetch(`${API_BASE}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, outputLanguage: 'zh-CN' }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`创建项目失败: ${error}`);
  }

  const project = await response.json() as Project;
  console.log(`  项目 ID: ${project.id}`);
  return project;
}

/**
 * 上传图片到项目
 */
async function uploadImage(projectId: string, imagePath: string): Promise<Version> {
  console.log(`上传图片: ${imagePath}`);
  
  const imageBuffer = fs.readFileSync(imagePath);
  const formData = new FormData();
  formData.append('image', new Blob([imageBuffer], { type: 'image/png' }), path.basename(imagePath));

  const response = await fetch(`${API_BASE}/api/projects/${projectId}/import`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`上传图片失败: ${error}`);
  }

  const result = await response.json() as { project: Project; version: Version };
  console.log(`  版本 ID: ${result.version.id}`);
  console.log(`  版本类型: ${result.version.versionType}`);
  return result.version;
}

/**
 * 创建生成任务
 */
async function createGenerationJob(
  projectId: string,
  sourceVersionId: string,
  count: number = 2
): Promise<GenerationJob> {
  console.log(`创建生成任务 (count=${count})`);
  
  const response = await fetch(`${API_BASE}/api/projects/${projectId}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceVersionId, count }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`创建生成任务失败: ${error}`);
  }

  const job = await response.json() as GenerationJob;
  console.log(`  任务 ID: ${job.id}`);
  console.log(`  状态: ${job.status}`);
  return job;
}

/**
 * 查询任务状态
 */
async function getJobStatus(projectId: string, jobId: string): Promise<{
  job: GenerationJob;
  candidates: CandidateWithUrl[];
}> {
  const response = await fetch(`${API_BASE}/api/projects/${projectId}/jobs/${jobId}`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`查询任务状态失败: ${error}`);
  }

  return response.json() as Promise<{ job: GenerationJob; candidates: CandidateWithUrl[] }>;
}

/**
 * 等待任务完成
 */
async function waitForJobCompletion(
  projectId: string,
  jobId: string,
  maxWaitMs: number = 300000
): Promise<{ job: GenerationJob; candidates: CandidateWithUrl[] }> {
  console.log('等待任务完成...');
  
  const startTime = Date.now();
  let lastStatus = '';

  while (Date.now() - startTime < maxWaitMs) {
    const result = await getJobStatus(projectId, jobId);
    
    if (result.job.status !== lastStatus) {
      console.log(`  状态: ${result.job.status}`);
      lastStatus = result.job.status;
    }

    if (result.job.status === 'succeeded') {
      console.log(`  生成完成，候选图数量: ${result.candidates.length}`);
      return result;
    }

    if (result.job.status === 'failed') {
      throw new Error(`任务失败: ${result.job.errorMessage}`);
    }

    // 等待 2 秒后重试
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('任务超时');
}

/**
 * 选择候选图
 */
async function selectCandidate(
  projectId: string,
  jobId: string,
  candidateId: string
): Promise<Version> {
  console.log(`选择候选图: ${candidateId}`);
  
  const response = await fetch(
    `${API_BASE}/api/projects/${projectId}/jobs/${jobId}/select`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`选择候选图失败: ${error}`);
  }

  const version = await response.json() as Version;
  console.log(`  新版本 ID: ${version.id}`);
  console.log(`  版本类型: ${version.versionType}`);
  return version;
}

/**
 * 下载并保存候选图
 */
async function downloadCandidateImages(
  candidates: CandidateWithUrl[],
  outputDir: string
): Promise<void> {
  console.log(`下载候选图到: ${outputDir}`);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const { candidate, imageUrl } of candidates) {
    const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE}${imageUrl}`;
    console.log(`  下载: ${fullUrl}`);
    
    const response = await fetch(fullUrl);
    if (!response.ok) {
      console.log(`    下载失败: ${response.status}`);
      continue;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const outputPath = path.join(outputDir, `candidate_${candidate.indexNum}.png`);
    fs.writeFileSync(outputPath, buffer);
    console.log(`    保存到: ${outputPath} (${buffer.length} bytes)`);
  }
}

/**
 * 主测试流程
 */
async function main() {
  console.log('='.repeat(60));
  console.log('图片生成 API 端到端测试');
  console.log('='.repeat(60));
  console.log(`API Base: ${API_BASE}`);
  console.log('');

  try {
    // 检查 API 健康状态
    console.log('检查 API 健康状态...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    if (!healthResponse.ok) {
      throw new Error('API 服务不可用');
    }
    console.log('  API 服务正常');
    console.log('');

    // 1. 创建项目
    const project = await createProject(`测试项目_${Date.now()}`);
    console.log('');

    // 2. 准备测试图片
    const testImagePath = path.join(__dirname, '../data/test-output/test-generated-1768208496208.png');
    if (!fs.existsSync(testImagePath)) {
      // 如果没有测试图片，创建一个简单的测试图片
      console.log('创建测试图片...');
      const testDir = path.dirname(testImagePath);
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      // 使用一个简单的 1x1 PNG
      const simplePng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      fs.writeFileSync(testImagePath, simplePng);
    }

    // 3. 上传图片
    const version = await uploadImage(project.id, testImagePath);
    console.log('');

    // 4. 创建生成任务
    const job = await createGenerationJob(project.id, version.id, 2);
    console.log('');

    // 5. 等待任务完成
    const result = await waitForJobCompletion(project.id, job.id);
    console.log('');

    // 6. 下载候选图
    const outputDir = path.join(__dirname, '../data/test-output/candidates');
    await downloadCandidateImages(result.candidates, outputDir);
    console.log('');

    // 7. 选择第一个候选图
    if (result.candidates.length > 0) {
      const selectedVersion = await selectCandidate(
        project.id,
        job.id,
        result.candidates[0].candidate.id
      );
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('✅ 测试完成！');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('');
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

main();
