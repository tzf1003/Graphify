-- 002_create_projects.sql
-- 创建项目表

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    output_language VARCHAR(20) NOT NULL DEFAULT 'zh-CN',
    current_version_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

COMMENT ON TABLE projects IS '项目表，存储图片编辑项目信息';
COMMENT ON COLUMN projects.id IS '项目唯一标识';
COMMENT ON COLUMN projects.name IS '项目名称';
COMMENT ON COLUMN projects.output_language IS '输出语言设置，默认 zh-CN';
COMMENT ON COLUMN projects.current_version_id IS '当前选中的版本 ID';
COMMENT ON COLUMN projects.created_at IS '创建时间';
COMMENT ON COLUMN projects.updated_at IS '更新时间';
