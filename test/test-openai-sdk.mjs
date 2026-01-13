/**
 * 使用官方 OpenAI SDK 测试 API
 */

import OpenAI from 'openai';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
const MODEL = process.env.OPENAI_EXTRACTOR_MODEL || 'gpt-4o';

async function main() {
  console.log('=== OpenAI SDK 测试 ===\n');
  console.log(`API Base URL: ${BASE_URL}`);
  console.log(`Model: ${MODEL}`);
  console.log(`API Key: ${API_KEY ? API_KEY.slice(0, 10) + '...' : '未设置'}\n`);

  const client = new OpenAI({
    apiKey: API_KEY,
    baseURL: BASE_URL,
    timeout: 60000,
    maxRetries: 0, // 禁用重试以便观察原始错误
  });

  // 测试 1: 纯文本请求
  console.log('--- 测试 1: 纯文本请求 ---');
  try {
    const startTime = Date.now();
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: 'Say hello in JSON: {"greeting": "..."}' }],
      max_tokens: 50,
    });
    console.log(`✅ 成功 (${Date.now() - startTime}ms)`);
    console.log(`响应: ${response.choices[0]?.message?.content}\n`);
  } catch (error) {
    console.log(`❌ 失败: ${error.message}\n`);
  }

  // 测试 2: 带图片请求
  console.log('--- 测试 2: 带图片请求 ---');
  const tinyImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  try {
    const startTime = Date.now();
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'What color is this?' },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${tinyImage}` } },
        ],
      }],
      max_tokens: 50,
    });
    console.log(`✅ 成功 (${Date.now() - startTime}ms)`);
    console.log(`响应: ${response.choices[0]?.message?.content}\n`);
  } catch (error) {
    console.log(`❌ 失败 (${error.status || 'N/A'}): ${error.message}\n`);
  }

  console.log('=== 测试完成 ===');
}

main().catch(console.error);
