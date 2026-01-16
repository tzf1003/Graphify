-- 006_add_generated_version_type.sql
-- 为 version_type 枚举添加 'generated' 值，用于从文字描述生成的项目

ALTER TYPE version_type ADD VALUE IF NOT EXISTS 'generated';

COMMENT ON TYPE version_type IS '版本类型：imported/json_edit/selected_candidate/checkout/generated';
