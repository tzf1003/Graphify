/**
 * 基础设施验证脚本
 * 验证存储服务和 Mock Provider 是否正常工作
 */

import { LocalStorageProvider } from '../server/src/storage/local.js';
import { MockGeminiExtractor } from '../server/src/providers/gemini/mock.js';
import { MockNanoBananaEditor } from '../server/src/providers/nanoBanana/mock.js';
import { validateCanonicalJSON } from '../server/src/utils/validator.js';
import { testConnection, query, closePool } from '../server/src/db/index.js';

async function verifyStorage(): Promise<boolean> {
  console.log('\n=== 验证存储服务 ===');
  
  const storage = new LocalStorageProvider();
  
  // 测试保存文件
  const testData = Buffer.from('test image data');
  const result = await storage.save(testData, 'png', 'image/png');
  
  console.log(`✓ 文件保存成功: ${result.path}`);
  console.log(`  URL: ${result.url}`);
  console.log(`  大小: ${result.size} bytes`);
  
  // 验证文件名是 UUID 格式
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.png$/i;
  if (!uuidRegex.test(result.path)) {
    console.error(`✗ 文件名不是 UUID 格式: ${result.path}`);
    return false;
  }
  console.log('✓ 文件名为 UUID 格式');
  
  // 测试读取文件
  const readData = await storage.read(result.path);
  if (readData.toString() !== testData.toString()) {
    console.error('✗ 读取的文件内容不匹配');
    return false;
  }
  console.log('✓ 文件读取成功，内容匹配');
  
  // 测试删除文件
  await storage.delete(result.path);
  console.log('✓ 文件删除成功');
  
  return true;
}

async function verifyMockGemini(): Promise<boolean> {
  console.log('\n=== 验证 MockGeminiExtractor ===');
  
  const extractor = new MockGeminiExtractor();
  const testImage = Buffer.from('fake image data');
  
  // 测试中文输出
  const resultZh = await extractor.extract(testImage, 'zh-CN');
  console.log('✓ 中文 JSON 提取成功');
  
  // 验证 JSON 结构
  const validation = validateCanonicalJSON(resultZh.json);
  if (!validation.valid) {
    console.error('✗ JSON 不符合 CanonicalJSON schema:', validation.errors);
    return false;
  }
  console.log('✓ JSON 符合 CanonicalJSON schema');
  
  // 验证语言设置
  if (resultZh.json.meta.output_language !== 'zh-CN') {
    console.error('✗ output_language 不正确');
    return false;
  }
  console.log('✓ output_language 设置正确');
  
  // 测试英文输出
  const resultEn = await extractor.extract(testImage, 'en-US');
  if (resultEn.json.meta.output_language !== 'en-US') {
    console.error('✗ 英文 output_language 不正确');
    return false;
  }
  console.log('✓ 英文 JSON 提取成功');
  
  return true;
}

async function verifyMockNanoBanana(): Promise<boolean> {
  console.log('\n=== 验证 MockNanoBananaEditor ===');
  
  const editor = new MockNanoBananaEditor();
  const testImage = Buffer.from('fake image data for generation');
  
  // 创建测试用的 CanonicalJSON
  const mockJson = {
    meta: { schema_version: '1.0.0', output_language: 'zh-CN', width: 1024, height: 768 },
    scene: {
      summary: '测试场景',
      style: { genre: 'test', palette: 'test', rendering: 'test' },
      camera: { shot: 'wide', lens: '24mm', angle: 'eye-level', dof: 'deep' },
      lighting: { type: 'natural', direction: 'front', contrast: 'medium' },
    },
    elements: [],
    relations: [],
    edit_intent: { goal: '测试', negatives: [], safety: { avoid: [] } },
  };
  
  // 测试生成 4 张候选图
  const results = await editor.generate(testImage, mockJson, { count: 4 });
  
  if (results.length !== 4) {
    console.error(`✗ 候选图数量不正确: 期望 4, 实际 ${results.length}`);
    return false;
  }
  console.log('✓ 生成 4 张候选图成功');
  
  // 验证每张图的 index
  for (let i = 0; i < results.length; i++) {
    if (results[i].index !== i) {
      console.error(`✗ 候选图 index 不正确: 期望 ${i}, 实际 ${results[i].index}`);
      return false;
    }
  }
  console.log('✓ 候选图 index 正确');
  
  // 测试边界值
  const results1 = await editor.generate(testImage, mockJson, { count: 1 });
  const results8 = await editor.generate(testImage, mockJson, { count: 8 });
  
  if (results1.length !== 1 || results8.length !== 8) {
    console.error('✗ 边界值测试失败');
    return false;
  }
  console.log('✓ 边界值测试通过 (count=1, count=8)');
  
  // 测试超出范围
  try {
    await editor.generate(testImage, mockJson, { count: 9 });
    console.error('✗ count=9 应该抛出错误');
    return false;
  } catch (e) {
    console.log('✓ count=9 正确抛出错误');
  }
  
  return true;
}

async function verifyDatabase(): Promise<boolean> {
  console.log('\n=== 验证数据库连接 ===');
  
  const connected = await testConnection();
  if (!connected) {
    console.error('✗ 数据库连接失败');
    return false;
  }
  console.log('✓ 数据库连接成功');
  
  // 验证表结构
  const tables = await query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
  );
  
  const expectedTables = ['schema_migrations', 'image_assets', 'projects', 'versions', 'generation_jobs', 'candidate_images'];
  const actualTables = tables.rows.map(r => r.tablename);
  
  for (const table of expectedTables) {
    if (!actualTables.includes(table)) {
      console.error(`✗ 缺少表: ${table}`);
      return false;
    }
  }
  console.log('✓ 所有数据库表存在');
  
  // 验证迁移记录
  const migrations = await query<{ filename: string }>(
    'SELECT filename FROM schema_migrations ORDER BY filename'
  );
  console.log(`✓ 已执行 ${migrations.rows.length} 个迁移`);
  
  return true;
}

async function main() {
  console.log('========================================');
  console.log('       基础设施验证开始');
  console.log('========================================');
  
  let allPassed = true;
  
  try {
    // 验证数据库
    if (!await verifyDatabase()) {
      allPassed = false;
    }
    
    // 验证存储服务
    if (!await verifyStorage()) {
      allPassed = false;
    }
    
    // 验证 Mock Gemini
    if (!await verifyMockGemini()) {
      allPassed = false;
    }
    
    // 验证 Mock NanoBanana
    if (!await verifyMockNanoBanana()) {
      allPassed = false;
    }
    
  } catch (error) {
    console.error('\n✗ 验证过程中发生错误:', error);
    allPassed = false;
  } finally {
    await closePool();
  }
  
  console.log('\n========================================');
  if (allPassed) {
    console.log('       ✓ 所有验证通过！');
  } else {
    console.log('       ✗ 部分验证失败');
  }
  console.log('========================================\n');
  
  process.exit(allPassed ? 0 : 1);
}

main();
