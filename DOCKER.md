# AI Agent Benchmark - Docker Setup

Complete Docker setup for the AI Agent Benchmark platform with PostgreSQL database, Flask backend, and Next.js frontend.

## 🚀 Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+

### 1. Clone and Setup Environment

```bash
# Clone the repository
git clone <repository-url>
cd calhacks-2025

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` and add your credentials:

```bash
# GitHub OAuth (register at https://github.com/settings/developers)
GITHUB_OAUTH_CLIENT_ID=your_client_id_here
GITHUB_OAUTH_CLIENT_SECRET=your_client_secret_here

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here
GITHUB_TOKEN=your_github_personal_token_here

# Generate secrets with:
# python3 -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET=generated_secret_here
ENCRYPTION_SECRET=generated_secret_here
```

### 3. Start the Application

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **PostgreSQL**: localhost:5432

## 📦 Services

### PostgreSQL Database
- **Image**: postgres:16-alpine
- **Port**: 5432
- **Database**: ai_agent_benchmark
- **User/Password**: postgres/postgres
- **Volume**: postgres_data (persistent storage)

### Backend (Flask)
- **Port**: 5000
- **Features**:
  - GitHub OAuth authentication
  - PostgreSQL with SQLAlchemy ORM
  - Token encryption
  - Repository caching
  - Project management CRUD
  - AI-powered analysis

### Frontend (Next.js)
- **Port**: 3000
- **Features**:
  - React 18 with TypeScript
  - Tailwind CSS
  - GitHub OAuth integration
  - Project dashboard
  - Test visualization

## 🔧 Docker Commands

### Starting Services

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Build and start (after code changes)
docker-compose up --build

# Start specific service
docker-compose up backend
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (deletes database data)
docker-compose down -v

# Stop and remove everything including images
docker-compose down --rmi all -v
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Rebuilding Services

```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild without cache
docker-compose build --no-cache
```

### Accessing Containers

```bash
# Execute command in backend container
docker-compose exec backend bash

# Execute command in frontend container
docker-compose exec frontend sh

# Access PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d ai_agent_benchmark

# Run Python commands in backend
docker-compose exec backend python -c "print('Hello')"
```

## 🗄️ Database Management

### Initialize/Reset Database

```bash
# Initialize database tables
docker-compose exec backend python init_db.py

# Drop and recreate tables
docker-compose exec backend python init_db.py --drop --force
```

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres ai_agent_benchmark > backup.sql

# Restore from backup
cat backup.sql | docker-compose exec -T postgres psql -U postgres ai_agent_benchmark
```

### Access Database

```bash
# Using psql
docker-compose exec postgres psql -U postgres -d ai_agent_benchmark

# View tables
docker-compose exec postgres psql -U postgres -d ai_agent_benchmark -c "\dt"

# Query data
docker-compose exec postgres psql -U postgres -d ai_agent_benchmark -c "SELECT * FROM users;"
```

## 🔍 Troubleshooting

### Backend won't start

**Check logs:**
```bash
docker-compose logs backend
```

**Common issues:**
1. Missing environment variables - check `.env` file
2. Database not ready - wait for postgres healthcheck
3. Port 5000 already in use - stop other services or change port

### Frontend build fails

**Check Node.js version:**
```bash
docker-compose exec frontend node --version
```

**Clear cache and rebuild:**
```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up frontend
```

### Database connection errors

**Check if postgres is running:**
```bash
docker-compose ps postgres
```

**Check database health:**
```bash
docker-compose exec postgres pg_isready -U postgres
```

**Recreate database:**
```bash
docker-compose down -v
docker-compose up -d postgres
docker-compose exec backend python init_db.py
```

### Port conflicts

**If ports 3000, 5000, or 5432 are in use:**

Edit `docker-compose.yml`:
```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # Change host port
  backend:
    ports:
      - "5001:5000"
  postgres:
    ports:
      - "5433:5432"
```

### Permission errors (Linux)

```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Or run with sudo (not recommended)
sudo docker-compose up
```

## 🔐 Security Notes

### Development vs Production

**Current setup is for DEVELOPMENT only.** For production:

1. **Change default passwords:**
   ```yaml
   postgres:
     environment:
       POSTGRES_PASSWORD: strong_random_password_here
   ```

2. **Use secure secrets:**
   Generate strong secrets for JWT_SECRET and ENCRYPTION_SECRET

3. **Enable HTTPS:**
   - Use reverse proxy (nginx, traefik)
   - Configure SSL certificates

4. **Update OAuth callback:**
   ```
   GITHUB_OAUTH_CALLBACK=https://yourdomain.com/auth/github/callback
   ```

5. **Use production builds:**
   ```yaml
   backend:
     environment:
       FLASK_ENV: production
   ```

6. **Add resource limits:**
   ```yaml
   backend:
     deploy:
       resources:
         limits:
           cpus: '1'
           memory: 1G
   ```

## 📊 Monitoring

### Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# Detailed health info
docker inspect --format='{{json .State.Health}}' ai-agent-benchmark-backend | jq
```

### Resource Usage

```bash
# View resource usage
docker stats

# Service-specific stats
docker stats ai-agent-benchmark-backend
```

## 🧪 Development Workflow

### Hot Reload

Both frontend and backend support hot reload:

```bash
# Start in development mode
docker-compose up

# Edit files locally - changes will be reflected automatically
# Backend: Python files reload on save
# Frontend: Next.js auto-reloads
```

### Running Tests

```bash
# Backend tests
docker-compose exec backend pytest

# Frontend tests
docker-compose exec frontend npm test
```

### Installing Dependencies

```bash
# Backend - add to requirements.txt, then:
docker-compose exec backend pip install -r requirements.txt

# Frontend - add to package.json, then:
docker-compose exec frontend npm install
```

## 🌐 Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GITHUB_OAUTH_CLIENT_ID` | GitHub OAuth app client ID | Yes | - |
| `GITHUB_OAUTH_CLIENT_SECRET` | GitHub OAuth app secret | Yes | - |
| `GITHUB_OAUTH_CALLBACK` | OAuth callback URL | No | http://localhost:5000/auth/github/callback |
| `JWT_SECRET` | Secret for JWT signing | Yes | - |
| `ENCRYPTION_SECRET` | Secret for token encryption | Yes | - |
| `GEMINI_API_KEY` | Google Gemini API key | Yes | - |
| `GITHUB_TOKEN` | GitHub personal access token | Yes | - |
| `NEXT_PUBLIC_API_URL` | Backend API URL for frontend | No | http://localhost:5000 |
| `FLASK_ENV` | Flask environment | No | development |

## 📝 Docker Compose Override

Create `docker-compose.override.yml` for local customizations:

```yaml
version: '3.8'

services:
  backend:
    volumes:
      - ./my-custom-cache:/app/cache
    environment:
      DEBUG: "true"
  
  frontend:
    ports:
      - "3001:3000"
```

This file is automatically merged with `docker-compose.yml` and ignored by git.

## 🚢 Production Deployment

For production deployment, consider:

1. **Docker Swarm or Kubernetes** for orchestration
2. **Managed PostgreSQL** (AWS RDS, Google Cloud SQL)
3. **Container Registry** (Docker Hub, AWS ECR, GCR)
4. **Secrets Management** (AWS Secrets Manager, HashiCorp Vault)
5. **Load Balancer** for high availability
6. **CDN** for static assets

Example production docker-compose:

```yaml
version: '3.8'

services:
  backend:
    image: your-registry/ai-agent-backend:latest
    environment:
      FLASK_ENV: production
      DATABASE_URL: ${PRODUCTION_DATABASE_URL}
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)

## 📄 License

MIT
