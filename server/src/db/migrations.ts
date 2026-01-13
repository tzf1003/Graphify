import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, testConnection, closePool } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 迁移文件目录
const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

/**
 * 迁移记录接口
 */
interface MigrationRecord {
  id: number;
  filename: string;
  executed_at: Date;
}

/**
 * 确保 schema_migrations 表存在
 */
async function ensureMigrationsTable(): Promise<void> {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await query(createTableSQL);
}

/**
 * 获取已执行的迁移列表
 * @returns 已执行的迁移文件名列表
 */
async function getExecutedMigrations(): Promise<string[]> {
  const result = await query<MigrationRecord>(
    'SELECT filename FROM schema_migrations ORDER BY filename ASC'
  );
  return result.rows.map((row: MigrationRecord) => row.filename);
}

/**
 * 记录迁移执行
 * @param filename 迁移文件名
 */
async function recordMigration(filename: string): Promise<void> {
  await query(
    'INSERT INTO schema_migrations (filename) VALUES ($1)',
    [filename]
  );
}

/**
 * 获取待执行的迁移文件列表
 * @returns 待执行的迁移文件名列表（已排序）
 */
async function getPendingMigrations(): Promise<string[]> {
  // 确保迁移目录存在
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    return [];
  }

  // 读取所有 .sql 文件
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((file: string) => file.endsWith('.sql'))
    .sort();

  // 获取已执行的迁移
  const executed = await getExecutedMigrations();

  // 返回未执行的迁移
  return files.filter((file: string) => !executed.includes(file));
}

/**
 * 执行单个迁移文件
 * @param filename 迁移文件名
 */
async function executeMigration(filename: string): Promise<void> {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filePath, 'utf-8');

  console.log(`Executing migration: ${filename}`);

  try {
    await query(sql);
    await recordMigration(filename);
    console.log(`Migration completed: ${filename}`);
  } catch (error) {
    console.error(`Migration failed: ${filename}`, error);
    throw error;
  }
}

/**
 * 执行所有待执行的迁移
 * @returns 执行的迁移数量
 */
export async function runMigrations(): Promise<number> {
  // 确保迁移表存在
  await ensureMigrationsTable();

  // 获取待执行的迁移
  const pending = await getPendingMigrations();

  if (pending.length === 0) {
    console.log('No pending migrations.');
    return 0;
  }

  console.log(`Found ${pending.length} pending migration(s).`);

  // 按顺序执行迁移
  for (const filename of pending) {
    await executeMigration(filename);
  }

  console.log(`Successfully executed ${pending.length} migration(s).`);
  return pending.length;
}

/**
 * 获取迁移状态
 * @returns 迁移状态信息
 */
export async function getMigrationStatus(): Promise<{
  executed: string[];
  pending: string[];
}> {
  await ensureMigrationsTable();
  const executed = await getExecutedMigrations();
  const pending = await getPendingMigrations();
  return { executed, pending };
}

// 如果直接运行此文件，执行迁移
const isMainModule = process.argv[1]?.includes('migrations');
if (isMainModule) {
  (async () => {
    try {
      // 测试数据库连接
      const connected = await testConnection();
      if (!connected) {
        console.error('Failed to connect to database');
        process.exit(1);
      }

      // 执行迁移
      const count = await runMigrations();
      console.log(`Migration complete. ${count} migration(s) executed.`);
    } catch (error) {
      console.error('Migration error:', error);
      process.exit(1);
    } finally {
      await closePool();
    }
  })();
}
