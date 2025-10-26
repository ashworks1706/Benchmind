.PHONY: help build up down logs restart clean reset backend-shell frontend-shell db-shell db-backup db-restore test rag-index rag-stats

# Default target
help:
	@echo "🐳 AI Agent Benchmark - Docker Commands"
	@echo ""
	@echo "🚀 Quick Start:"
	@echo "  make start          - Complete startup (setup + build + up)"
	@echo ""
	@echo "Setup:"
	@echo "  make setup          - Initial setup (copy .env, generate secrets)"
	@echo "  make build          - Build all containers"
	@echo "  make up             - Start all services"
	@echo "  make down           - Stop all services"
	@echo ""
	@echo "Development:"
	@echo "  make logs           - View all logs (follow mode)"
	@echo "  make restart        - Restart all services"
	@echo "  make rebuild        - Rebuild and restart all services"
	@echo ""
	@echo "Services:"
	@echo "  make backend        - Start only backend + db"
	@echo "  make frontend       - Start only frontend"
	@echo "  make postgres       - Start only postgres"
	@echo ""
	@echo "Shell Access:"
	@echo "  make backend-shell  - Open shell in backend container"
	@echo "  make frontend-shell - Open shell in frontend container"
	@echo "  make db-shell       - Open PostgreSQL CLI"
	@echo ""
	@echo "Database:"
	@echo "  make db-init        - Initialize database tables"
	@echo "  make db-reset       - Drop and recreate database"
	@echo "  make db-backup      - Backup database to backup.sql"
	@echo "  make db-restore     - Restore database from backup.sql"
	@echo ""
	@echo "RAG Search:"
	@echo "  make rag-index      - Index documentation into RAG system"
	@echo "  make rag-stats      - Show RAG database statistics"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean          - Stop and remove containers"
	@echo "  make reset          - Remove everything (containers, volumes, images)"
	@echo ""
	@echo "Testing:"
	@echo "  make test           - Run all tests"
	@echo "  make test-backend   - Run backend tests"
	@echo "  make test-frontend  - Run frontend tests"

# Quick start - complete setup
start: setup build up
	@echo ""
	@echo "✨ All services started!"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Backend:  http://localhost:5000"
	@echo ""
	@echo "💡 Press Ctrl+K in the app for global search!"

# Initial setup
setup:
	@echo "🔧 Setting up environment..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ Created .env file from template"; \
		echo "⚠️  Please edit .env and add your credentials"; \
	else \
		echo "⚠️  .env already exists, skipping..."; \
	fi
	@echo ""
	@echo "Generate secrets with:"
	@echo "  python3 -c \"import secrets; print('JWT_SECRET=' + secrets.token_hex(32))\""
	@echo "  python3 -c \"import secrets; print('ENCRYPTION_SECRET=' + secrets.token_hex(32))\""

# Build containers
build:
	@echo "🏗️  Building containers..."
	docker-compose build

# Start services
up:
	@echo "🚀 Starting all services..."
	docker-compose up -d
	@echo ""
	@echo "✅ Services started!"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Backend:  http://localhost:5000"
	@echo "   PostgreSQL: localhost:5432"
	@echo ""
	@echo "View logs: make logs"

# Start with logs
up-logs:
	@echo "🚀 Starting all services with logs..."
	docker-compose up

# Stop services
down:
	@echo "🛑 Stopping all services..."
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# View specific service logs
logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-postgres:
	docker-compose logs -f postgres

# Restart services
restart:
	@echo "🔄 Restarting all services..."
	docker-compose restart

# Rebuild and restart
rebuild:
	@echo "🔨 Rebuilding and restarting..."
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	@echo "✅ Services rebuilt and restarted!"

# Start specific services
backend:
	@echo "🚀 Starting backend + postgres..."
	docker-compose up -d postgres backend

frontend:
	@echo "🚀 Starting frontend..."
	docker-compose up -d frontend

postgres:
	@echo "🚀 Starting postgres..."
	docker-compose up -d postgres

# Shell access
backend-shell:
	@echo "🐚 Opening backend shell..."
	docker-compose exec backend bash

frontend-shell:
	@echo "🐚 Opening frontend shell..."
	docker-compose exec frontend sh

db-shell:
	@echo "🐚 Opening PostgreSQL CLI..."
	docker-compose exec postgres psql -U postgres -d ai_agent_benchmark

# Database operations
db-init:
	@echo "📊 Initializing database..."
	docker-compose exec backend python init_db.py

db-reset:
	@echo "⚠️  Resetting database..."
	docker-compose exec backend python init_db.py --drop --force
	@echo "✅ Database reset complete!"

db-backup:
	@echo "💾 Backing up database..."
	docker-compose exec postgres pg_dump -U postgres ai_agent_benchmark > backup.sql
	@echo "✅ Database backed up to backup.sql"

db-restore:
	@echo "📥 Restoring database from backup..."
	@if [ -f backup.sql ]; then \
		cat backup.sql | docker-compose exec -T postgres psql -U postgres ai_agent_benchmark; \
		echo "✅ Database restored!"; \
	else \
		echo "❌ backup.sql not found!"; \
		exit 1; \
	fi

# Testing
test:
	@echo "🧪 Running all tests..."
	docker-compose exec backend pytest
	docker-compose exec frontend npm test

test-backend:
	@echo "🧪 Running backend tests..."
	docker-compose exec backend pytest

test-frontend:
	@echo "🧪 Running frontend tests..."
	docker-compose exec frontend npm test

# Status
status:
	@echo "📊 Service Status:"
	@docker-compose ps

# Health check
health:
	@echo "🏥 Health Check:"
	@curl -s http://localhost:5000/health | jq . || echo "Backend not responding"
	@curl -s http://localhost:3000 > /dev/null && echo "Frontend: ✅ Running" || echo "Frontend: ❌ Not responding"

# Clean up
clean:
	@echo "🧹 Cleaning up..."
	docker-compose down
	@echo "✅ Containers stopped and removed"

clean-volumes:
	@echo "⚠️  Removing containers and volumes..."
	docker-compose down -v
	@echo "✅ Containers and volumes removed"

# Complete reset
reset:
	@echo "⚠️  WARNING: This will remove all containers, volumes, and images!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v --rmi all; \
		echo "✅ Complete reset done!"; \
	else \
		echo "❌ Cancelled"; \
	fi

# Install dependencies (for development)
install-backend:
	@echo "📦 Installing backend dependencies..."
	docker-compose exec backend pip install -r requirements.txt

install-frontend:
	@echo "📦 Installing frontend dependencies..."
	docker-compose exec frontend npm install --force

# Show environment
show-env:
	@echo "🔍 Environment Variables:"
	@docker-compose exec backend env | grep -E "(FLASK|DATABASE|GITHUB|JWT|ENCRYPTION|GEMINI)" | sort

# RAG search operations
rag-index:
	@echo "📚 Indexing documentation into RAG system..."
	docker-compose exec backend python index_docs.py
	@echo "✅ Documentation indexed!"

rag-stats:
	@echo "📊 RAG Database Statistics:"
	@docker-compose exec backend python -c "from services.rag_service import get_rag_service; import json; print(json.dumps(get_rag_service().get_stats(), indent=2))"
