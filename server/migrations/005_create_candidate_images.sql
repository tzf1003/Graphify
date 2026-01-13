-- 005_create_candidate_images.sql
-- 创建候选图表

CREATE TABLE IF NOT EXISTS candidate_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES generation_jobs(id) ON DELETE CASCADE,
    image_asset_id UUID NOT NULL REFERENCES image_assets(id) ON DELETE CASCADE,
    index_num INTEGER NOT NULL CHECK (index_num >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (job_id, index_num)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_candidate_images_job_id ON candidate_images(job_id);
CREATE INDEX IF NOT EXISTS idx_candidate_images_job_index ON candidate_images(job_id, index_num);

COMMENT ON TABLE candidate_images IS '候选图表，存储生成任务产生的候选图片';
COMMENT ON COLUMN candidate_images.id IS '候选图唯一标识';
COMMENT ON COLUMN candidate_images.job_id IS '所属生成任务 ID';
COMMENT ON COLUMN candidate_images.image_asset_id IS '关联的图片资源 ID';
COMMENT ON COLUMN candidate_images.index_num IS '候选图序号（从 0 开始）';
COMMENT ON COLUMN candidate_images.created_at IS '创建时间';
