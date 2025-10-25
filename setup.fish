#!/usr/bin/env fish

# AI Agent Testing Framework - Setup Script (Fish Shell)

echo "🚀 Setting up AI Agent Testing Framework..."
echo ""

# Check if Python is installed
if not command -v python3 &> /dev/null
    echo "❌ Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
end

# Check if Node.js is installed
if not command -v node &> /dev/null
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
end

echo "✅ Prerequisites check passed"
echo ""

# Backend setup
echo "📦 Setting up backend..."
cd backend

if not test -d "venv"
    echo "Creating virtual environment..."
    python3 -m venv venv
end

echo "Activating virtual environment..."
source venv/bin/activate.fish

echo "Installing Python dependencies..."
pip install -r requirements.txt > /dev/null 2>&1

if not test -f ".env"
    echo "Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env and add your API keys:"
    echo "   - GEMINI_API_KEY"
    echo "   - GITHUB_TOKEN"
end

cd ..

# Frontend setup
echo ""
echo "📦 Setting up frontend..."
cd frontend

echo "Installing Node.js dependencies..."
npm install --force > /dev/null 2>&1

if not test -f ".env.local"
    echo "Creating .env.local file..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
end

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Edit backend/.env and add your API keys"
echo "2. Run 'npm run dev' in the frontend directory"
echo "3. Run 'python app.py' in the backend directory"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "Happy testing! 🎉"
