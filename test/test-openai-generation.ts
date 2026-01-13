/**
 * OpenAI 图片生成接口测试脚本
 * 测试 gemini-2.5-flash-image-preview 模型的图片生成能力
 */

import * as fs from 'fs';
import * as path from 'path';

// 配置
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-s2V4eg89N73X0eTwTDnzTVYoRknWw0IgKcDjQTtpQ9vUrUnd';
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || 'https://api.chatanywhere.tech';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gemini-2.5-flash-image-preview';

interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string | null;
    };
    finish_reason: string;
  }>;
}

/**
 * 从响应中提取图片
 */
function extractImageFromResponse(response: OpenAIChatResponse): Buffer | null {
  if (!response.choices || response.choices.length === 0) {
    console.log('响应中没有 choices');
    return null;
  }

  const content = response.choices[0].message.content;
  if (!content) {
    console.log('响应内容为空');
    return null;
  }

  console.log('响应内容长度:', content.length);
  console.log('响应内容预览:', content.substring(0, 500));

  // 尝试从 markdown 图片格式提取 base64
  const markdownMatch = content.match(
    /!\[.*?\]\(data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)\)/
  );
  if (markdownMatch) {
    console.log('从 markdown 格式提取到图片');
    return Buffer.from(markdownMatch[1], 'base64');
  }

  // 尝试直接匹配 base64 数据 URL
  const dataUrlMatch = content.match(
    /data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/
  );
  if (dataUrlMatch) {
    console.log('从 data URL 格式提取到图片');
    return Buffer.from(dataUrlMatch[1], 'base64');
  }

  // 尝试匹配纯 base64 字符串
  const base64Match = content.match(/([A-Za-z0-9+/=]{100,})/);
  if (base64Match) {
    console.log('尝试解析纯 base64 字符串');
    try {
      const buffer = Buffer.from(base64Match[1], 'base64');
      // 检查是否为有效图片
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
      const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
      if (isPng || isJpeg) {
        console.log('解析到有效图片');
        return buffer;
      }
    } catch (e) {
      console.log('base64 解析失败:', e);
    }
  }

  console.log('未能从响应中提取图片');
  return null;
}

/**
 * 测试图片生成
 */
async function testImageGeneration() {
  console.log('='.repeat(60));
  console.log('OpenAI 图片生成测试');
  console.log('='.repeat(60));
  console.log('API Base:', OPENAI_API_BASE);
  console.log('Model:', OPENAI_MODEL);
  console.log('');

  // 创建一个简单的测试图片（1x1 红色像素 PNG）
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  
  const apiUrl = `${OPENAI_API_BASE}/v1/chat/completions`;

  const requestBody = {
    model: OPENAI_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${testImageBase64}`,
            },
          },
          {
            type: 'text',
            text: '请根据这张图片生成一张新的图片：一只可爱的卡通猫咪，橙色毛发，大眼睛，坐在草地上。请直接输出生成的图片。',
          },
        ],
      },
    ],
    max_tokens: 4096,
  };

  console.log('发送请求...');
  console.log('请求 URL:', apiUrl);

  try {
    const startTime = Date.now();
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const elapsed = Date.now() - startTime;
    console.log(`响应状态: ${response.status} (耗时: ${elapsed}ms)`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 错误:', errorText);
      return;
    }

    const data = (await response.json()) as OpenAIChatResponse;
    console.log('响应 ID:', data.id);
    console.log('使用模型:', data.model);
    console.log('完成原因:', data.choices?.[0]?.finish_reason);

    // 尝试提取图片
    const imageBuffer = extractImageFromResponse(data);

    if (imageBuffer) {
      // 保存图片
      const outputDir = path.join(__dirname, '../data/test-output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = path.join(outputDir, `test-generated-${Date.now()}.png`);
      fs.writeFileSync(outputPath, imageBuffer);
      console.log('');
      console.log('✅ 图片生成成功！');
      console.log('保存路径:', outputPath);
      console.log('图片大小:', imageBuffer.length, 'bytes');
    } else {
      console.log('');
      console.log('⚠️ 未能从响应中提取图片');
      console.log('完整响应:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('请求失败:', error);
  }
}

/**
 * 测试 API 连通性
 */
async function testApiConnectivity() {
  console.log('测试 API 连通性...');
  
  const apiUrl = `${OPENAI_API_BASE}/v1/models`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
    });

    console.log('Models API 状态:', response.status);
    
    if (response.ok) {
      const data = await response.json() as { data?: Array<unknown> };
      console.log('可用模型数量:', data.data?.length || 0);
    }
  } catch (error) {
    console.log('Models API 不可用（这可能是正常的）:', error);
  }
  
  console.log('');
}

// 主函数
async function main() {
  await testApiConnectivity();
  await testImageGeneration();
}

main().catch(console.error);
