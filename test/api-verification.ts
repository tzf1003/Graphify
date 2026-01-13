/**
 * API 验证脚本
 * 用于测试后端所有 API 端点
 * 
 * 运行方式: npx tsx test/api-verification.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  response?: unknown;
}

const results: TestResult[] = [];

// 存储测试过程中创建的资源 ID
let projectId: string | null = null;
let versionId: string | null = null;
let jobId: string | null = null;
let candidateId: string | null = null;

/**
 * 记录测试结果
 */
function logResult(name: string, passed: boolean, message: string, response?: unknown): void {
  results.push({ name, passed, message, response });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (!passed) {
    console.log(`   Message: ${message}`);
    if (response) {
      console.log(`   Response: ${JSON.stringify(response, null, 2).substring(0, 500)}`);
    }
  }
}

/**
 * 创建测试图片文件
 */
function createTestImage(): Buffer {
  // 创建一个简单的 1x1 PNG 图片
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x02, // bit depth: 8, color type: RGB
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0xFF, 0x00, // compressed data
    0x05, 0xFE, 0x02, 0xFE, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  return pngHeader;
}

// ==================== API 测试函数 ====================

/**
 * 测试 1: Health Check
 */
async function testHealthCheck(): Promise<void> {
  const testName = '1. Health Check - GET /health';
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'ok') {
      logResult(testName, true, 'Health check passed');
    } else {
      logResult(testName, false, 'Unexpected response', data);
    }
  } catch (error) {
    logResult(testName, false, `Request failed: ${error}`);
  }
}

/**
 * 测试 2: 上传图片创建项目
 */
async function testUploadImage(): Promise<void> {
  const testName = '2. Upload Image - POST /api/projects/upload';
  try {
    const imageBuffer = createTestImage();
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('file', blob, 'test-image.png');
    formData.append('name', 'API Test Project');
    formData.append('outputLanguage', 'zh-CN');

    const response = await fetch(`${BASE_URL}/api/projects/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();

    if (response.status === 201 && data.project && data.version && data.imageAsset) {
      projectId = data.project.id;
      versionId = data.version.id;
      logResult(testName, true, `Project created: ${projectId}`);
    } else {
      logResult(testName, false, 'Failed to create project', data);
    }
  } catch (error) {
    logResult(testName, false, `Request failed: ${error}`);
  }
}

/**
 * 测试 3: 获取项目详情
 */
async function testGetProject(): Promise<void> {
  const testName = '3. Get Project - GET /api/projects/:id';
  if (!projectId) {
    logResult(testName, false, 'No project ID available');
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/projects/${projectId}`);
    const data = await response.json();

    if (response.ok && data.project && data.project.id === projectId) {
      logResult(testName, true, 'Project retrieved successfully');
    } else {
      logResult(testName, false, 'Failed to get project', data);
    }
  } catch (error) {
    logResult(testName, false, `Request failed: ${error}`);
  }
}

/**
 * 测试 4: 获取不存在的项目（404 错误处理）
 */
async function testGetNonExistentProject(): Promise<void> {
  const testName = '4. Get Non-existent Project - GET /api/projects/:id (404)';
  try {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await fetch(`${BASE_URL}/api/projects/${fakeId}`);
    const data = await response.json();

    if (response.status === 404 && data.error) {
      logResult(testName, true, 'Correctly returned 404');
    } else {
      logResult(testName, false, 'Expected 404 error', data);
    }
  } catch (error) {
    logResult(testName, false, `Request failed: ${error}`);
  }
}

/**
 * 测试 5: 更新项目设置
 */
async function testUpdateProject(): Promise<void> {
  const testName = '5. Update Project - PATCH /api/projects/:id';
  if (!projectId) {
    logResult(testName, false, 'No project ID available');
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Updated Project Name',
        outputLanguage: 'en-US',
      }),
    });
    const data = await response.json();

    if (response.ok && data.project && data.project.name === 'Updated Project Name') {
      logResult(testName, true, 'Project updated successfully');
    } else {
      logResult(testName, false, 'Failed to update project', data);
    }
  } catch (error) {
    logResult(testName, false, `Request failed: ${error}`);
  }
}

/**
 * 测试 6: 获取版本列表
 */
async function testGetVersions(): Promise<void> {
  const testName = '6. Get Versions - GET /api/projects/:id/versions';
  if (!projectId) {
    logResult(testName, false, 'No project ID available');
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/projects/${projectId}/versions`);
    const data = await response.json();

    if (response.ok && Array.isArray(data.versions) && data.versions.length > 0) {
      logResult(testName, true, `Found ${data.versions.length} version(s)`);
    } else {
      logResult(testName, false, 'Failed to get versions', data);
    }
  } catch (error) {
    logResult(testName, false, `Request failed: ${error}`);
  }
}

/**
 * 测试 7: 创建 JSON 编辑版本
 */
async function testCreateJsonEditVersion(): Promise<void> {
  const testName = '7. Create JSON Edit Version - POST /api/projects/:id/versions';
  if (!projectId) {
    logResult(testName, false, 'No project ID available');
    return;
  }

  try {
    const jsonContent = JSON.stringify({
      meta: {
        schema_version: '1.0',
        output_language: 'zh-CN',
        width: 100,
        height: 100,
      },
      scene: {
        summary: 'Test scene',
        style: { genre: 'test', palette: 'test', rendering: 'test' },
        camera: { shot: 'test', lens: 'test', angle: 'test', dof: 'test' },
        lighting: { type: 'test', direction: 'test', contrast: 'test' },
      },
      elements: [],
      relations: [],
      edit_intent: {
        goal: 'Test edit',
        negatives: [],
        safety: { avoid: [] },
      },
    });

    const response = await fetch(`${BASE_URL}/api/projects/${projectId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        versionType: 'json_edit',
        jsonContent,
      }),
    });
    const data = await response.json();

    if (response.status === 201 && data.version && data.version.versionType === 'json_edit') {
      versionId = data.version.id;
      logResult(testName, true, `JSON edit version created: ${versionId}`);
    } else {
      logResult(testName, false, 'Failed to create JSON edit version', data);
    }
  } catch (error) {
    logResult(testName, false, `Request failed: ${error}`);
  }
}

/**
 * 测试 8: 创建 Checkout 版本
 */
async function testCreateCheckoutVersion(): Promise<void> {
  const testName = '8. Create Checkout Version - POST /api/projects/:id/versions';
  if (!projectId || !versionId) {
    logResult(testName, false, 'No project ID or version ID available');
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/projects/${projectId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        versionType: 'checkout',
        sourceVersionId: versionId,
      }),
    });
    const data = await response.json();

    if (response.status === 201 && data.version && data.version.versionType === 'checkout') {
      logResult(testName, true, `Checkout version created: ${data.version.id}`);
    } else {
      logResult(testName, false, 'Failed to create checkout version', data);
    }
  } catch (error) {
    logResult(testName, false, `Request failed: ${error}`);
  }
}

/**
 * 测试 9: 创建生成任务
 */
async function testCreateGenerationJob(): Promise<void> {
  const testName = '9. Create Generation Job - POST /api/projects/:id/generate';
  if (!projectId) {
    logResult(testName, false, 'No project ID available');
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/projects/${projectId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        count: 2,
        strength: 0.5,
      }),
    });
    const data = await response.json();

    if (response.status === 201 && data.job && data.job.status === 'queued') {
      jobId = data.job.id;
      logResult(testName, true, `Generation job created: ${jobId}`);
    } else {
      logResult(testName, false, 'Failed to create generation job', data);
    }
  } catch (error) {
    logResult(testName, false, `Request failed: ${error}`);
  }
}

/**
 * 测试 10: 查询生成任务状态
 */
async function testGetGenerationJob(): Promise<void> {
  const testName = '10. Get Generation Job - GET /api/generations/:id';
  if (!jobId) {
    logResult(testName, false, 'No job ID available');
    return;
  }

  // 等待任务完成（最多 10 秒）
  let attempts = 0;
  const maxAttempts = 20;
  let jobData: { job?: { status: string }; candidates?: Array<{ id: string }> } | null = null;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${BASE_URL}/api/generations/${jobId}`);
      jobData = await response.json();

      if (jobData?.job?.status === 'succeeded' || jobData?.job?.status === 'failed') {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    } catch (error) {
      logResult(testName, false, `Request failed: ${error}`);
      return;
    }
  }

  if (jobData?.job?.status === 'succeeded' && jobData.candidates && jobData.candidates.length > 0) {
    candidateId = jobData.candidates[0].id;
    logResult(testName, true, `Job succeeded with ${jobData.candidates.length} candidates`);
  } else if (jobData?.job?.status === 'failed') {
    logResult(testName, false, 'Job failed', jobData);
  } else {
    logResult(testName, false, 'Job did not complete in time', jobData);
  }
}

/**
 * 测试 11: 选择候选图
 */
async function testSelectCandidate(): Promise<void> {
  const testName = '11. Select Candidate - POST /api/projects/:id/select';
  if (!projectId || !jobId || !candidateId) {
    logResult(testName, false, 'Missing required IDs');
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/projects/${projectId}/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        candidateId,
      }),
    });
    const data = await response.json();

    if (response.status === 201 && data.version && data.version.versionType === 'selected_candidate') {
      logResult(testName, true, `Selected candidate version created: ${data.version.id}`);
    } else {
      logResult(testName, false, 'Failed to select candidate', data);
    }
  } catch (error) {
    logResult(testName, false, `Request failed: ${error}`);
  }
}

/**
 * 测试 12: 获取项目列表
 */
async function testListProjects(): Promise<void> {
  const testName = '12. List Projects - GET /api/projects';
  try {
    const response = await fetch(`${BASE_URL}/api/projects?limit=10&offset=0`);
    const data = await response.json();

    if (response.ok && Array.isArray(data.projects)) {
      logResult(testName, true, `Found ${data.projects.length} project(s)`);
    } else {
      logResult(testName, false, 'Failed to list projects', data);
    }
  } catch (error) {
    logResult(testName, false, `Request failed: ${error}`);
  }
}

/**
 * 测试 13: 无效 count 参数（错误处理）
 */
async function testInvalidCountParameter(): Promise<void> {
  const testName = '13. Invalid Count Parameter - POST /api/projects/:id/generate (400)';
  if (!projectId) {
    logResult(testName, false, 'No project ID available');
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/projects/${projectId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        count: 10, // 超出 1-8 范围
      }),
    });
    const data = await response.json();

    if (response.status === 400 && data.code === 'INVALID_COUNT_RANGE') {
      logResult(testName, true, 'Correctly returned 400 for invalid count');
    } else {
      logResult(testName, false, 'Expected 400 error for invalid count', data);
    }
  } catch (error) {
    logResult(testName, false, `Request failed: ${error}`);
  }
}

/**
 * 测试 14: 缺少必要参数（错误处理）
 */
async function testMissingParameters(): Promise<void> {
  const testName = '14. Missing Parameters - POST /api/projects/:id/versions (400)';
  if (!projectId) {
    logResult(testName, false, 'No project ID available');
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/projects/${projectId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // 缺少 versionType
    });
    const data = await response.json();

    if (response.status === 400 && data.code === 'MISSING_VERSION_TYPE') {
      logResult(testName, true, 'Correctly returned 400 for missing versionType');
    } else {
      logResult(testName, false, 'Expected 400 error for missing parameters', data);
    }
  } catch (error) {
    logResult(testName, false, `Request failed: ${error}`);
  }
}

/**
 * 测试 15: 404 路由不存在
 */
async function testNotFoundRoute(): Promise<void> {
  const testName = '15. Not Found Route - GET /api/nonexistent (404)';
  try {
    const response = await fetch(`${BASE_URL}/api/nonexistent`);
    const data = await response.json();

    if (response.status === 404 && data.code === 'ROUTE_NOT_FOUND') {
      logResult(testName, true, 'Correctly returned 404 for non-existent route');
    } else {
      logResult(testName, false, 'Expected 404 error', data);
    }
  } catch (error) {
    logResult(testName, false, `Request failed: ${error}`);
  }
}

// ==================== 主函数 ====================

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('后端 API 验证测试');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log('');

  // 执行所有测试
  await testHealthCheck();
  await testUploadImage();
  await testGetProject();
  await testGetNonExistentProject();
  await testUpdateProject();
  await testGetVersions();
  await testCreateJsonEditVersion();
  await testCreateCheckoutVersion();
  await testCreateGenerationJob();
  await testGetGenerationJob();
  await testSelectCandidate();
  await testListProjects();
  await testInvalidCountParameter();
  await testMissingParameters();
  await testNotFoundRoute();

  // 输出测试结果汇总
  console.log('');
  console.log('='.repeat(60));
  console.log('测试结果汇总');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`总计: ${total} 个测试`);
  console.log(`通过: ${passed} 个 (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`失败: ${failed} 个 (${((failed / total) * 100).toFixed(1)}%)`);

  if (failed > 0) {
    console.log('');
    console.log('失败的测试:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
  }

  console.log('');
  console.log('='.repeat(60));

  // 退出码
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
