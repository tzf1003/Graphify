# Image Editor JSON-Driven

基于 JSON 驱动的在线图片编辑器，通过 AI 模型提取图片结构化描述，支持编辑 JSON 后生成候选图，并提供完整的版本历史管理。

## 功能特性

- **图片上传与 AI 提取**：上传图片后自动调用 AI 模型提取结构化 JSON 描述
- **JSON 编辑**：使用 Monaco Editor 编辑图片的 JSON 描述，支持语法高亮和错误提示
- **AI 图片生成**：根据编辑后的 JSON 生成多张候选图（1-8张）
- **候选图选择**：从生成的候选图中选择满意的图片
- **版本历史**：完整的版本管理，支持回溯到任意历史版本
- **多语言支持**：JSON 描述支持多种输出语言

## 技术栈

- **前端**：Vue 3 + Vite + TypeScript + Pinia + Vue Router + Monaco Editor
- **后端**：Node.js + TypeScript + Fastify
- **数据库**：PostgreSQL 15
- **存储**：本地文件系统（可扩展 OSS）

## 环境要求

- Node.js >= 18.0.0
- Docker & Docker Compose
- npm 或 yarn

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd image-editor-json-driven
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 根据需要修改 .env 文件中的配置
```

### 3. 启动数据库

```bash
# 启动 PostgreSQL 容器
npm run db:up

# 等待数据库就绪（约 10 秒）
```

### 4. 安装依赖

```bash
# 安装所有依赖（包括 server 和 client）
npm install
```

### 5. 执行数据库迁移

```bash
npm run db:migrate
```

### 6. 启动开发服务器

```bash
# 终端 1：启动后端服务
npm run dev:server

# 终端 2：启动前端服务
npm run dev:client
```

### 7. 访问应用

- 前端界面：http://localhost:5173
- 后端 API：http://localhost:3000

## 项目结构

```
image-editor-json-driven/
├── client/                 # 前端项目 (Vue 3)
│   ├── src/
│   │   ├── api/           # API 客户端
│   │   ├── components/    # Vue 组件
│   │   ├── router/        # 路由配置
│   │   ├── stores/        # Pinia 状态管理
│   │   ├── types/         # TypeScript 类型
│   │   └── views/         # 页面视图
│   └── package.json
├── server/                 # 后端项目 (Fastify)
│   ├── src/
│   │   ├── controllers/   # 请求处理器
│   │   ├── db/            # 数据库访问
│   │   ├── providers/     # AI 模型适配器
│   │   ├── routes/        # API 路由
│   │   ├── services/      # 业务逻辑
│   │   ├── storage/       # 存储服务
│   │   ├── types/         # TypeScript 类型
│   │   └── utils/         # 工具函数
│   ├── migrations/        # SQL 迁移文件
│   └── package.json
├── data/                   # 数据目录
│   └── uploads/           # 上传文件存储
├── docker/                 # Docker 配置
├── docker-compose.yml      # Docker Compose 配置
├── package.json            # 根目录配置
└── .env.example            # 环境变量模板
```

## 环境变量说明

详见 `.env.example` 文件：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `POSTGRES_USER` | PostgreSQL 用户名 | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL 密码 | `postgres` |
| `POSTGRES_DB` | 数据库名称 | `image_editor` |
| `POSTGRES_HOST` | 数据库主机 | `localhost` |
| `POSTGRES_PORT` | 数据库端口 | `5433` |
| `SERVER_PORT` | 后端服务端口 | `3000` |
| `NODE_ENV` | 运行环境 | `development` |
| `STORAGE_TYPE` | 存储类型 | `local` |
| `STORAGE_PATH` | 本地存储路径 | `./data/uploads` |
| `USE_MOCK` | 使用 Mock AI Provider | `true` |
| `GEMINI_API_KEY` | Gemini API 密钥 | - |
| `NANO_BANANA_API_KEY` | NanoBanana API 密钥 | - |
| `VITE_API_BASE_URL` | 前端 API 基础 URL | `http://localhost:3000` |

## API 文档

### 项目 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/projects` | 获取项目列表 |
| `POST` | `/api/projects/upload` | 上传图片创建项目 |
| `GET` | `/api/projects/:id` | 获取项目详情 |
| `PATCH` | `/api/projects/:id` | 更新项目设置 |
| `GET` | `/api/projects/:id/versions` | 获取版本列表 |
| `POST` | `/api/projects/:id/versions` | 创建新版本 |
| `POST` | `/api/projects/:id/generate` | 创建生成任务 |
| `POST` | `/api/projects/:id/select` | 选定候选图 |

### 生成任务 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/generations/:id` | 查询任务状态 |

### 静态文件

| 路径 | 说明 |
|------|------|
| `/uploads/*` | 访问上传的图片文件 |

## 常用命令

```bash
# 启动数据库
npm run db:up

# 停止数据库
npm run db:down

# 执行数据库迁移
npm run db:migrate

# 启动后端开发服务器
npm run dev:server

# 启动前端开发服务器
npm run dev:client

# 构建后端
npm run build:server

# 构建前端
npm run build:client
```

## Mock 模式

项目默认启用 Mock 模式（`USE_MOCK=true`），无需配置 AI API 密钥即可体验完整流程：

- **MockGeminiExtractor**：返回固定结构的 JSON 描述
- **MockNanoBananaEditor**：复制原图生成候选图

如需使用真实 AI 服务，请设置 `USE_MOCK=false` 并配置相应的 API 密钥。

## 开发说明

### 添加新的数据库迁移

1. 在 `server/migrations/` 目录创建新的 SQL 文件
2. 文件名格式：`XXX_description.sql`（XXX 为递增序号）
3. 运行 `npm run db:migrate` 执行迁移

### 扩展存储服务

存储服务采用接口抽象设计，可通过实现 `StorageProvider` 接口扩展：

- `LocalStorageProvider`：本地文件系统存储（已实现）
- `OSSStorageProvider`：OSS 云存储（预留接口）

### 扩展 AI Provider

AI 模型适配器采用接口抽象设计：

- `GeminiExtractor`：图片 JSON 提取
- `NanoBananaEditor`：图片生成

## License

MIT
