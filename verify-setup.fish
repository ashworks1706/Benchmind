#!/usr/bin/env fish

# Docker Setup Verification Script
# Checks if everything is properly configured

echo "🔍 Docker Setup Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

set -l checks_passed 0
set -l checks_total 0

function check
    set -l checks_total (math $checks_total + 1)
    echo -n "  $argv[1]... "
    
    if eval $argv[2]
        echo "✅"
        set checks_passed (math $checks_passed + 1)
        return 0
    else
        echo "❌"
        if test (count $argv) -ge 3
            echo "    💡 $argv[3]"
        end
        return 1
    end
end

echo "📦 Checking Docker Installation"
check "Docker installed" "command -v docker &> /dev/null" "Install Docker: https://docs.docker.com/get-docker/"
check "Docker Compose installed" "command -v docker-compose &> /dev/null" "Install Docker Compose: https://docs.docker.com/compose/install/"
check "Docker daemon running" "docker info &> /dev/null" "Start Docker daemon"
echo ""

echo "📁 Checking Required Files"
check "docker-compose.yml exists" "test -f docker-compose.yml"
check ".env.example exists" "test -f .env.example"
check "backend/Dockerfile exists" "test -f backend/Dockerfile"
check "frontend/Dockerfile exists" "test -f frontend/Dockerfile"
check "Makefile exists" "test -f Makefile"
echo ""

echo "🔐 Checking Environment Configuration"
if test -f .env
    echo "  ✅ .env file exists"
    
    # Check for required variables
    set -l required_vars GITHUB_OAUTH_CLIENT_ID GITHUB_OAUTH_CLIENT_SECRET GEMINI_API_KEY GITHUB_TOKEN JWT_SECRET ENCRYPTION_SECRET
    
    for var in $required_vars
        if grep -q "^$var=" .env; and not grep -q "^$var=your_" .env; and not grep -q "^$var=\$" .env
            echo "  ✅ $var is set"
        else
            echo "  ⚠️  $var is not configured"
        end
    end
else
    echo "  ❌ .env file not found"
    echo "    💡 Run: cp .env.example .env"
end
echo ""

echo "📋 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker info &> /dev/null
    if test -f .env
        echo "✨ Docker setup is ready!"
        echo ""
        echo "Next steps:"
        echo "  1. Configure .env with your credentials"
        echo "  2. Run: make up"
        echo "  3. Visit: http://localhost:3000"
        echo ""
        echo "Quick commands:"
        echo "  make help    - Show all commands"
        echo "  make up      - Start all services"
        echo "  make logs    - View logs"
        echo "  make down    - Stop services"
    else
        echo "⚠️  Environment not configured"
        echo ""
        echo "Run these commands:"
        echo "  cp .env.example .env"
        echo "  # Edit .env with your credentials"
        echo "  make up"
    end
else
    echo "❌ Docker is not running"
    echo ""
    echo "Please start Docker and try again."
end

echo ""
