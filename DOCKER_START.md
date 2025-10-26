# 🚀 Quick Start with Docker

Get the entire AI Agent Testing Framework running in seconds!

## One-Command Startup

```bash
w# Using Make (recommended)
make start

# OR using startup scripts
./start.sh          # Bash
./start.fish        # Fish shell

# OR directly with Docker Compose
docker compose up -d
```

That's it! Your entire application is now running:

- ✅ **Frontend**: http://localhost:3000
- ✅ **Backend API**: http://localhost:5000
- ✅ **PostgreSQL Database**: localhost:5432
- ✅ **ChromaDB RAG Search**: Embedded with backend

## What You Get

### 🎯 Complete Stack

- **Next.js Frontend** with hot reload
- **Flask Backend API** with auto-restart
- **PostgreSQL Database** with persistence
- **ChromaDB Vector DB** for RAG search (HuggingFace embeddings)
- **Full networking** and health checks

### ✨ Features Ready to Use

- 🔍 **Global Search** - Press Ctrl+K to search everything
- 🤖 **AI Agent Analysis** - Detect agents, tools, relationships
- 🧪 **Automated Testing** - Generate and run comprehensive test suites
- 📊 **Visual Reports** - Beautiful test reports with charts
- 🔧 **Fix Recommendations** - AI-powered code suggestions
- 🔗 **GitHub Integration** - OAuth login, PR creation

## Prerequisites

1. **Docker Desktop** (includes Docker Compose)

   - [Download for Mac](https://docs.docker.com/desktop/install/mac-install/)
   - [Download for Windows](https://docs.docker.com/desktop/install/windows-install/)
   - [Download for Linux](https://docs.docker.com/desktop/install/linux-install/)
2. **Environment Variables** (created automatically on first run)

   - GitHub OAuth credentials
   - API keys (Gemini, GitHub)
   - See `.env.example` for details

## Quick Commands

```bash
# Start everything
make start          # Complete setup + start

# View logs
make logs           # All services
make logs-backend   # Just backend
make logs-frontend  # Just frontend

# Restart services
make restart        # Restart all
make rebuild        # Rebuild and restart

# Stop everything
make down           # Stop services
make clean          # Stop and remove containers

# Database operations
make db-backup      # Backup to backup.sql
make db-restore     # Restore from backup.sql
make db-reset       # Reset database

# RAG search
make rag-index      # Index documentation
make rag-stats      # Show search statistics

# Help
make help           # Show all commands
```

## Development Workflow

### Making Code Changes

1. **Edit files** in `frontend/` or `backend/` directories
2. **Changes auto-reload** - no restart needed
3. **Refresh browser** to see changes

### Viewing Logs

```bash
# Follow all logs
make logs

# Specific service
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend
```

### Accessing Containers

```bash
# Backend shell
make backend-shell

# Frontend shell  
make frontend-shell

# Database CLI
make db-shell
```

## Data Persistence

All data is stored in Docker volumes:

| Volume            | Data                                            |
| ----------------- | ----------------------------------------------- |
| `postgres_data` | User accounts, projects, analyses, test results |
| `backend_cache` | GitHub repository cache                         |
| `chromadb_data` | RAG search embeddings                           |

### Backup & Restore

```bash
# Backup database
make db-backup

# Restore database
make db-restore

# Reset everything (WARNING: deletes all data)
make reset
```

## Configuration

### Environment Variables

Create/edit `.env` file:

```bash
# Required for GitHub OAuth
GITHUB_OAUTH_CLIENT_ID=your_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_client_secret

# Required for AI analysis
GEMINI_API_KEY=your_gemini_api_key

# Required for GitHub integration
GITHUB_TOKEN=your_github_token

# Auto-generated if not provided
JWT_SECRET=auto_generated_secret
ENCRYPTION_SECRET=auto_generated_secret
```

Generate secrets:

```bash
python3 -c "import secrets; print('JWT_SECRET=' + secrets.token_hex(32))"
python3 -c "import secrets; print('ENCRYPTION_SECRET=' + secrets.token_hex(32))"
```

### Port Configuration

Edit `docker-compose.yml` to change ports:

```yaml
services:
  frontend:
    ports:
      - "3000:3000"  # Change left number: "8080:3000"
  
  backend:
    ports:
      - "5000:5000"  # Change left number: "8080:5000"
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000

# Change ports in docker-compose.yml or stop the conflicting service
```

### Database Connection Failed

```bash
# Wait for database to be ready (30 seconds)
sleep 30

# Or restart
make restart
```

### Services Won't Start

```bash
# Check logs
make logs

# Clean rebuild
make clean
make build
make up
```

### Reset Everything

```bash
# Complete reset (deletes all data)
docker compose down -v
docker compose up -d
```

## Architecture

```
┌─────────────────────────────────────┐
│     Docker Compose Network          │
│                                     │
│  ┌──────────┐    ┌──────────┐     │
│  │ Frontend │ ── │ Backend  │     │
│  │ Next.js  │    │  Flask   │     │
│  │  :3000   │    │  :5000   │     │
│  └──────────┘    └────┬─────┘     │
│                       │             │
│                  ┌────▼──────┐     │
│                  │ PostgreSQL│     │
│                  │   :5432   │     │
│                  └───────────┘     │
│                                     │
│  Volumes (Persistent):              │
│  • postgres_data                    │
│  • backend_cache                    │
│  • chromadb_data                    │
└─────────────────────────────────────┘
```

## Production Deployment

### Build for Production

```bash
# Set production environment variables
export FLASK_ENV=production
export NODE_ENV=production

# Update .env with production URLs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
GITHUB_OAUTH_CALLBACK=https://yourdomain.com/auth/github/callback

# Build and deploy
docker compose build
docker compose up -d
```

### Security Checklist

- ✅ Use strong, unique secrets (32+ characters)
- ✅ Enable HTTPS (use reverse proxy like nginx)
- ✅ Regular backups of volumes
- ✅ Keep Docker images updated
- ✅ Restrict database access
- ✅ Use environment-specific .env files

## Performance

### Resource Usage

- **CPU**: ~2 cores recommended
- **RAM**: ~4GB recommended
- **Disk**: ~10GB for images + data

### Optimization

```yaml
# Add to docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

## Next Steps

After startup:

1. **Open**: http://localhost:3000
2. **Login**: Use GitHub OAuth
3. **Create Project**: Connect your repository
4. **Analyze**: AI detects agents and tools
5. **Test**: Generate comprehensive test suites
6. **Search**: Press Ctrl+K for global search

## Documentation

- [Complete Docker Guide](DOCKER_QUICKSTART.md) - Detailed instructions
- [RAG Search System](RAG_SEARCH.md) - Search implementation
- [Setup Guide](SETUP_GUIDE.md) - Manual setup
- [Getting Started](GETTING_STARTED.md) - Usage guide

## Support

Issues? Try these:

1. **View logs**: `make logs`
2. **Check status**: `docker compose ps`
3. **Restart**: `make restart`
4. **Clean rebuild**: `make clean && make build && make up`
5. **Complete reset**: `make reset`

---

**Ready to build better AI agents?** 🚀

Run `make start` and visit http://localhost:3000
