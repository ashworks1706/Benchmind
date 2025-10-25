# AI Agent Testing Framework

This project is an interactive web application for testing and visualizing LangChain-based AI agents.

## Quick Start

### Automated Setup (Linux/Mac)
```bash
chmod +x setup.sh
./setup.sh
```

### Manual Setup

1. **Backend**:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your API keys
python app.py
```

2. **Frontend**:
```bash
cd frontend
npm install
npm run dev
```

3. Open `http://localhost:3000`

## Environment Variables

### Backend (.env)
```
GEMINI_API_KEY=your_key_here
GITHUB_TOKEN=your_token_here
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Features

✅ GitHub repository analysis
✅ Interactive agent visualization
✅ Automated testing (10 test types)
✅ Real-time code editing
✅ AI-powered recommendations
✅ Live testing dashboard

See [full README](README.md) for detailed documentation.
