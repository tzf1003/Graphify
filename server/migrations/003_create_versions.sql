-- 003_create_versions.sql
-- 创建版本表

-- 创建版本类型枚举
DO $$ BEGIN
    CREATE TYPE version_type AS ENUM ('imported', 'json_edit', 'selected_candidate', 'checkout');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_type version_type NOT NULL,
    image_asset_id UUID REFERENCES image_assets(id) ON DELETE SET NULL,
    json_content JSONB,
    parent_version_id UUID REFERENCES versions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 添加 projects 表的外键约束（延迟添加以避免循环依赖）
ALTER TABLE projects 
    ADD CONSTRAINT fk_projects_current_version 
    FOREIGN KEY (current_version_id) 
    REFERENCES versions(id) 
    ON DELETE SET NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_versions_project_id ON versions(project_id);
CREATE INDEX IF NOT EXISTS idx_versions_created_at ON versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_versions_project_created ON versions(project_id, created_at DESC);

COMMENT ON TABLE versions IS '版本表，存储项目的历史版本快照';
COMMENT ON COLUMN versions.id IS '版本唯一标识';
COMMENT ON COLUMN versions.project_id IS '所属项目 ID';
COMMENT ON COLUMN versions.version_type IS '版本类型：imported/json_edit/selected_candidate/checkout';
COMMENT ON COLUMN versions.image_asset_id IS '关联的图片资源 ID';
COMMENT ON COLUMN versions.json_content IS 'JSON 描述内容';
COMMENT ON COLUMN versions.parent_version_id IS '父版本 ID（用于版本追溯）';
COMMENT ON COLUMN versions.created_at IS '创建时间';
