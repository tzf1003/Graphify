# 图析 (Graphify)

AI 驱动的智能图形化设计平台，通过 AI 模型提取图片结构化描述，支持可视化图编辑、JSON 编辑、AI 图片生成，并提供完整的版本历史管理。

## ✨ 功能特性

### 核心功能
- **图片上传与 AI 提取**：上传图片后自动调用 AI 模型提取结构化 JSON 描述
- **可视化图编辑**：基于 Vue Flow 的交互式图形编辑器，支持节点拖拽、连线、缩放
- **JSON 编辑**：使用 Monaco Editor 编辑图片的 JSON 描述，支持语法高亮和错误提示
- **AI 图片生成**：根据编辑后的 JSON 生成多张候选图（1-8张）
- **文字生成图片**：支持通过文字描述直接生成图片（DALL-E）
- **候选图选择**：从生成的候选图中选择满意的图片
- **版本历史**：完整的版本管理，支持回溯到任意历史版本

### 辅助功能
- **多语言支持**：界面支持中文/英文切换
- **主题切换**：支持亮色/暗色主题
- **项目管理**：支持多项目管理，项目列表侧边栏
- **实时预览**：图片预览与编辑实时同步

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| **前端框架** | Vue 3 + TypeScript + Vite |
| **状态管理** | Pinia |
| **路由** | Vue Router 4 |
| **图形编辑** | Vue Flow |
| **代码编辑** | Monaco Editor |
| **后端框架** | Node.js + Fastify + TypeScript |
| **数据库** | PostgreSQL 15 |
| **容器化** | Docker + Docker Compose |
| **AI 服务** | OpenAI API / Gemini API / DALL-E |

## 📋 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Docker** >= 20.0.0
- **Docker Compose** >= 2.0.0

## 🚀 快速开始

### 方式一：一键启动（Windows）

```batch
# 1. 克隆项目
git clone <repository-url>
cd graphify

# 2. 复制环境变量配置
copy .env.example .env

# 3. 编辑 .env 文件，配置 AI API 密钥（可选，默认使用 Mock 模式）

# 4. 首次运行需要安装依赖
build.bat

# 5. 启动项目
start.bat
```

### 方式二：手动启动

#### 1. 克隆项目
```bash
git clone <repository-url>
cd graphify
```

#### 2. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，根据需要修改配置
# 特别注意配置 AI API 相关的密钥
```

#### 3. 启动数据库
```bash
# 启动 PostgreSQL 容器
npm run db:up

# 等待数据库就绪（约 5-10 秒）
```

#### 4. 安装依赖
```bash
# 安装所有依赖（包括 server 和 client）
npm install
```

#### 5. 启动开发服务器
```bash
# 终端 1：启动后端服务
npm run dev:server

# 终端 2：启动前端服务
npm run dev:client
```

#### 6. 访问应用
- **前端界面**：http://localhost:5173
- **后端 API**：http://localhost:3000
- **健康检查**：http://localhost:3000/health

## 📁 项目结构

```
graphify/
├── client/                     # 前端项目 (Vue 3)
│   ├── src/
│   │   ├── api/               # API 客户端封装
│   │   ├── components/        # Vue 组件
│   │   │   ├── ai/           # AI 聊天相关组件
│   │   │   ├── common/       # 通用组件（导航栏、卡片等）
│   │   │   ├── effects/      # 特效组件（粒子背景等）
│   │   │   ├── home/         # 首页组件
│   │   │   └── project/      # 项目编辑组件
│   │   │       └── graph/    # 图形编辑器组件
│   │   ├── composables/      # Vue 组合式函数
│   │   ├── locales/          # 国际化语言包
│   │   ├── router/           # 路由配置
│   │   ├── stores/           # Pinia 状态管理
│   │   ├── types/            # TypeScript 类型定义
│   │   ├── utils/            # 工具函数
│   │   └── views/            # 页面视图
│   └── package.json
│
├── server/                     # 后端项目 (Fastify)
│   ├── src/
│   │   ├── controllers/       # 请求处理器
│   │   ├── db/               # 数据库访问层
│   │   ├── providers/        # AI 模型适配器
│   │   │   ├── gemini/      # Gemini 提取器
│   │   │   ├── nanoBanana/  # NanoBanana 图片编辑
│   │   │   └── textToImage/ # 文字生成图片
│   │   ├── routes/           # API 路由定义
│   │   ├── services/         # 业务逻辑层
│   │   ├── storage/          # 存储服务（本地/OSS）
│   │   ├── types/            # TypeScript 类型定义
│   │   └── utils/            # 工具函数
│   ├── migrations/           # SQL 数据库迁移文件
│   └── package.json
│
├── data/                       # 数据目录
│   └── uploads/               # 上传文件存储
│
├── docker/                     # Docker 配置文件
├── test/                       # 测试文件
├── docker-compose.yml          # Docker Compose 配置
├── package.json                # 根目录配置（Workspaces）
├── start.bat                   # Windows 一键启动脚本
├── build.bat                   # Windows 构建脚本
├── stop.bat                    # Windows 停止脚本
└── .env.example                # 环境变量模板
```

## ⚙️ 环境变量配置

### 数据库配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `POSTGRES_USER` | PostgreSQL 用户名 | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL 密码 | `postgres` |
| `POSTGRES_DB` | 数据库名称 | `image_editor` |
| `POSTGRES_HOST` | 数据库主机 | `localhost` |
| `POSTGRES_PORT` | 数据库端口 | `5433` |

### 服务器配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `SERVER_PORT` | 后端服务端口 | `3000` |
| `NODE_ENV` | 运行环境 | `development` |

### 存储配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `STORAGE_TYPE` | 存储类型 (`local` / `oss`) | `local` |
| `STORAGE_PATH` | 本地存储路径 | `./data/uploads` |

### AI Provider 配置

| 变量名 | 说明 | 可选值 |
|--------|------|--------|
| `EXTRACTOR_PROVIDER` | JSON 提取器 | `mock` / `gemini` / `openai` |
| `IMAGE_PROVIDER` | 图片生成器 | `mock` / `nanobanana` / `openai` |
| `TEXT_TO_IMAGE_PROVIDER` | 文字生图 | `mock` / `openai` |
| `OPENAI_API_KEY` | OpenAI API 密钥 | - |
| `OPENAI_API_BASE` | OpenAI API 地址 | `https://api.openai.com/v1` |
| `OPENAI_EXTRACTOR_MODEL` | 提取模型 | `gpt-4o` |
| `OPENAI_MODEL` | 生成模型 | `gpt-4o` |
| `TEXT_TO_IMAGE_MODEL` | 文生图模型 | `dall-e-3` |
| `GEMINI_API_KEY` | Gemini API 密钥 | - |

### 前端配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_API_BASE_URL` | 前端 API 基础 URL | `http://localhost:3000` |

## 📡 API 接口

### 项目管理

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/projects` | 获取项目列表 |
| `POST` | `/api/projects/upload` | 上传图片创建项目 |
| `POST` | `/api/projects/text-to-image` | 文字生成图片创建项目 |
| `GET` | `/api/projects/:id` | 获取项目详情 |
| `PATCH` | `/api/projects/:id` | 更新项目设置 |
| `DELETE` | `/api/projects/:id` | 删除项目 |

### 版本管理

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/projects/:id/versions` | 获取版本列表 |
| `POST` | `/api/projects/:id/versions` | 创建新版本 |

### 图片生成

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/projects/:id/generate` | 创建生成任务 |
| `GET` | `/api/generations/:id` | 查询任务状态 |
| `POST` | `/api/projects/:id/select` | 选定候选图 |

### 静态资源

| 路径 | 说明 |
|------|------|
| `/uploads/*` | 访问上传的图片文件 |
| `/health` | 健康检查端点 |

## 🔧 常用命令

```bash
# 数据库管理
npm run db:up          # 启动数据库
npm run db:down        # 停止数据库
npm run db:migrate     # 执行数据库迁移

# 开发模式
npm run dev:server     # 启动后端开发服务器
npm run dev:client     # 启动前端开发服务器

# 构建
npm run build:server   # 构建后端
npm run build:client   # 构建前端
```

## 🧪 Mock 模式

项目支持 Mock 模式，无需配置 AI API 密钥即可体验完整流程：

```env
EXTRACTOR_PROVIDER=mock
IMAGE_PROVIDER=mock
TEXT_TO_IMAGE_PROVIDER=mock
```

Mock 模式下：
- **MockGeminiExtractor**：返回固定结构的 JSON 描述
- **MockNanoBananaEditor**：复制原图生成候选图
- **MockTextToImageGenerator**：生成占位图片

## 📦 部署指南

### 开发环境部署

1. 确保已安装 Node.js 18+ 和 Docker
2. 按照「快速开始」步骤操作即可

### 生产环境部署

#### 方式一：Docker Compose 部署（推荐）

```bash
# 1. 准备生产环境配置
cp .env.example .env.production

# 2. 编辑 .env.production，设置生产环境参数
#    - 修改数据库密码
#    - 设置 NODE_ENV=production
#    - 配置真实的 AI API 密钥
#    - 配置 OSS 存储（可选）

# 3. 构建项目
npm run build:server
npm run build:client

# 4. 启动服务
docker-compose -f docker-compose.yml --env-file .env.production up -d
```

#### 方式二：手动部署

##### 1. 数据库部署

```bash
# 使用 Docker 部署 PostgreSQL
docker run -d \
  --name graphify-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=<your-secure-password> \
  -e POSTGRES_DB=image_editor \
  -p 5433:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine
```

##### 2. 后端部署

```bash
cd server

# 安装生产依赖
npm ci --production

# 构建
npm run build

# 设置环境变量
export NODE_ENV=production
export POSTGRES_HOST=<database-host>
export POSTGRES_PASSWORD=<your-secure-password>
# ... 其他环境变量

# 启动服务
node dist/index.js
```

##### 3. 前端部署

```bash
cd client

# 构建
npm run build

# 将 dist 目录部署到 Web 服务器（Nginx/Apache/CDN）
```

##### 4. Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/graphify/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 上传文件代理
    location /uploads {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

### 使用 PM2 管理后端进程

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server/dist/index.js --name graphify-server

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs graphify-server

# 重启服务
pm2 restart graphify-server
```

### 云服务部署建议

#### 阿里云部署
- **ECS**：部署后端服务
- **RDS PostgreSQL**：托管数据库
- **OSS**：存储上传的图片
- **CDN**：加速前端静态资源

#### AWS 部署
- **EC2 / ECS**：部署后端服务
- **RDS PostgreSQL**：托管数据库
- **S3**：存储上传的图片
- **CloudFront**：CDN 加速

## 🔒 安全建议

1. **生产环境必须修改默认数据库密码**
2. **配置 CORS 白名单**，限制允许的域名
3. **使用 HTTPS**，配置 SSL 证书
4. **API 密钥不要提交到代码仓库**
5. **定期备份数据库**
6. **配置防火墙规则**，限制数据库端口访问

## 🐛 常见问题

### Q: 数据库连接失败
A: 检查 Docker 是否运行，端口 5433 是否被占用：
```bash
docker ps
netstat -an | findstr 5433
```

### Q: AI 提取失败
A: 检查 AI API 配置是否正确，可以先使用 Mock 模式测试：
```env
EXTRACTOR_PROVIDER=mock
```

### Q: 图片上传失败
A: 检查 `data/uploads` 目录权限，确保可写入

### Q: 前端无法访问后端 API
A: 检查 CORS 配置和 `VITE_API_BASE_URL` 环境变量

## 📄 License

MIT

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request
