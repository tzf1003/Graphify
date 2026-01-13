/**
 * 存储服务接口定义
 * 支持本地文件系统和 OSS 扩展
 */

/**
 * 存储结果
 */
export interface StorageResult {
  /** 存储路径（相对路径） */
  path: string;
  /** 访问 URL */
  url: string;
  /** 文件大小（字节） */
  size: number;
}

/**
 * 存储服务接口
 * 定义统一的存储操作方法，支持不同存储后端实现
 */
export interface StorageProvider {
  /**
   * 保存文件
   * @param buffer 文件内容
   * @param ext 文件扩展名（不含点号，如 'png'）
   * @param mime MIME 类型
   * @returns 存储结果
   */
  save(buffer: Buffer, ext: string, mime: string): Promise<StorageResult>;

  /**
   * 读取文件
   * @param path 文件路径
   * @returns 文件内容
   */
  read(path: string): Promise<Buffer>;

  /**
   * 获取文件访问 URL
   * @param path 文件路径
   * @returns 访问 URL
   */
  getUrl(path: string): string;

  /**
   * 删除文件
   * @param path 文件路径
   */
  delete(path: string): Promise<void>;
}
