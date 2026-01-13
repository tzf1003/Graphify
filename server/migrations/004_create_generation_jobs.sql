-- 004_create_generation_jobs.sql
-- 创建生成任务表

-- 创建任务状态枚举
DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('queued', 'running', 'succeeded', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_version_id UUID NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
    status job_status NOT NULL DEFAULT 'queued',
    count INTEGER NOT NULL DEFAULT 4 CHECK (count >= 1 AND count <= 8),
    strength FLOAT CHECK (strength IS NULL OR (strength >= 0 AND strength <= 1)),
    seed INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_generation_jobs_project_id ON generation_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_created_at ON generation_jobs(created_at DESC);

COMMENT ON TABLE generation_jobs IS '生成任务表，记录图片生成任务状态';
COMMENT ON COLUMN generation_jobs.id IS '任务唯一标识';
COMMENT ON COLUMN generation_jobs.project_id IS '所属项目 ID';
COMMENT ON COLUMN generation_jobs.source_version_id IS '源版本 ID（生成基于的版本）';
COMMENT ON COLUMN generation_jobs.status IS '任务状态：queued/running/succeeded/failed';
COMMENT ON COLUMN generation_jobs.count IS '请求生成的候选图数量（1-8）';
COMMENT ON COLUMN generation_jobs.strength IS '生成强度（0-1）';
COMMENT ON COLUMN generation_jobs.seed IS '随机种子';
COMMENT ON COLUMN generation_jobs.error_message IS '错误信息（失败时记录）';
COMMENT ON COLUMN generation_jobs.created_at IS '创建时间';
COMMENT ON COLUMN generation_jobs.updated_at IS '更新时间';
