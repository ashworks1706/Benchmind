#!/usr/bin/env fish

# AI Agent Testing Framework - Quick Start Script
# This script sets up and starts all services using Docker Compose

echo "🚀 Starting AI Agent Testing Framework..."
echo ""

# Check if Docker is installed
if not command -v docker &> /dev/null
    echo "❌ Error: Docker is not installed."
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
end

# Check if Docker Compose is available
if not docker compose version &> /dev/null
    echo "❌ Error: Docker Compose is not available."
    echo "Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
end

# Check for .env file
if not test -f .env
    echo "⚠️  Warning: No .env file found. Creating from .env.example..."
    if test -f .env.example
        cp .env.example .env
        echo "✅ Created .env file. Please edit it with your API keys."
    else
        echo "📝 Creating basic .env file..."
        echo "# GitHub OAuth Configuration" > .env
        echo "GITHUB_OAUTH_CLIENT_ID=your_github_oauth_client_id" >> .env
        echo "GITHUB_OAUTH_CLIENT_SECRET=your_github_oauth_client_secret" >> .env
        echo "GITHUB_OAUTH_CALLBACK=http://localhost:5000/auth/github/callback" >> .env
        echo "" >> .env
        echo "# API Keys" >> .env
        echo "GEMINI_API_KEY=your_gemini_api_key" >> .env
        echo "GITHUB_TOKEN=your_github_personal_access_token" >> .env
        echo "" >> .env
        echo "# Security (auto-generated if not provided)" >> .env
        echo "JWT_SECRET=change_this_secret_in_production" >> .env
        echo "ENCRYPTION_SECRET=change_this_secret_in_production" >> .env
        echo "" >> .env
        echo "# Frontend Configuration" >> .env
        echo "NEXT_PUBLIC_API_URL=http://localhost:5000" >> .env
        echo "✅ Created .env file. Please edit it with your API keys."
    end
    echo ""
    echo "⏸️  Pausing. Please edit the .env file with your credentials, then run this script again."
    exit 0
end

# Stop any running containers
echo "🛑 Stopping any running containers..."
docker compose down

# Build and start services
echo ""
echo "🔨 Building Docker images (this may take a few minutes on first run)..."
docker compose build

echo ""
echo "🚀 Starting all services..."
docker compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to start..."
sleep 5

# Check service health
echo ""
echo "🔍 Checking service health..."

# Check PostgreSQL
if docker compose ps postgres | grep -q "healthy"
    echo "✅ PostgreSQL is running"
else
    echo "⚠️  PostgreSQL is starting..."
end

# Check Backend
if docker compose ps backend | grep -q "Up"
    echo "✅ Backend API is running"
else
    echo "⚠️  Backend API is starting..."
end

# Check Frontend
if docker compose ps frontend | grep -q "Up"
    echo "✅ Frontend is running"
else
    echo "⚠️  Frontend is starting..."
end

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✨ AI Agent Testing Framework is starting!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📊 Service URLs:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:5000"
echo "   Database:  postgresql://postgres:postgres@localhost:5432/ai_agent_benchmark"
echo ""
echo "🔧 Useful Commands:"
echo "   View logs:       docker compose logs -f"
echo "   View backend:    docker compose logs -f backend"
echo "   View frontend:   docker compose logs -f frontend"
echo "   Stop services:   docker compose down"
echo "   Restart:         docker compose restart"
echo "   Reset data:      docker compose down -v"
echo ""
echo "📝 Next Steps:"
echo "   1. Wait ~30 seconds for all services to fully initialize"
echo "   2. Open http://localhost:3000 in your browser"
echo "   3. Configure your GitHub OAuth credentials in .env if needed"
echo ""
echo "💡 Tip: Press Ctrl+K in the app for global search across all your data!"
echo "═══════════════════════════════════════════════════════════"

# Optionally follow logs
echo ""
read -P "Would you like to follow the logs? (y/N): " -n 1 follow_logs
if test "$follow_logs" = "y" -o "$follow_logs" = "Y"
    echo ""
    docker compose logs -f
end
