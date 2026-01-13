import pg from 'pg';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载 .env 文件（支持从 server 目录或项目根目录运行）
config({ path: path.resolve(__dirname, '../../.env') });
config({ path: path.resolve(__dirname, '../../../.env') });

const { Pool } = pg;

// 数据库连接配置
const poolConfig: pg.PoolConfig = {
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'image_editor',
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000, // 空闲连接超时
  connectionTimeoutMillis: 5000, // 连接超时
};

// 创建连接池
const pool = new Pool(poolConfig);

// 连接池错误处理
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

/**
 * 执行 SQL 查询
 * @param text SQL 语句
 * @param params 参数数组
 * @returns 查询结果
 */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text: text.substring(0, 100), duration, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    console.error('Database query error', { text: text.substring(0, 100), error });
    throw error;
  }
}

/**
 * 获取数据库客户端（用于事务）
 * @returns 数据库客户端
 */
export async function getClient(): Promise<pg.PoolClient> {
  return pool.connect();
}

/**
 * 执行事务
 * @param callback 事务回调函数
 * @returns 事务执行结果
 */
export async function transaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 测试数据库连接
 * @returns 连接是否成功
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database connection test failed', error);
    return false;
  }
}

/**
 * 关闭连接池
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

export { pool };
