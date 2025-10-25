#!/usr/bin/env fish

# Quick start script for AI Agent Benchmark
# This script helps you get started with Docker setup

echo "🚀 AI Agent Benchmark - Quick Start"
echo ""

# Check for Docker
if not command -v docker &> /dev/null
    echo "❌ Docker is not installed."
    echo "   Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
end

if not command -v docker-compose &> /dev/null
    echo "❌ Docker Compose is not installed."
    echo "   Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
end

echo "✅ Docker and Docker Compose found"
echo ""

# Check if .env exists
if not test -f .env
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    
    # Generate secrets
    set JWT_SECRET (python3 -c "import secrets; print(secrets.token_hex(32))")
    set ENCRYPTION_SECRET (python3 -c "import secrets; print(secrets.token_hex(32))")
    
    # Update .env with generated secrets (macOS compatible)
    if test (uname) = "Darwin"
        # macOS
        sed -i '' "s/JWT_SECRET=your_jwt_secret_here/JWT_SECRET=$JWT_SECRET/" .env
        sed -i '' "s/ENCRYPTION_SECRET=your_encryption_secret_here/ENCRYPTION_SECRET=$ENCRYPTION_SECRET/" .env
    else
        # Linux
        sed -i "s/JWT_SECRET=your_jwt_secret_here/JWT_SECRET=$JWT_SECRET/" .env
        sed -i "s/ENCRYPTION_SECRET=your_encryption_secret_here/ENCRYPTION_SECRET=$ENCRYPTION_SECRET/" .env
    end
    
    echo "✅ .env file created with auto-generated secrets"
    echo ""
    echo "⚠️  IMPORTANT: You still need to configure:"
    echo "   1. GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET"
    echo "   2. GEMINI_API_KEY"
    echo "   3. GITHUB_TOKEN"
    echo ""
    echo "   Edit .env to add these values."
    echo ""
    
    read -P "📝 Press Enter to open .env in your editor, or Ctrl+C to skip: "
    $EDITOR .env 2>/dev/null || nano .env 2>/dev/null || vim .env 2>/dev/null || echo "Please edit .env manually"
else
    echo "✅ .env file already exists"
end

echo ""
read -P "🐳 Build and start Docker containers? (y/N): " -n 1 response
echo

if string match -qi "y" $response
    echo "🏗️  Building Docker containers (this may take a few minutes)..."
    docker-compose build
    
    if test $status -eq 0
        echo "✅ Build successful!"
        echo ""
        echo "🚀 Starting services..."
        docker-compose up -d
        
        if test $status -eq 0
            echo ""
            echo "✨ All services started successfully!"
            echo ""
            echo "📍 Access points:"
            echo "   🌐 Frontend:  http://localhost:3000"
            echo "   🔧 Backend:   http://localhost:5000"
            echo "   🗄️  Database:  localhost:5432"
            echo ""
            echo "📊 View logs:     docker-compose logs -f"
            echo "🛑 Stop services: docker-compose down"
            echo ""
            echo "For more commands, see: make help"
            echo ""
            
            # Wait a bit for services to fully start
            sleep 3
            
            # Open browser
            read -P "🌐 Open http://localhost:3000 in browser? (y/N): " -n 1 open_browser
            echo
            if string match -qi "y" $open_browser
                if command -v xdg-open &> /dev/null
                    xdg-open http://localhost:3000 &> /dev/null &
                else if command -v open &> /dev/null
                    open http://localhost:3000 &> /dev/null &
                else
                    echo "Please open http://localhost:3000 in your browser"
                end
            end
        else
            echo "❌ Failed to start services"
            echo "   Check logs: docker-compose logs"
            exit 1
        end
    else
        echo "❌ Build failed"
        echo "   Check the error messages above"
        exit 1
    end
else
    echo "⏭️  Skipping Docker setup"
    echo ""
    echo "To start manually later, run:"
    echo "  docker-compose up -d"
end

echo ""
echo "📚 Documentation:"
echo "   Docker Guide: ./DOCKER.md"
echo "   Backend:      ./backend/README.md"
echo "   Commands:     make help"
echo ""
