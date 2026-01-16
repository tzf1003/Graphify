# Graphify

An AI-powered intelligent graphic design platform that extracts structured descriptions from images using AI models, supports visual graph editing, JSON editing, AI image generation, and provides complete version history management.

## ✨ Features

### Core Features
- **Image Upload & AI Extraction**: Automatically extract structured JSON descriptions from uploaded images using AI models
- **Visual Graph Editor**: Interactive graph editor based on Vue Flow, supporting node dragging, connecting, and zooming
- **JSON Editor**: Edit image JSON descriptions using Monaco Editor with syntax highlighting and error hints
- **AI Image Generation**: Generate multiple candidate images (1-8) based on edited JSON
- **Text-to-Image**: Generate images directly from text descriptions (DALL-E)
- **Candidate Selection**: Select satisfactory images from generated candidates
- **Version History**: Complete version management with rollback to any historical version

### Additional Features
- **Multi-language Support**: Interface supports Chinese/English switching
- **Theme Switching**: Light/Dark theme support
- **Project Management**: Multi-project management with project list sidebar
- **Real-time Preview**: Synchronized image preview and editing

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend Framework** | Vue 3 + TypeScript + Vite |
| **State Management** | Pinia |
| **Router** | Vue Router 4 |
| **Graph Editor** | Vue Flow |
| **Code Editor** | Monaco Editor |
| **Backend Framework** | Node.js + Fastify + TypeScript |
| **Database** | PostgreSQL 15 |
| **Containerization** | Docker + Docker Compose |
| **AI Services** | OpenAI API / Gemini API / DALL-E |

## 📋 Requirements

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Docker** >= 20.0.0
- **Docker Compose** >= 2.0.0

## 🚀 Quick Start

### Option 1: One-Click Start (Windows)

```batch
# 1. Clone the project
git clone <repository-url>
cd graphify

# 2. Copy environment configuration
copy .env.example .env

# 3. Edit .env file to configure AI API keys (optional, defaults to Mock mode)

# 4. Install dependencies (first run)
build.bat

# 5. Start the project
start.bat
```

### Option 2: Manual Start

#### 1. Clone the Project
```bash
git clone <repository-url>
cd graphify
```

#### 2. Configure Environment Variables
```bash
# Copy environment template
cp .env.example .env

# Edit .env file and modify configurations as needed
# Pay special attention to AI API key configurations
```

#### 3. Start Database
```bash
# Start PostgreSQL container
npm run db:up

# Wait for database to be ready (about 5-10 seconds)
```

#### 4. Install Dependencies
```bash
# Install all dependencies (including server and client)
npm install
```

#### 5. Start Development Servers
```bash
# Terminal 1: Start backend service
npm run dev:server

# Terminal 2: Start frontend service
npm run dev:client
```

#### 6. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 📁 Project Structure

```
graphify/
├── client/                     # Frontend (Vue 3)
│   ├── src/
│   │   ├── api/               # API client wrapper
│   │   ├── components/        # Vue components
│   │   │   ├── ai/           # AI chat components
│   │   │   ├── common/       # Common components (navbar, cards, etc.)
│   │   │   ├── effects/      # Effect components (particle background, etc.)
│   │   │   ├── home/         # Home page components
│   │   │   └── project/      # Project editor components
│   │   │       └── graph/    # Graph editor components
│   │   ├── composables/      # Vue composables
│   │   ├── locales/          # i18n language packs
│   │   ├── router/           # Router configuration
│   │   ├── stores/           # Pinia state management
│   │   ├── types/            # TypeScript type definitions
│   │   ├── utils/            # Utility functions
│   │   └── views/            # Page views
│   └── package.json
│
├── server/                     # Backend (Fastify)
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── db/               # Database access layer
│   │   ├── providers/        # AI model adapters
│   │   │   ├── gemini/      # Gemini extractor
│   │   │   ├── nanoBanana/  # NanoBanana image editor
│   │   │   └── textToImage/ # Text-to-image generator
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic layer
│   │   ├── storage/          # Storage service (local/OSS)
│   │   ├── types/            # TypeScript type definitions
│   │   └── utils/            # Utility functions
│   ├── migrations/           # SQL database migrations
│   └── package.json
│
├── data/                       # Data directory
│   └── uploads/               # Uploaded files storage
│
├── docker/                     # Docker configuration files
├── test/                       # Test files
├── docker-compose.yml          # Docker Compose configuration
├── package.json                # Root configuration (Workspaces)
├── start.bat                   # Windows one-click start script
├── build.bat                   # Windows build script
├── stop.bat                    # Windows stop script
└── .env.example                # Environment variables template
```

## ⚙️ Environment Variables

### Database Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | PostgreSQL username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres` |
| `POSTGRES_DB` | Database name | `image_editor` |
| `POSTGRES_HOST` | Database host | `localhost` |
| `POSTGRES_PORT` | Database port | `5433` |

### Server Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_PORT` | Backend service port | `3000` |
| `NODE_ENV` | Runtime environment | `development` |

### Storage Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `STORAGE_TYPE` | Storage type (`local` / `oss`) | `local` |
| `STORAGE_PATH` | Local storage path | `./data/uploads` |

### AI Provider Configuration

| Variable | Description | Options |
|----------|-------------|---------|
| `EXTRACTOR_PROVIDER` | JSON extractor | `mock` / `gemini` / `openai` |
| `IMAGE_PROVIDER` | Image generator | `mock` / `nanobanana` / `openai` |
| `TEXT_TO_IMAGE_PROVIDER` | Text-to-image | `mock` / `openai` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `OPENAI_API_BASE` | OpenAI API base URL | `https://api.openai.com/v1` |
| `OPENAI_EXTRACTOR_MODEL` | Extractor model | `gpt-4o` |
| `OPENAI_MODEL` | Generation model | `gpt-4o` |
| `TEXT_TO_IMAGE_MODEL` | Text-to-image model | `dall-e-3` |
| `GEMINI_API_KEY` | Gemini API key | - |

### Frontend Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Frontend API base URL | `http://localhost:3000` |

## 📡 API Endpoints

### Project Management

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/projects` | Get project list |
| `POST` | `/api/projects/upload` | Upload image to create project |
| `POST` | `/api/projects/text-to-image` | Create project from text |
| `GET` | `/api/projects/:id` | Get project details |
| `PATCH` | `/api/projects/:id` | Update project settings |
| `DELETE` | `/api/projects/:id` | Delete project |

### Version Management

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/projects/:id/versions` | Get version list |
| `POST` | `/api/projects/:id/versions` | Create new version |

### Image Generation

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/projects/:id/generate` | Create generation task |
| `GET` | `/api/generations/:id` | Query task status |
| `POST` | `/api/projects/:id/select` | Select candidate image |

### Static Resources

| Path | Description |
|------|-------------|
| `/uploads/*` | Access uploaded image files |
| `/health` | Health check endpoint |

## 🔧 Common Commands

```bash
# Database management
npm run db:up          # Start database
npm run db:down        # Stop database
npm run db:migrate     # Run database migrations

# Development mode
npm run dev:server     # Start backend dev server
npm run dev:client     # Start frontend dev server

# Build
npm run build:server   # Build backend
npm run build:client   # Build frontend
```

## 🧪 Mock Mode

The project supports Mock mode, allowing you to experience the full workflow without configuring AI API keys:

```env
EXTRACTOR_PROVIDER=mock
IMAGE_PROVIDER=mock
TEXT_TO_IMAGE_PROVIDER=mock
```

In Mock mode:
- **MockGeminiExtractor**: Returns fixed structure JSON descriptions
- **MockNanoBananaEditor**: Copies original image as candidate
- **MockTextToImageGenerator**: Generates placeholder images

## 📦 Deployment Guide

### Development Environment

1. Ensure Node.js 18+ and Docker are installed
2. Follow the "Quick Start" steps

### Production Environment

#### Option 1: Docker Compose Deployment (Recommended)

```bash
# 1. Prepare production configuration
cp .env.example .env.production

# 2. Edit .env.production for production settings
#    - Change database password
#    - Set NODE_ENV=production
#    - Configure real AI API keys
#    - Configure OSS storage (optional)

# 3. Build the project
npm run build:server
npm run build:client

# 4. Start services
docker-compose -f docker-compose.yml --env-file .env.production up -d
```

#### Option 2: Manual Deployment

##### 1. Database Deployment

```bash
# Deploy PostgreSQL using Docker
docker run -d \
  --name graphify-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=<your-secure-password> \
  -e POSTGRES_DB=image_editor \
  -p 5433:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine
```

##### 2. Backend Deployment

```bash
cd server

# Install production dependencies
npm ci --production

# Build
npm run build

# Set environment variables
export NODE_ENV=production
export POSTGRES_HOST=<database-host>
export POSTGRES_PASSWORD=<your-secure-password>
# ... other environment variables

# Start service
node dist/index.js
```

##### 3. Frontend Deployment

```bash
cd client

# Build
npm run build

# Deploy dist directory to web server (Nginx/Apache/CDN)
```

##### 4. Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /var/www/graphify/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Upload files proxy
    location /uploads {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

### Using PM2 for Process Management

```bash
# Install PM2
npm install -g pm2

# Start service
pm2 start server/dist/index.js --name graphify-server

# Enable startup on boot
pm2 startup
pm2 save

# View logs
pm2 logs graphify-server

# Restart service
pm2 restart graphify-server
```

### Cloud Deployment Recommendations

#### Alibaba Cloud
- **ECS**: Deploy backend service
- **RDS PostgreSQL**: Managed database
- **OSS**: Store uploaded images
- **CDN**: Accelerate frontend static resources

#### AWS
- **EC2 / ECS**: Deploy backend service
- **RDS PostgreSQL**: Managed database
- **S3**: Store uploaded images
- **CloudFront**: CDN acceleration

## 🔒 Security Recommendations

1. **Change default database password in production**
2. **Configure CORS whitelist** to restrict allowed domains
3. **Use HTTPS** with SSL certificates
4. **Never commit API keys to the repository**
5. **Regularly backup the database**
6. **Configure firewall rules** to restrict database port access

## 🐛 FAQ

### Q: Database connection failed
A: Check if Docker is running and port 5433 is not occupied:
```bash
docker ps
netstat -an | findstr 5433
```

### Q: AI extraction failed
A: Check if AI API configuration is correct. Try Mock mode first:
```env
EXTRACTOR_PROVIDER=mock
```

### Q: Image upload failed
A: Check `data/uploads` directory permissions, ensure it's writable

### Q: Frontend cannot access backend API
A: Check CORS configuration and `VITE_API_BASE_URL` environment variable

## 📄 License

MIT

## 🤝 Contributing

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request
