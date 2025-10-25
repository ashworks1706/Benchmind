# 🚀 Final Setup Instructions

## What's Been Built ✅

A complete **AI Agent Testing Framework** with:
- ✅ Flask backend with 6 API endpoints
- ✅ Next.js frontend with landing page and dashboard
- ✅ Interactive canvas visualization
- ✅ AI-powered code analysis using Gemini
- ✅ Comprehensive testing framework (10 test types)
- ✅ Real-time code editing
- ✅ Smart fix recommendations

---

## 📋 Quick Setup (5 Minutes)

### Prerequisites
- Python 3.9+ installed
- Node.js 18+ installed
- Git repository access

### Option 1: Automated Setup (Recommended)

```fish
# Using Fish shell
./setup.fish

# Or using Bash
./setup.sh
```

### Option 2: Manual Setup

**Backend:**
```fish
cd backend
python -m venv venv
source venv/bin/activate.fish  # or: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add API keys (see below)
```

**Frontend:**
```fish
cd frontend
npm install
# .env.local is already created with default values
```

---

## 🔑 Required API Keys

### 1. Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create/sign in to Google account
3. Click "Create API Key"
4. Copy the key

### 2. GitHub Token
1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name: "AI Agent Testing Framework"
4. Select scopes: `repo` (all checkboxes)
5. Click "Generate token"
6. Copy the token

### 3. Add to Backend .env File
Edit `backend/.env`:
```
GEMINI_API_KEY=your_gemini_api_key_here
GITHUB_TOKEN=your_github_token_here
FLASK_ENV=development
PORT=5000
```

---

## ▶️ Running the Application

### Terminal 1 - Backend
```fish
cd backend
source venv/bin/activate.fish
python app.py
```
✅ Backend runs on `http://localhost:5000`

### Terminal 2 - Frontend
```fish
cd frontend
npm run dev
```
✅ Frontend runs on `http://localhost:3000`

### Quick Start Scripts (Fish)
```fish
# Terminal 1
./start-backend.fish

# Terminal 2
./start-frontend.fish
```

---

## 🧪 Testing the Application

### 1. Open Browser
Navigate to: `http://localhost:3000`

### 2. Try It Out

**Test with a Sample LangChain Repository:**
Some example repositories you can try:
- `langchain-ai/langchain` (main repo - large)
- `hwchase17/langchain-template` (smaller template)
- Or any repository that uses LangChain agents

**Steps:**
1. Click "Dashboard" or "Get Started"
2. Enter GitHub URL
3. Click "Submit"
4. Wait for analysis (30-60 seconds)
5. Explore the interactive canvas
6. Click on agents/tools to see details
7. Click "Start Testing" to run tests
8. View results and recommendations

---

## 📁 Project Structure Overview

```
calhacks-2025/
├── backend/              # Flask API
│   ├── app.py           # Main server
│   ├── config.py        # Configuration
│   ├── services/        # Business logic
│   └── .env             # API keys (create this)
│
├── frontend/            # Next.js app
│   ├── app/            # Pages
│   ├── components/     # React components
│   ├── lib/            # Utils & state
│   └── types/          # TypeScript types
│
├── setup.fish          # Automated setup
├── start-backend.fish  # Run backend
├── start-frontend.fish # Run frontend
└── README.md           # Full documentation
```

---

## 🐛 Troubleshooting

### Backend Issues

**Import errors:**
```fish
cd backend
source venv/bin/activate.fish
pip install -r requirements.txt
```

**Port 5000 in use:**
Change PORT in `backend/.env`:
```
PORT=5001
```
And update `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### Frontend Issues

**Module not found:**
```fish
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Port 3000 in use:**
```fish
npm run dev -- -p 3001
```

### API Issues

**"Invalid API key":**
- Check `.env` file has correct keys
- No quotes around the keys
- No extra spaces

**"GitHub API rate limit":**
- Make sure GITHUB_TOKEN is set correctly
- Token needs `repo` scope

---

## ✨ Features to Try

1. **Landing Page**
   - Scroll through features
   - Check out pricing section

2. **Repository Analysis**
   - Submit a LangChain repo
   - Watch progress in sidebar
   - See agent graph appear

3. **Interactive Canvas**
   - Zoom in/out
   - Pan around
   - Click agents and tools

4. **Details Panel**
   - View agent configurations
   - Edit prompts and settings
   - Modify tool code
   - Save changes

5. **Testing**
   - Click "Start Testing"
   - Watch real-time highlighting
   - View detailed results
   - See fix recommendations

6. **Code Editing**
   - Edit agent parameters
   - Modify tool implementations
   - Track changes

---

## 📊 What to Expect

**Analysis Time:** 30-60 seconds
- Depends on repository size
- Shows progress in real-time

**Test Execution:** 10-20 seconds
- Generates 10 test cases
- Runs sequentially with highlighting
- Shows results immediately

**Visualization:**
- Agents shown as blue nodes with bot icon
- Tools shown as nodes with wrench icon
- Arrows show connections
- Colors indicate relationships

---

## 🎯 Next Steps After Setup

1. **Test with Real Repositories**
   - Find LangChain projects on GitHub
   - Analyze different agent architectures
   - Compare results

2. **Customize Testing**
   - Modify test generation prompts
   - Add new test categories
   - Adjust test criteria

3. **Enhance Visualization**
   - Customize node styles
   - Add more relationship types
   - Improve layout algorithm

4. **Deploy**
   - Set up production environment
   - Configure production API keys
   - Deploy to Vercel/Heroku

---

## 📚 Documentation

- **README.md** - Complete project overview
- **QUICKSTART.md** - Fast setup guide
- **IMPLEMENTATION.md** - What was built
- **WORKFLOW.md** - User journey details
- **backend/README.md** - Backend specifics
- **frontend/README.md** - Frontend specifics

---

## 🤝 Support

If you encounter issues:
1. Check troubleshooting section above
2. Verify API keys are correct
3. Check terminal for error messages
4. Ensure both servers are running

---

## 🎉 You're Ready!

Everything is set up and ready to go. Just:
1. Add your API keys to `backend/.env`
2. Run `./start-backend.fish` in one terminal
3. Run `./start-frontend.fish` in another terminal
4. Open `http://localhost:3000`
5. Start testing AI agents!

**Built for CalHacks 2025** 🚀
