# Implementation Plan: Image Editor JSON-Driven

## Overview

本实现计划将设计文档转化为可执行的编码任务。采用增量开发方式，从基础设施开始，逐步构建完整功能。技术栈：Vue 3 + Vite + TypeScript（前端）、Fastify + TypeScript（后端）、PostgreSQL（数据库）。

## Tasks

- [x] 1. 项目初始化与基础设施
  - [x] 1.1 创建项目根目录结构和配置文件
    - 创建 monorepo 结构：/server、/client、/docker
    - 配置根目录 package.json 和 scripts
    - 创建 docker-compose.yml 启动 PostgreSQL
    - 创建 .env.example 和 .gitignore
    - _Requirements: 12.1, 12.5_

  - [x] 1.2 初始化后端项目
    - 创建 /server 目录结构（routes/controllers/services/db/providers/storage）
    - 配置 TypeScript、ESLint、tsconfig.json
    - 安装依赖：fastify、@fastify/multipart、@fastify/static、pg、uuid
    - 创建入口文件 src/index.ts
    - _Requirements: 12.2_

  - [x] 1.3 初始化前端项目
    - 使用 Vite 创建 Vue 3 + TypeScript 项目
    - 安装依赖：pinia、vue-router、monaco-editor
    - 配置 vite.config.ts 代理后端 API
    - _Requirements: 12.3_

- [x] 2. 数据库层实现
  - [x] 2.1 实现数据库连接和迁移系统
    - 创建 /server/src/db/index.ts 封装 pg 连接池和 query 方法
    - 创建 /server/src/db/migrations.ts 实现迁移执行逻辑
    - 创建 schema_migrations 表记录已执行迁移
    - _Requirements: 9.3, 9.4, 9.5_

  - [x] 2.2 创建数据库迁移文件
    - 创建 001_create_image_assets.sql
    - 创建 002_create_projects.sql
    - 创建 003_create_versions.sql
    - 创建 004_create_generation_jobs.sql
    - 创建 005_create_candidate_images.sql
    - _Requirements: 9.2_

  - [ ]* 2.3 编写迁移执行属性测试
    - **Property 15: 迁移执行记录**
    - **Validates: Requirements 9.4**

- [x] 3. 存储服务实现
  - [x] 3.1 实现 StorageProvider 接口和 LocalStorageProvider
    - 创建 /server/src/storage/interface.ts 定义接口
    - 创建 /server/src/storage/local.ts 实现本地存储
    - 确保文件名使用 UUID 生成
    - 创建 ./data/uploads 目录
    - _Requirements: 7.1, 7.2, 7.4_

  - [x] 3.2 创建 OSSStorageProvider 空壳
    - 创建 /server/src/storage/oss.ts 预留 OSS 实现
    - 添加 TODO 注释说明扩展方式
    - _Requirements: 7.3_

  - [ ]* 3.3 编写存储服务属性测试
    - **Property 2: 文件名 UUID 安全性**
    - **Validates: Requirements 1.2, 7.4**

- [x] 4. AI 模型适配器实现
  - [x] 4.1 实现 GeminiExtractor 接口和 Mock 实现
    - 创建 /server/src/providers/gemini/interface.ts 定义接口
    - 创建 /server/src/providers/gemini/mock.ts 返回固定 JSON
    - 创建 /server/src/providers/gemini/real.ts 预留真实实现
    - Mock 返回的 JSON 必须符合 CanonicalJSON schema
    - _Requirements: 8.1, 8.3_

  - [x] 4.2 实现 NanoBananaEditor 接口和 Mock 实现
    - 创建 /server/src/providers/nanoBanana/interface.ts 定义接口
    - 创建 /server/src/providers/nanoBanana/mock.ts 复制原图生成候选图
    - 创建 /server/src/providers/nanoBanana/real.ts 预留真实实现
    - _Requirements: 8.2, 8.4_

  - [ ]* 4.3 编写 Mock Provider 属性测试
    - **Property 13: Mock Provider JSON 合规性**
    - **Property 14: Mock Provider 候选图数量**
    - **Validates: Requirements 8.3, 8.4**

- [x] 5. 核心类型和验证器
  - [x] 5.1 定义 TypeScript 类型
    - 创建 /server/src/types/index.ts 定义所有实体类型
    - 定义 CanonicalJSON 类型
    - 定义 VersionType、JobStatus 枚举
    - _Requirements: 2.3, 2.5_

  - [x] 5.2 实现 JSON Schema 验证器
    - 创建 /server/src/utils/validator.ts
    - 实现 validateCanonicalJSON 函数
    - 实现 validateUploadFile 函数（大小、类型检查）
    - _Requirements: 3.1, 1.4, 1.5_

  - [ ]* 5.3 编写 JSON Schema 验证属性测试
    - **Property 4: JSON Schema 合规性**
    - **Validates: Requirements 2.3, 2.5**

- [x] 6. Docker 中间件启动与验证
  - [x] 6.1 启动 Docker 中间件
    - 执行 docker-compose up -d 启动 PostgreSQL
    - 等待 PostgreSQL 健康检查通过
    - 验证数据库连接可用
    - _Requirements: 12.1_

  - [x] 6.2 执行数据库迁移
    - 运行迁移脚本初始化数据库表结构
    - 验证所有表创建成功
    - 验证 schema_migrations 表记录正确
    - _Requirements: 9.3, 9.4_

- [x] 7. Checkpoint - 基础设施验证
  - 确保 Docker 容器正常运行
  - 确保数据库迁移正常执行
  - 确保存储服务可以保存和读取文件
  - 确保 Mock Provider 返回正确格式数据
  - 如有问题请向用户询问

- [x] 8. 项目服务层实现
  - [x] 8.1 实现 ProjectService
    - 创建 /server/src/services/projectService.ts
    - 实现 createProject、getProject、updateProject 方法
    - 实现 uploadAndInitialize 方法（上传 + 创建项目 + 提取 JSON）
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.4_

  - [x] 8.2 实现 VersionService
    - 创建 /server/src/services/versionService.ts
    - 实现 createVersion、getVersions、getVersion 方法
    - 实现 createJsonEditVersion 方法
    - 实现 createCheckoutVersion 方法
    - 实现 createSelectedCandidateVersion 方法
    - _Requirements: 3.3, 3.4, 4.7, 4.8, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 8.3 编写版本服务属性测试
    - **Property 5: JSON 编辑版本继承**
    - **Property 9: Checkout 版本复制**
    - **Property 10: 版本历史不可变性**
    - **Property 11: 版本列表排序**
    - **Validates: Requirements 3.3, 3.4, 5.2, 5.3, 5.4, 5.5**

- [-] 9. 生成任务服务层实现
  - [x] 9.1 实现 GenerationService
    - 创建 /server/src/services/generationService.ts
    - 实现 createJob 方法（创建 queued 状态任务）
    - 实现 executeJob 方法（调用 NanoBananaEditor）
    - 实现 getJob 方法（查询任务状态）
    - 实现 selectCandidate 方法（选择候选图）
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 9.2 编写生成服务属性测试
    - **Property 6: 生成任务状态机**
    - **Property 7: 候选图数量一致性**
    - **Property 8: 候选图选择版本创建**
    - **Validates: Requirements 4.1, 4.4, 4.5, 4.6, 4.7, 4.8**

- [x] 10. 后端 API 路由实现
  - [x] 10.1 实现项目相关路由
    - 创建 /server/src/routes/projects.ts
    - POST /api/projects/upload - 上传图片创建项目
    - GET /api/projects/:id - 获取项目详情
    - PATCH /api/projects/:id - 更新项目设置
    - GET /api/projects/:id/versions - 获取版本列表
    - POST /api/projects/:id/versions - 创建新版本
    - POST /api/projects/:id/generate - 创建生成任务
    - POST /api/projects/:id/select - 选定候选图
    - _Requirements: 1.1, 2.4, 3.3, 4.1, 4.7, 5.2_

  - [x] 10.2 实现生成任务路由
    - 创建 /server/src/routes/generations.ts
    - GET /api/generations/:id - 查询任务状态
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 10.3 实现控制器层
    - 创建 /server/src/controllers/projectController.ts
    - 创建 /server/src/controllers/generationController.ts
    - 实现请求验证和错误处理
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 10.4 编写 API 属性测试
    - **Property 1: 图片上传创建完整项目结构**
    - **Property 3: 项目默认语言设置**
    - **Property 12: 任务查询响应完整性**
    - **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 6.2, 6.3**

- [x] 11. 后端静态文件服务和错误处理
  - [x] 11.1 配置静态文件服务
    - 使用 @fastify/static 提供 /uploads/ 路径访问
    - 配置 CORS 允许前端访问
    - _Requirements: 7.5_

  - [x] 11.2 实现全局错误处理
    - 创建 /server/src/utils/errors.ts 定义错误类
    - 配置 Fastify 错误处理中间件
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 12. Checkpoint - 后端 API 验证
  - 使用 curl 或 Postman 测试所有 API 端点
  - 验证上传、版本创建、生成任务流程
  - 确保错误处理正确返回
  - 如有问题请向用户询问

- [x] 13. 前端状态管理
  - [x] 13.1 实现 API 客户端
    - 创建 /client/src/api/index.ts
    - 封装所有后端 API 调用
    - 实现错误处理和响应转换
    - _Requirements: 10.1_

  - [x] 13.2 实现 Project Store
    - 创建 /client/src/stores/project.ts
    - 管理当前项目、版本列表、当前版本状态
    - 实现 fetchProject、updateProject、createVersion 等 actions
    - _Requirements: 10.2_

  - [x] 13.3 实现 Generation Store
    - 创建 /client/src/stores/generation.ts
    - 管理生成任务状态、候选图列表
    - 实现轮询任务状态逻辑
    - _Requirements: 6.4, 6.5_

- [x] 14. 前端路由和布局
  - [x] 14.1 配置 Vue Router
    - 创建 /client/src/router/index.ts
    - 配置 / 首页路由
    - 配置 /p/:id 项目编辑页路由
    - _Requirements: 10.1, 10.2_

  - [x] 14.2 实现通用组件
    - 创建 AppHeader.vue 顶部导航
    - 创建 LoadingSpinner.vue 加载状态
    - 创建 App.vue 主布局
    - _Requirements: 10.1_

- [x] 15. 前端首页实现
  - [x] 15.1 实现项目列表页
    - 创建 /client/src/views/HomeView.vue
    - 创建 /client/src/components/home/ProjectList.vue
    - 显示项目列表（名称、缩略图、创建时间）
    - 实现上传新图片创建项目功能
    - _Requirements: 10.1_

- [-] 16. 前端项目编辑页实现
  - [x] 16.1 实现版本列表组件
    - 创建 /client/src/components/project/VersionList.vue
    - 显示版本时间线（时间、类型、缩略图）
    - 实现 Checkout 按钮功能
    - _Requirements: 10.2, 5.1_

  - [x] 16.2 实现图片预览组件
    - 创建 /client/src/components/project/ImagePreview.vue
    - 显示当前版本图片
    - 支持图片缩放查看
    - _Requirements: 10.2_

  - [x] 16.3 实现 JSON 编辑器组件
    - 创建 /client/src/components/project/JsonEditor.vue
    - 集成 Monaco Editor
    - 实现语法高亮和错误提示
    - 实现保存按钮（创建 json_edit 版本）
    - _Requirements: 10.3, 3.6_

  - [x] 16.4 实现生成设置面板
    - 创建 /client/src/components/project/GeneratePanel.vue
    - 实现 count（1-8）、seed、strength 配置
    - 实现生成按钮
    - 显示生成进度状态
    - _Requirements: 10.3, 4.2_

  - [x] 16.5 实现候选图网格组件
    - 创建 /client/src/components/project/CandidateGrid.vue
    - 显示候选图缩略图网格
    - 实现点击选择高亮
    - 实现确认选择按钮
    - _Requirements: 10.4, 10.5_

  - [x] 16.6 组装项目编辑页
    - 创建 /client/src/views/ProjectView.vue
    - 布局：左侧版本列表、中间图片预览、右侧编辑器和生成面板
    - 连接所有子组件和 Store
    - _Requirements: 10.2, 10.3, 10.4_

- [x] 17. 前端类型定义
  - [x] 17.1 创建共享类型
    - 创建 /client/src/types/index.ts
    - 定义与后端一致的类型（Project、Version、GenerationJob 等）
    - 定义 API 响应类型
    - _Requirements: 10.1_

- [x] 18. Checkpoint - 前端功能验证
  - 验证首页项目列表显示
  - 验证上传图片创建项目流程
  - 验证 JSON 编辑和保存
  - 验证生成任务和候选图选择
  - 验证版本历史和 Checkout
  - 如有问题请向用户询问

- [x] 19. 文档和配置完善
  - [x] 19.1 编写 README.md
    - 项目介绍和功能说明
    - 环境要求和依赖
    - 从零到运行的完整步骤
    - API 文档链接
    - .env.example 说明
    - _Requirements: 12.4, 12.5_

  - [x] 19.2 完善 .env.example
    - 数据库连接配置
    - 存储路径配置
    - AI Provider 配置（USE_MOCK=true）
    - 端口配置
    - _Requirements: 12.5_

- [x] 20. Final Checkpoint - 完整流程验证
  - 从 docker-compose up 开始
  - 执行 npm run dev 启动后端
  - 执行 npm run dev 启动前端
  - 完整测试：上传 → JSON 编辑 → 生成 → 选择 → Checkout
  - 确保所有功能正常工作
  - 如有问题请向用户询问

## Notes

- 任务标记 `*` 为可选测试任务，可跳过以加快 MVP 开发
- 每个任务引用具体需求以确保可追溯性
- Checkpoint 任务用于阶段性验证，确保增量开发质量
- 属性测试验证核心业务逻辑的正确性
- 单元测试验证具体示例和边界条件
