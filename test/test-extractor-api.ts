/**
 * 测试 Extractor API 连通性
 * 用于诊断 OpenAI API 超时问题
 */

import * as path from 'path';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
const MODEL = process.env.OPENAI_EXTRACTOR_MODEL || 'gpt-4o';

async function testApiConnectivity(): Promise<void> {
  console.log('=== Extractor API 连通性测试 ===\n');
  console.log(`API Base URL: ${BASE_URL}`);
  console.log(`Model: ${MODEL}`);
  console.log(`API Key: ${API_KEY ? API_KEY.slice(0, 10) + '...' : '未设置'}\n`);

  if (!API_KEY) {
    console.error('❌ OPENAI_API_KEY 未设置');
    return;
  }

  // 测试 1: 简单的文本请求（不带图片）
  console.log('--- 测试 1: 简单文本请求 ---');
  try {
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: 'Say "Hello" in JSON format: {"greeting": "..."}' }],
        max_tokens: 100,
      }),
      signal: AbortSignal.timeout(30000), // 30秒超时
    });

    const elapsed = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API 错误 (${response.status}): ${errorText}`);
      console.log(`耗时: ${elapsed}ms\n`);
      return;
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    console.log(`✅ 文本请求成功`);
    console.log(`耗时: ${elapsed}ms`);
    console.log(`响应: ${JSON.stringify(data.choices?.[0]?.message?.content || data).slice(0, 200)}\n`);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        console.error('❌ 请求超时（30秒）');
      } else {
        console.error(`❌ 请求失败: ${error.message}`);
      }
    }
    return;
  }

  // 测试 2: 带图片的请求（使用小图片）
  console.log('--- 测试 2: 带图片请求 ---');
  try {
    // 创建一个简单的 1x1 PNG 图片（base64）
    const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Describe this image in one word.' },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${tinyPngBase64}`,
                  detail: 'low',
                },
              },
            ],
          },
        ],
        max_tokens: 50,
      }),
      signal: AbortSignal.timeout(60000), // 60秒超时
    });

    const elapsed = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API 错误 (${response.status}): ${errorText}`);
      console.log(`耗时: ${elapsed}ms\n`);
      return;
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    console.log(`✅ 图片请求成功`);
    console.log(`耗时: ${elapsed}ms`);
    console.log(`响应: ${JSON.stringify(data.choices?.[0]?.message?.content || data).slice(0, 200)}\n`);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        console.error('❌ 图片请求超时（60秒）- 这可能是导致上传失败的原因');
      } else {
        console.error(`❌ 图片请求失败: ${error.message}`);
      }
    }
  }

  console.log('=== 测试完成 ===');
}

testApiConnectivity().catch(console.error);
