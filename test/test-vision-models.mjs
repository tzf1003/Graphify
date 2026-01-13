/**
 * 测试不同的 Vision 模型
 * 找出哪个模型支持图片输入
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

// 简单的红色方块图片
const SIMPLE_IMAGE = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQzwAEjDAGNzYAAIoaB/5rSwaMAAAAAElFTkSuQmCC';

// 要测试的模型列表
const MODELS_TO_TEST = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-vision-preview',
  'gpt-4-turbo',
  'claude-3-5-sonnet-20241022',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
];

async function testModel(model) {
  console.log(`\n测试模型: ${model}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'What color is this image? Reply with just the color name.' },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${SIMPLE_IMAGE}`, detail: 'low' } },
          ],
        }],
        max_tokens: 50,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      const errorJson = JSON.parse(errorText);
      console.log(`  ❌ ${response.status}: ${errorJson.error?.message?.slice(0, 100) || errorText.slice(0, 100)}`);
      return { model, success: false, status: response.status };
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    console.log(`  ✅ 成功: "${content}"`);
    return { model, success: true, response: content };
  } catch (error) {
    console.log(`  ❌ 错误: ${error.message}`);
    return { model, success: false, error: error.message };
  }
}

async function main() {
  console.log('=== Vision 模型兼容性测试 ===');
  console.log(`API: ${BASE_URL}`);
  
  const results = [];
  for (const model of MODELS_TO_TEST) {
    const result = await testModel(model);
    results.push(result);
  }
  
  console.log('\n=== 测试结果汇总 ===');
  const working = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✅ 支持图片的模型 (${working.length}):`);
  working.forEach(r => console.log(`  - ${r.model}`));
  
  console.log(`\n❌ 不支持图片的模型 (${failed.length}):`);
  failed.forEach(r => console.log(`  - ${r.model}: ${r.status || r.error}`));
  
  if (working.length > 0) {
    console.log(`\n推荐使用: ${working[0].model}`);
  }
}

main().catch(console.error);
