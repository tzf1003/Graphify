/**
 * 本地文件系统存储实现
 */

import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { StorageProvider, StorageResult } from './interface';

/**
 * 本地存储配置
 */
export interface LocalStorageConfig {
  /** 存储根目录（相对于项目根目录） */
  uploadDir: string;
  /** URL 前缀 */
  urlPrefix: string;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: LocalStorageConfig = {
  uploadDir: './data/uploads',
  urlPrefix: '/uploads',
};

/**
 * 本地文件系统存储提供者
 * 实现 StorageProvider 接口，将文件存储到本地文件系统
 */
export class LocalStorageProvider implements StorageProvider {
  private readonly config: LocalStorageConfig;
  private initialized = false;

  constructor(config: Partial<LocalStorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 确保上传目录存在
   */
  private async ensureDir(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await fs.mkdir(this.config.uploadDir, { recursive: true });
      this.initialized = true;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'EEXIST') {
        throw new Error(`无法创建上传目录: ${err.message}`);
      }
      this.initialized = true;
    }
  }

  /**
   * 生成安全的文件路径
   * 使用 UUID 作为文件名，防止路径穿越攻击
   */
  private generateFilePath(ext: string): string {
    const uuid = uuidv4();
    const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `${uuid}.${safeExt}`;
  }

  /**
   * 获取完整的文件系统路径
   */
  private getFullPath(relativePath: string): string {
    // 防止路径穿越：只取文件名部分
    const filename = path.basename(relativePath);
    return path.join(this.config.uploadDir, filename);
  }

  /**
   * 保存文件到本地存储
   */
  async save(buffer: Buffer, ext: string, _mime: string): Promise<StorageResult> {
    await this.ensureDir();

    const relativePath = this.generateFilePath(ext);
    const fullPath = this.getFullPath(relativePath);

    await fs.writeFile(fullPath, buffer);

    return {
      path: relativePath,
      url: this.getUrl(relativePath),
      size: buffer.length,
    };
  }

  /**
   * 读取文件内容
   */
  async read(filePath: string): Promise<Buffer> {
    const fullPath = this.getFullPath(filePath);
    
    try {
      return await fs.readFile(fullPath);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        throw new Error(`文件不存在: ${filePath}`);
      }
      throw new Error(`读取文件失败: ${err.message}`);
    }
  }

  /**
   * 获取文件访问 URL
   */
  getUrl(filePath: string): string {
    const filename = path.basename(filePath);
    return `${this.config.urlPrefix}/${filename}`;
  }

  /**
   * 删除文件
   */
  async delete(filePath: string): Promise<void> {
    const fullPath = this.getFullPath(filePath);
    
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        // 文件不存在，视为删除成功
        return;
      }
      throw new Error(`删除文件失败: ${err.message}`);
    }
  }
}
