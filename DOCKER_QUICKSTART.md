# 🐳 Docker Quick Start Guide

## One-Command Startup

Start the entire application with a single command:

```bash
# Using bash
chmod +x start.sh
./start.sh

# OR using fish shell
chmod +x start.fish
./start.fish

# OR directly with docker compose
docker compose up -d
```

This will:
- ✅ Build all Docker images
- ✅ Start PostgreSQL database
- ✅ Start Backend API (Flask)
- ✅ Start Frontend (Next.js)
- ✅ Initialize database schema
- ✅ Set up ChromaDB for RAG search
- ✅ Configure all networking

## Services

The stack includes three services:

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **Frontend** | 3000 | http://localhost:3000 | Next.js React application |
| **Backend** | 5000 | http://localhost:5000 | Flask REST API |
| **PostgreSQL** | 5432 | localhost:5432 | Database |

## Prerequisites

1. **Docker & Docker Compose**
   ```bash
   # Check installation
   docker --version
   docker compose version
   ```
   If not installed, get Docker Desktop: https://docs.docker.com/get-docker/

2. **Environment Variables**
   
   Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```
   
   Required variables:
   - `GITHUB_OAUTH_CLIENT_ID` - GitHub OAuth App credentials
   - `GITHUB_OAUTH_CLIENT_SECRET` - GitHub OAuth secret
   - `GEMINI_API_KEY` - Google Gemini API key
   - `GITHUB_TOKEN` - GitHub Personal Access Token

## Quick Commands

### Start Everything
```bash
docker compose up -d
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Stop Services
```bash
docker compose down
```

### Restart Services
```bash
docker compose restart

# Restart specific service
docker compose restart backend
```

### Rebuild After Code Changes
```bash
docker compose up -d --build
```

### Reset Everything (including data)
```bash
docker compose down -v
```

### Check Service Status
```bash
docker compose ps
```

### Access Service Shells
```bash
# Backend shell
docker compose exec backend bash

# Frontend shell
docker compose exec frontend sh

# Database shell
docker compose exec postgres psql -U postgres -d ai_agent_benchmark
```

## Volume Management

The application uses Docker volumes for persistent data:

| Volume | Purpose | Data Stored |
|--------|---------|-------------|
| `postgres_data` | Database | User data, projects, analyses, test sessions |
| `backend_cache` | Cache files | GitHub repo cache |
| `chromadb_data` | Vector DB | RAG embeddings for search |

### Backup Data
```bash
# Backup database
docker compose exec postgres pg_dump -U postgres ai_agent_benchmark > backup.sql

# Backup ChromaDB
docker compose exec backend tar -czf /tmp/chromadb.tar.gz /app/data/chromadb
docker compose cp backend:/tmp/chromadb.tar.gz ./chromadb_backup.tar.gz
```

### Restore Data
```bash
# Restore database
cat backup.sql | docker compose exec -T postgres psql -U postgres ai_agent_benchmark

# Restore ChromaDB
docker compose cp ./chromadb_backup.tar.gz backend:/tmp/chromadb.tar.gz
docker compose exec backend tar -xzf /tmp/chromadb.tar.gz -C /
```

## Development Workflow

### Hot Reload Enabled

Both frontend and backend support hot reload:

- **Frontend**: Changes to `/frontend` files automatically rebuild
- **Backend**: Changes to `/backend` files restart the Flask server

### Making Code Changes

1. Edit files in your local `frontend/` or `backend/` directories
2. Changes are synced to containers via volume mounts
3. Services automatically reload
4. Refresh browser to see changes

### Debugging

```bash
# Follow backend logs for errors
docker compose logs -f backend

# Check backend container
docker compose exec backend python -c "import sys; print(sys.path)"

# Test database connection
docker compose exec backend python -c "from database import get_db; print('DB OK')"

# Check ChromaDB
docker compose exec backend python -c "from services.rag_service import get_rag_service; print(get_rag_service().get_stats())"
```

## Production Deployment

### Environment Variables

Update `.env` for production:

```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_SECRET=$(openssl rand -hex 32)

# Update OAuth callback URL
GITHUB_OAUTH_CALLBACK=https://yourdomain.com/auth/github/callback

# Update API URL
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Build for Production

```bash
# Build optimized images
docker compose -f docker-compose.prod.yml build

# Start with production config
docker compose -f docker-compose.prod.yml up -d
```

### Health Checks

All services include health checks:

```bash
# Check health status
docker compose ps

# Manual health check
curl http://localhost:5000/health
curl http://localhost:3000/
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000
lsof -i :5000
lsof -i :5432

# Kill the process or change ports in docker-compose.yml
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker compose ps postgres

# Check logs
docker compose logs postgres

# Restart database
docker compose restart postgres
```

### Backend Crashes on Startup

```bash
# Check logs
docker compose logs backend

# Common issues:
# 1. Missing environment variables - check .env file
# 2. Database not ready - wait 10 seconds and restart
# 3. Port conflict - check if port 5000 is free

# Force rebuild
docker compose up -d --build backend
```

### Frontend Won't Load

```bash
# Check logs
docker compose logs frontend

# Common issues:
# 1. node_modules issue - delete volume and rebuild
# 2. Port conflict - check if port 3000 is free

# Clean rebuild
docker compose down
docker volume rm calhacks-2025_frontend_node_modules
docker compose up -d --build frontend
```

### ChromaDB Errors

```bash
# Check ChromaDB directory permissions
docker compose exec backend ls -la /app/data/chromadb

# Reset ChromaDB (loses search data)
docker compose down
docker volume rm calhacks-2025_chromadb_data
docker compose up -d
```

### Out of Disk Space

```bash
# Clean up unused Docker resources
docker system prune -a --volumes

# Check disk usage
docker system df
```

## Performance Optimization

### Resource Limits

Edit `docker-compose.yml` to add resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

### Faster Builds

```bash
# Use BuildKit for parallel builds
DOCKER_BUILDKIT=1 docker compose build

# Cache layers
docker compose build --parallel
```

## Security Best Practices

1. **Never commit .env file** - it's in `.gitignore`
2. **Use strong secrets** - generate with `openssl rand -hex 32`
3. **Update dependencies** regularly
4. **Use HTTPS** in production
5. **Enable firewall** rules for production
6. **Regular backups** of volumes

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build images
        run: docker compose build
      - name: Run tests
        run: docker compose run backend pytest
```

## Support

For issues:
1. Check logs: `docker compose logs -f`
2. Check service status: `docker compose ps`
3. Try clean restart: `docker compose down && docker compose up -d`
4. Reset data if needed: `docker compose down -v`

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              Docker Network (app-network)        │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐            │
│  │   Frontend   │  │   Backend    │            │
│  │   Next.js    │──│   Flask API  │            │
│  │   :3000      │  │   :5000      │            │
│  └──────────────┘  └──────┬───────┘            │
│                            │                     │
│                     ┌──────▼───────┐            │
│                     │  PostgreSQL  │            │
│                     │   Database   │            │
│                     │   :5432      │            │
│                     └──────────────┘            │
│                                                  │
│  Volumes:                                       │
│  • postgres_data (DB persistence)               │
│  • backend_cache (GitHub cache)                 │
│  • chromadb_data (RAG embeddings)               │
└─────────────────────────────────────────────────┘
```

## Next Steps

After starting the application:

1. **Open Browser**: http://localhost:3000
2. **Login**: Use GitHub OAuth
3. **Create Project**: Connect your GitHub repository
4. **Analyze**: Let AI analyze your agent codebase
5. **Test**: Generate and run test suites
6. **Search**: Press Ctrl+K for global search

Enjoy building better AI agents! 🚀
