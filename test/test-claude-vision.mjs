/**
 * 测试 Claude 模型的图片处理能力
 * 以及不同的图片格式
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

// 不同的测试图片
const IMAGES = {
  // 10x10 红色方块 PNG
  redSquare: 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQzwAEjDAGNzYAAIoaB/5rSwaMAAAAAElFTkSuQmCC',
  // 1x1 绿色像素 PNG
  greenPixel: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
};

async function testWithImage(model, imageName, imageBase64, mimeType = 'image/png') {
  console.log(`\n测试: ${model} + ${imageName}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    // 尝试 OpenAI 格式
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
            { type: 'text', text: 'Describe what you see in this image. What is the main color?' },
            { 
              type: 'image_url', 
              image_url: { 
                url: `data:${mimeType};base64,${imageBase64}`,
              } 
            },
          ],
        }],
        max_tokens: 200,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`  ❌ ${response.status}: ${errorText.slice(0, 200)}`);
      return false;
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    console.log(`  响应: "${content.slice(0, 200)}"`);
    
    // 检查是否真的看到了图片
    const sawImage = !content.toLowerCase().includes("don't see") && 
                     !content.toLowerCase().includes("no image") &&
                     !content.toLowerCase().includes("cannot see");
    console.log(`  ${sawImage ? '✅ 模型看到了图片' : '⚠️ 模型可能没看到图片'}`);
    return sawImage;
  } catch (error) {
    console.log(`  ❌ 错误: ${error.message}`);
    return false;
  }
}

// 测试 Claude 的原生格式（Anthropic API 格式）
async function testClaudeNativeFormat(imageBase64) {
  console.log(`\n测试: Claude 原生格式 (Anthropic API)`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: imageBase64,
              },
            },
            { type: 'text', text: 'What color is this image?' },
          ],
        }],
        max_tokens: 100,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`  ❌ ${response.status}: ${errorText.slice(0, 200)}`);
      return;
    }
    
    const data = await response.json();
    console.log(`  ✅ 响应: "${data.choices?.[0]?.message?.content || 'N/A'}"`);
  } catch (error) {
    console.log(`  ❌ 错误: ${error.message}`);
  }
}

async function main() {
  console.log('=== Claude Vision 详细测试 ===');
  console.log(`API: ${BASE_URL}`);
  
  // 测试 Claude 3.5 Sonnet
  await testWithImage('claude-3-5-sonnet-20241022', 'redSquare', IMAGES.redSquare);
  await testWithImage('claude-3-5-sonnet-20241022', 'greenPixel', IMAGES.greenPixel);
  
  // 测试 Claude 原生格式
  await testClaudeNativeFormat(IMAGES.redSquare);
  
  // 测试其他可能支持的模型
  const otherModels = [
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ];
  
  for (const model of otherModels) {
    await testWithImage(model, 'redSquare', IMAGES.redSquare);
  }
  
  console.log('\n=== 测试完成 ===');
}

main().catch(console.error);
