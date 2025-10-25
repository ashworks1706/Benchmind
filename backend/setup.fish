#!/usr/bin/env fish
# Setup script for AI Agent Benchmark backend (Fish shell)

echo "🚀 Setting up AI Agent Benchmark Backend..."
echo ""

# Check for Python
if not command -v python3 &> /dev/null
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
end

echo "✅ Python found: "(python3 --version)

# Check for PostgreSQL
if not command -v psql &> /dev/null
    echo "⚠️  PostgreSQL is not installed."
    echo "   Please install PostgreSQL:"
    echo "   - macOS: brew install postgresql"
    echo "   - Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "   - Fedora: sudo dnf install postgresql-server postgresql-contrib"
    exit 1
end

echo "✅ PostgreSQL found: "(psql --version)

# Create virtual environment if it doesn't exist
if not test -d "venv"
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
end

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate.fish

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "✅ Dependencies installed"

# Check if .env exists
if not test -f ".env"
    echo ""
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    
    # Generate secrets
    set JWT_SECRET (python3 -c "import secrets; print(secrets.token_hex(32))")
    set ENCRYPTION_SECRET (python3 -c "import secrets; print(secrets.token_hex(32))")
    
    # Update .env with generated secrets
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
    echo "   1. DATABASE_URL (if not using default)"
    echo "   2. GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET"
    echo "   3. GEMINI_API_KEY"
    echo "   4. GITHUB_TOKEN"
    echo ""
    echo "   Edit backend/.env to add these values."
else
    echo "✅ .env file already exists"
end

# Create database
echo ""
read -P "📊 Create PostgreSQL database 'ai_agent_benchmark'? (y/N): " -n 1 response
echo
if string match -qi "y" $response
    if psql -lqt | cut -d \| -f 1 | grep -qw ai_agent_benchmark
        echo "⚠️  Database 'ai_agent_benchmark' already exists"
        read -P "   Drop and recreate? (y/N): " -n 1 recreate
        echo
        if string match -qi "y" $recreate
            dropdb ai_agent_benchmark
            createdb ai_agent_benchmark
            echo "✅ Database recreated"
        end
    else
        createdb ai_agent_benchmark
        echo "✅ Database 'ai_agent_benchmark' created"
    end
    
    # Initialize database schema
    echo "🔨 Creating database tables..."
    python3 init_db.py
    echo "✅ Database tables created"
else
    echo "⏭️  Skipping database creation"
end

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
