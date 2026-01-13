/**
 * OSS 对象存储实现（空壳）
 * 
 * TODO: 扩展说明
 * 1. 安装 OSS SDK：npm install ali-oss 或其他云厂商 SDK
 * 2. 配置环境变量：
 *    - OSS_ACCESS_KEY_ID: 访问密钥 ID
 *    - OSS_ACCESS_KEY_SECRET: 访问密钥
 *    - OSS_BUCKET: 存储桶名称
 *    - OSS_REGION: 区域
 *    - OSS_ENDPOINT: 端点地址（可选）
 * 3. 实现各方法的具体逻辑
 */

import { v4 as uuidv4 } from 'uuid';
import { StorageProvider, StorageResult } from './interface';

/**
 * OSS 存储配置
 */
export interface OSSStorageConfig {
  /** 访问密钥 ID */
  accessKeyId: string;
  /** 访问密钥 */
  accessKeySecret: string;
  /** 存储桶名称 */
  bucket: string;
  /** 区域 */
  region: string;
  /** 端点地址（可选） */
  endpoint?: string;
  /** URL 前缀（CDN 或自定义域名） */
  urlPrefix?: string;
}

/**
 * OSS 对象存储提供者
 * 
 * TODO: 实现步骤
 * 1. 在构造函数中初始化 OSS 客户端
 * 2. 实现 save 方法：使用 client.put() 上传文件
 * 3. 实现 read 方法：使用 client.get() 下载文件
 * 4. 实现 getUrl 方法：生成签名 URL 或公开 URL
 * 5. 实现 delete 方法：使用 client.delete() 删除文件
 */
export class OSSStorageProvider implements StorageProvider {
  private readonly config: OSSStorageConfig;
  // TODO: 添加 OSS 客户端实例
  // private client: OSS;

  constructor(config: OSSStorageConfig) {
    this.config = config;
    // TODO: 初始化 OSS 客户端
    // this.client = new OSS({
    //   accessKeyId: config.accessKeyId,
    //   accessKeySecret: config.accessKeySecret,
    //   bucket: config.bucket,
    //   region: config.region,
    //   endpoint: config.endpoint,
    // });
  }

  /**
   * 生成安全的文件路径
   * 使用 UUID 作为文件名，防止路径穿越攻击
   */
  private generateFilePath(ext: string): string {
    const uuid = uuidv4();
    const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    // 可以添加日期前缀便于管理：如 2024/01/15/uuid.ext
    const date = new Date();
    const prefix = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    return `${prefix}/${uuid}.${safeExt}`;
  }

  /**
   * 保存文件到 OSS
   * 
   * TODO: 实现逻辑
   * const result = await this.client.put(path, buffer, {
   *   mime: mime,
   *   headers: { 'Content-Type': mime }
   * });
   */
  async save(buffer: Buffer, ext: string, mime: string): Promise<StorageResult> {
    const filePath = this.generateFilePath(ext);
    
    // TODO: 实现 OSS 上传
    // const result = await this.client.put(filePath, buffer, {
    //   mime: mime,
    //   headers: { 'Content-Type': mime }
    // });

    throw new Error('OSSStorageProvider.save() 尚未实现，请参考 TODO 注释完成实现');

    // return {
    //   path: filePath,
    //   url: this.getUrl(filePath),
    //   size: buffer.length,
    // };
  }

  /**
   * 从 OSS 读取文件
   * 
   * TODO: 实现逻辑
   * const result = await this.client.get(path);
   * return result.content;
   */
  async read(filePath: string): Promise<Buffer> {
    // TODO: 实现 OSS 下载
    // const result = await this.client.get(filePath);
    // return result.content as Buffer;

    throw new Error('OSSStorageProvider.read() 尚未实现，请参考 TODO 注释完成实现');
  }

  /**
   * 获取文件访问 URL
   * 
   * TODO: 实现逻辑
   * - 公开读取：直接拼接 URL
   * - 私有读取：使用 client.signatureUrl() 生成签名 URL
   */
  getUrl(filePath: string): string {
    // 如果配置了自定义 URL 前缀（如 CDN）
    if (this.config.urlPrefix) {
      return `${this.config.urlPrefix}/${filePath}`;
    }
    
    // 默认 OSS URL 格式
    return `https://${this.config.bucket}.${this.config.region}.aliyuncs.com/${filePath}`;
  }

  /**
   * 从 OSS 删除文件
   * 
   * TODO: 实现逻辑
   * await this.client.delete(path);
   */
  async delete(filePath: string): Promise<void> {
    // TODO: 实现 OSS 删除
    // await this.client.delete(filePath);

    throw new Error('OSSStorageProvider.delete() 尚未实现，请参考 TODO 注释完成实现');
  }
}
