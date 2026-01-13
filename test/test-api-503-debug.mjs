/**
 * 深入调试 503 错误原因
 * 测试不同的请求参数组合
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
const MODEL = process.env.OPENAI_EXTRACTOR_MODEL || 'gpt-4o';

// 简单的红色方块图片 (10x10)
const SIMPLE_IMAGE = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQzwAEjDAGNzYAAIoaB/5rSwaMAAAAAElFTkSuQmCC';

async function makeRequest(testName, requestBody) {
  console.log(`\n--- ${testName} ---`);
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ 状态码: ${response.status}`);
      console.log(`耗时: ${elapsed}ms`);
      console.log(`错误: ${errorText.slice(0, 300)}`);
      return { success: false, status: response.status, elapsed };
    }
    
    const data = await response.json();
    console.log(`✅ 成功`);
    console.log(`耗时: ${elapsed}ms`);
    console.log(`响应: ${data.choices?.[0]?.message?.content?.slice(0, 100) || 'N/A'}...`);
    return { success: true, elapsed };
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.log(`❌ 错误: ${error.message}`);
    console.log(`耗时: ${elapsed}ms`);
    return { success: false, error: error.message, elapsed };
  }
}

async function runTests() {
  console.log('=== 503 错误原因调试 ===');
  console.log(`API: ${BASE_URL}`);
  console.log(`Model: ${MODEL}`);

  // 测试1: 纯文本，简单 prompt
  await makeRequest('测试1: 纯文本简单请求', {
    model: MODEL,
    messages: [{ role: 'user', content: 'Say hello' }],
    max_tokens: 50,
  });

  // 测试2: 图片 + 简单 prompt
  await makeRequest('测试2: 图片 + 简单 prompt', {
    model: MODEL,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'What color is this?' },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${SIMPLE_IMAGE}`, detail: 'low' } },
      ],
    }],
    max_tokens: 50,
  });

  // 测试3: 图片 + 中等长度 prompt
  await makeRequest('测试3: 图片 + 中等 prompt', {
    model: MODEL,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'Describe this image in detail. Include colors, shapes, and any patterns you see. Return your answer as JSON: {"description": "..."}' },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${SIMPLE_IMAGE}`, detail: 'low' } },
      ],
    }],
    max_tokens: 200,
  });

  // 测试4: 图片 + 长 prompt (类似实际使用)
  const longPrompt = `You are an image analysis expert. Analyze the provided image and extract a structured JSON description.
Return a JSON object with this structure:
{
  "meta": { "width": 0, "height": 0 },
  "scene": { "summary": "description" },
  "elements": []
}
Return ONLY valid JSON.`;

  await makeRequest('测试4: 图片 + 长 prompt', {
    model: MODEL,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: longPrompt },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${SIMPLE_IMAGE}`, detail: 'low' } },
      ],
    }],
    max_tokens: 500,
  });

  // 测试5: 图片 + 长 prompt + high detail
  await makeRequest('测试5: 图片 + 长 prompt + high detail', {
    model: MODEL,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: longPrompt },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${SIMPLE_IMAGE}`, detail: 'high' } },
      ],
    }],
    max_tokens: 500,
  });

  // 测试6: 图片 + 超长 prompt (完整的提取 prompt)
  const fullPrompt = `You are an image analysis expert. Analyze the provided image and extract a structured JSON description.

Output language for text values: zh-CN
JSON keys must always be in English.

Return a JSON object with this exact structure:
{
  "meta": {
    "schema_version": "1.0.0",
    "output_language": "zh-CN",
    "width": 0,
    "height": 0
  },
  "scene": {
    "summary": "<brief description>",
    "style": { "genre": "", "palette": "", "rendering": "" },
    "camera": { "shot": "", "lens": "", "angle": "", "dof": "" },
    "lighting": { "type": "", "direction": "", "contrast": "" }
  },
  "elements": [
    {
      "id": "elem_001",
      "type": "subject",
      "name": "",
      "description": "",
      "geometry": { "bbox": [0,0,0,0], "polygon": [], "depth_hint": 0 },
      "appearance": { "material": "", "color": "", "texture": "" },
      "constraints": { "keep_identity": true, "preserve_text_legibility": false }
    }
  ],
  "relations": [],
  "edit_intent": { "goal": "", "negatives": [], "safety": { "avoid": [] } }
}

Return ONLY valid JSON, no markdown.`;

  await makeRequest('测试6: 完整提取 prompt', {
    model: MODEL,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: fullPrompt },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${SIMPLE_IMAGE}`, detail: 'high' } },
      ],
    }],
    max_tokens: 4096,
    temperature: 0.1,
  });

  console.log('\n=== 测试完成 ===');
}

runTests().catch(console.error);
