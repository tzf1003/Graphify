/**
 * 测试上传接口的重试机制
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE = 'http://localhost:3000';

// 使用有效的 1x1 绿色像素 PNG（与 SDK 测试相同）
function createTestImage() {
  // 这是一个有效的 1x1 PNG 图片 (绿色)
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  return Buffer.from(base64, 'base64');
}

async function testUpload() {
  console.log('=== 测试上传接口重试机制 ===\n');
  
  // 检查服务器是否运行
  try {
    const healthCheck = await fetch(`${API_BASE}/api/projects`);
    console.log('✅ 服务器运行中\n');
  } catch (e) {
    console.log('❌ 无法连接服务器:', e.message);
    return;
  }

  // 创建测试图片
  const imageBuffer = createTestImage();
  console.log(`测试图片大小: ${imageBuffer.length} bytes\n`);

  // 构建 multipart/form-data
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="file"; filename="test.png"\r\n`),
    Buffer.from(`Content-Type: image/png\r\n\r\n`),
    imageBuffer,
    Buffer.from(`\r\n--${boundary}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="name"\r\n\r\n`),
    Buffer.from(`测试项目_重试机制`),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  console.log('发送上传请求...');
  console.log('（如果 API 返回 503，将触发重试机制，请观察服务器日志）\n');

  const startTime = Date.now();
  
  try {
    const response = await fetch(`${API_BASE}/api/projects/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
    });

    const elapsed = Date.now() - startTime;
    const data = await response.json();

    console.log(`状态码: ${response.status}`);
    console.log(`耗时: ${elapsed}ms`);
    
    if (response.ok) {
      console.log('✅ 上传成功');
      console.log(`项目 ID: ${data.project?.id}`);
      console.log(`版本 ID: ${data.version?.id}`);
      console.log(`JSON 内容: ${data.version?.jsonContent ? '已提取' : '未提取'}`);
    } else {
      console.log('❌ 上传失败');
      console.log(`错误: ${data.error}`);
      console.log(`错误码: ${data.code}`);
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.log(`❌ 请求失败: ${error.message}`);
    console.log(`耗时: ${elapsed}ms`);
  }
}

testUpload().catch(console.error);
