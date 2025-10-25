#!/bin/bash
# Setup script for AI Agent Benchmark backend

set -e  # Exit on error

echo "🚀 Setting up AI Agent Benchmark Backend..."
echo ""

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python found: $(python3 --version)"

# Check for PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed."
    echo "   Please install PostgreSQL:"
    echo "   - macOS: brew install postgresql"
    echo "   - Ubuntu/Debian: sudo apt install postgresql postgresql-contrib libpq-dev"
    echo "   - Fedora: sudo dnf install postgresql-server postgresql-contrib postgresql-devel"
    exit 1
fi

echo "✅ PostgreSQL found: $(psql --version)"

# Check for pg_config (required for psycopg2)
if ! command -v pg_config &> /dev/null; then
    echo "⚠️  pg_config is not installed (required for PostgreSQL driver)."
    echo "   Please install PostgreSQL development headers:"
    echo "   - macOS: brew install postgresql (should include pg_config)"
    echo "   - Ubuntu/Debian: sudo apt install libpq-dev"
    echo "   - Fedora: sudo dnf install postgresql-devel"
    echo "   - Arch: sudo pacman -S postgresql-libs"
    exit 1
fi

echo "✅ pg_config found: $(pg_config --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "✅ Dependencies installed"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    
    # Generate secrets
    JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    ENCRYPTION_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    
    # Update .env with generated secrets (macOS compatible sed)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/JWT_SECRET=your_jwt_secret_here/JWT_SECRET=$JWT_SECRET/" .env
        sed -i '' "s/ENCRYPTION_SECRET=your_encryption_secret_here/ENCRYPTION_SECRET=$ENCRYPTION_SECRET/" .env
    else
        sed -i "s/JWT_SECRET=your_jwt_secret_here/JWT_SECRET=$JWT_SECRET/" .env
        sed -i "s/ENCRYPTION_SECRET=your_encryption_secret_here/ENCRYPTION_SECRET=$ENCRYPTION_SECRET/" .env
    fi
    
    echo "✅ .env file created with auto-generated secrets"
    echo ""
    echo "⚠️  IMPORTANT: You still need to configure:"
    echo "   1. DATABASE_URL (if not using default)"
    echo "   2. GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET"
    echo "   3. GEMINI_API_KEY"
    echo "   4. GITHUB_TOKEN"
    echo ""
    echo "   Edit backend/.env to add these values."
else
    echo "✅ .env file already exists"
fi

# Create database
echo ""
read -p "📊 Create PostgreSQL database 'ai_agent_benchmark'? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if psql -lqt | cut -d \| -f 1 | grep -qw ai_agent_benchmark; then
        echo "⚠️  Database 'ai_agent_benchmark' already exists"
        read -p "   Drop and recreate? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            dropdb ai_agent_benchmark
            createdb ai_agent_benchmark
            echo "✅ Database recreated"
        fi
    else
        createdb ai_agent_benchmark
        echo "✅ Database 'ai_agent_benchmark' created"
    fi
    
    # Initialize database schema
    echo "🔨 Creating database tables..."
    python3 init_db.py
    echo "✅ Database tables created"
else
    echo "⏭️  Skipping database creation"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Configure your .env file (see backend/.env)"
echo "   2. Register a GitHub OAuth app at: https://github.com/settings/developers"
echo "      - Homepage URL: http://localhost:3000"
echo "      - Callback URL: http://localhost:5000/auth/github/callback"
echo "   3. Add the OAuth credentials to your .env file"
echo "   4. Start the backend: python app.py"
echo ""
