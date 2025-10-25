#!/bin/bash

# AI Agent Testing Framework - Setup Script

echo "🚀 Setting up AI Agent Testing Framework..."
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Backend setup
echo "📦 Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -r requirements.txt > /dev/null 2>&1

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env and add your API keys:"
    echo "   - GEMINI_API_KEY"
    echo "   - GITHUB_TOKEN"
fi

cd ..

# Frontend setup
echo ""
echo "📦 Setting up frontend..."
cd frontend

echo "Installing Node.js dependencies..."
npm install > /dev/null 2>&1

if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
fi

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
