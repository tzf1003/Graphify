-- 001_create_image_assets.sql
-- 创建图片资源表

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS image_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_path VARCHAR(512) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_image_assets_created_at ON image_assets(created_at DESC);

COMMENT ON TABLE image_assets IS '图片资源表，存储所有上传和生成的图片元数据';
COMMENT ON COLUMN image_assets.id IS '图片资源唯一标识';
COMMENT ON COLUMN image_assets.file_path IS '文件存储路径（相对路径）';
COMMENT ON COLUMN image_assets.original_name IS '原始文件名';
COMMENT ON COLUMN image_assets.mime_type IS 'MIME 类型';
COMMENT ON COLUMN image_assets.file_size IS '文件大小（字节）';
COMMENT ON COLUMN image_assets.width IS '图片宽度（像素）';
COMMENT ON COLUMN image_assets.height IS '图片高度（像素）';
COMMENT ON COLUMN image_assets.created_at IS '创建时间';
