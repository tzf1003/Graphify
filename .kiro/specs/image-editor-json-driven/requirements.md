# Requirements Document

## Introduction

本文档定义了一个"在线图片编辑器（JSON 驱动二次生成）"系统的需求规范。该系统允许用户上传图片，通过 AI 模型提取图片的结构化 JSON 描述，编辑 JSON 后调用图片生成模型产生候选图，并支持完整的版本历史管理。

## Glossary

- **Project**: 一个图片编辑项目，包含当前选中的图片版本、JSON 描述和语言设置
- **Version**: 项目的一个历史版本快照，包含图片资源引用和 JSON 内容
- **ImageAsset**: 存储在系统中的图片资源，包含文件路径、尺寸等元数据
- **GenerationJob**: 图片生成任务，记录生成状态和候选图结果
- **CandidateImage**: 生成任务产生的候选图片
- **GeminiExtractor**: AI 模型适配器，负责从图片提取结构化 JSON
- **NanoBananaEditor**: AI 模型适配器，负责根据 JSON 生成候选图片
- **StorageProvider**: 存储服务接口，支持本地文件系统和 OSS 扩展
- **CanonicalJSON**: 系统定义的标准 JSON Schema，包含 meta、scene、elements、relations、edit_intent

## Requirements

### Requirement 1: 项目创建与图片上传

**User Story:** As a 用户, I want to 上传图片并自动创建项目, so that 我可以开始编辑图片的 JSON 描述。

#### Acceptance Criteria

1. WHEN 用户上传一张图片（png/jpg/webp）THEN THE System SHALL 创建新的 Project 和初始 Version（version_type="imported"）
2. WHEN 用户上传图片 THEN THE System SHALL 将图片保存到本地存储并生成唯一文件名（UUID）
3. WHEN 图片保存成功 THEN THE System SHALL 调用 GeminiExtractor 提取 JSON 并存储到 Version
4. WHEN 用户上传超过 10MB 的文件 THEN THE System SHALL 返回 400 错误并提示文件过大
5. WHEN 用户上传非图片格式文件 THEN THE System SHALL 返回 400 错误并提示格式不支持
6. WHEN GeminiExtractor 调用失败 THEN THE System SHALL 返回错误信息但保留已创建的 Project

### Requirement 2: JSON 提取与语言设置

**User Story:** As a 用户, I want to 设置输出语言并获取对应语言的 JSON 描述, so that JSON 中的文本内容使用我熟悉的语言。

#### Acceptance Criteria

1. THE Project SHALL 包含 output_language 字段，默认值为 "zh-CN"
2. WHEN 调用 GeminiExtractor THEN THE System SHALL 传递 output_language 参数
3. WHEN GeminiExtractor 返回 JSON THEN THE JSON 的 key 必须为英文，value 中的自然语言文本使用 output_language 指定的语言
4. WHEN 用户更新 Project 的 output_language THEN THE System SHALL 保存新设置
5. THE CanonicalJSON SHALL 包含 meta.output_language 字段记录当前语言设置

### Requirement 3: JSON 编辑与版本创建

**User Story:** As a 用户, I want to 编辑 JSON 内容并保存为新版本, so that 我可以修改图片描述而不丢失历史记录。

#### Acceptance Criteria

1. WHEN 用户提交编辑后的 JSON THEN THE System SHALL 验证 JSON 格式合法性
2. WHEN JSON 格式不合法 THEN THE System SHALL 返回 400 错误并提示具体错误位置
3. WHEN JSON 验证通过 THEN THE System SHALL 创建新 Version（version_type="json_edit"）
4. THE 新 Version SHALL 继承当前版本的 image_asset_id
5. WHEN JSON 内容超过 1MB THEN THE System SHALL 返回 400 错误
6. THE System SHALL 支持 Monaco Editor 进行 JSON 编辑

### Requirement 4: 图片生成与候选图管理

**User Story:** As a 用户, I want to 根据 JSON 生成多张候选图并选择一张, so that 我可以获得符合描述的新图片。

#### Acceptance Criteria

1. WHEN 用户点击生成 THEN THE System SHALL 创建 GenerationJob（状态为 queued）
2. THE GenerationJob SHALL 支持配置 count（1-8，默认 4）、seed（可选）、strength（0-1，可选）
3. WHEN count 超出 1-8 范围 THEN THE System SHALL 返回 400 错误
4. WHEN GenerationJob 开始执行 THEN THE System SHALL 更新状态为 running
5. WHEN NanoBananaEditor 返回候选图 THEN THE System SHALL 保存所有候选图到存储并更新 GenerationJob 状态为 succeeded
6. WHEN NanoBananaEditor 调用失败 THEN THE System SHALL 更新 GenerationJob 状态为 failed 并记录错误信息
7. WHEN 用户选择一张候选图 THEN THE System SHALL 创建新 Version（version_type="selected_candidate"）
8. THE 新 Version SHALL 引用选中的候选图作为 image_asset_id，并保存当时的 JSON 快照

### Requirement 5: 版本历史与回溯

**User Story:** As a 用户, I want to 查看版本历史并回溯到任意版本, so that 我可以恢复之前的工作状态。

#### Acceptance Criteria

1. THE System SHALL 显示项目的所有版本列表，包含时间、类型、缩略图
2. WHEN 用户点击 Checkout 某个历史版本 THEN THE System SHALL 创建新 Version（version_type="checkout"）
3. THE checkout 版本 SHALL 复制被选版本的 image_asset_id 和 json_content
4. THE System SHALL 保留所有历史版本，不覆盖或删除
5. THE 版本列表 SHALL 按创建时间倒序排列

### Requirement 6: 任务状态查询

**User Story:** As a 用户, I want to 查询生成任务的状态, so that 我知道任务是否完成以及结果如何。

#### Acceptance Criteria

1. THE System SHALL 提供 GET /api/generations/:id 接口查询任务状态
2. THE 响应 SHALL 包含 status（queued/running/succeeded/failed）、候选图列表、错误信息
3. WHEN 任务状态为 succeeded THEN THE 响应 SHALL 包含所有候选图的 URL 和元数据
4. THE 前端 SHALL 轮询任务状态直到完成
5. WHEN 任务进行中 THEN THE 前端 SHALL 显示加载状态

### Requirement 7: 存储服务抽象

**User Story:** As a 开发者, I want to 使用抽象的存储接口, so that 未来可以轻松切换到 OSS 存储。

#### Acceptance Criteria

1. THE StorageProvider 接口 SHALL 定义 save(buffer, ext, mime) 和 read(path) 方法
2. THE LocalStorageProvider SHALL 实现 StorageProvider 接口，存储到 ./data/uploads
3. THE System SHALL 预留 OSSStorageProvider 空壳实现
4. THE 所有文件名 SHALL 使用 UUID 重新生成，防止路径穿越攻击
5. THE 静态文件 SHALL 通过 /uploads/ 路径访问

### Requirement 8: AI 模型适配器抽象

**User Story:** As a 开发者, I want to 使用抽象的模型适配器, so that 可以轻松切换不同的 AI 模型实现。

#### Acceptance Criteria

1. THE GeminiExtractor 接口 SHALL 定义 extract(imageBuffer, outputLanguage) 方法
2. THE NanoBananaEditor 接口 SHALL 定义 generate(baseImage, jsonContent, options) 方法
3. THE System SHALL 提供 MockGeminiExtractor 返回固定结构的 JSON
4. THE System SHALL 提供 MockNanoBananaEditor 复制原图生成候选图
5. THE Mock 实现 SHALL 允许用户无需 API Key 即可体验完整流程

### Requirement 9: 数据库与迁移

**User Story:** As a 开发者, I want to 使用 SQL 迁移管理数据库结构, so that 数据库变更可追踪和版本化。

#### Acceptance Criteria

1. THE System SHALL 使用 PostgreSQL 数据库
2. THE 迁移文件 SHALL 存放在 /server/migrations/*.sql
3. THE System SHALL 在启动时自动执行未应用的迁移
4. THE System SHALL 使用 schema_migrations 表记录已执行的迁移
5. THE 数据库访问 SHALL 封装在 db.ts 中，提供 query() 方法

### Requirement 10: 前端界面

**User Story:** As a 用户, I want to 通过直观的界面操作项目, so that 我可以方便地编辑和生成图片。

#### Acceptance Criteria

1. THE 首页 SHALL 显示项目列表
2. THE 项目编辑页 SHALL 包含左侧版本列表、中间图片预览、右侧 JSON 编辑器
3. THE 项目编辑页 SHALL 包含生成设置面板（count/seed/strength）
4. THE 项目编辑页 SHALL 显示候选图网格供用户选择
5. WHEN 用户选择候选图 THEN THE System SHALL 高亮显示并提供确认按钮
6. THE JSON 编辑器 SHALL 提供语法高亮和错误提示

### Requirement 11: 错误处理

**User Story:** As a 用户, I want to 看到清晰的错误提示, so that 我知道操作失败的原因。

#### Acceptance Criteria

1. WHEN 上传文件大小超限 THEN THE System SHALL 返回 "文件大小超过 10MB 限制"
2. WHEN 上传文件格式不支持 THEN THE System SHALL 返回 "仅支持 png/jpg/webp 格式"
3. WHEN JSON 格式错误 THEN THE System SHALL 返回具体的解析错误信息
4. WHEN 生成任务失败 THEN THE System SHALL 返回模型调用的错误详情
5. THE 所有 API 错误响应 SHALL 使用统一格式 { error: string, details?: any }

### Requirement 12: 本地开发环境

**User Story:** As a 开发者, I want to 一键启动本地开发环境, so that 我可以快速开始开发和测试。

#### Acceptance Criteria

1. THE docker-compose.yml SHALL 启动 PostgreSQL 服务
2. THE 后端 SHALL 通过 npm run dev 启动
3. THE 前端 SHALL 通过 npm run dev 启动
4. THE README SHALL 包含从零到运行的完整步骤
5. THE .env.example SHALL 包含所有必需的环境变量
