# 🎯 Getting Started - AI Agent Testing Framework

**A comprehensive interactive framework for testing and visualizing LangChain AI agents**

---

## ⚡ TL;DR - Quick Start

```fish
# 1. Run setup
./setup.fish

# 2. Get API keys (see below) and add to backend/.env

# 3. Start servers (in separate terminals)
./start-backend.fish
./start-frontend.fish

# 4. Open http://localhost:3000
```

---

## 📦 What You Need

### Required
- **Python 3.9+** - Backend server
- **Node.js 18+** - Frontend server
- **Gemini API Key** - AI analysis (free tier available)
- **GitHub Token** - Repository access (free)

### Get API Keys

**Gemini API Key** (2 minutes):
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key

**GitHub Token** (2 minutes):
1. Visit: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: "AI Agent Testing"
4. Check: `repo` (all sub-options)
5. Generate and copy token

---

## 🚀 Installation

### Step 1: Clone & Setup

```fish
# If not already in project directory
cd /home/ash/projects/calhacks-2025

# Run automated setup
./setup.fish
```

This will:
- ✅ Check Python & Node.js
- ✅ Create Python virtual environment
- ✅ Install backend dependencies
- ✅ Install frontend dependencies
- ✅ Create .env files

### Step 2: Add API Keys

Edit `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_key_here
GITHUB_TOKEN=your_github_token_here
FLASK_ENV=development
PORT=5000
```

⚠️ **Important:** No quotes, no spaces around the `=` sign

---

## ▶️ Running the App

### Terminal 1 - Backend
```fish
./start-backend.fish
```
Wait for: `Running on http://127.0.0.1:5000`

### Terminal 2 - Frontend
```fish
./start-frontend.fish
```
Wait for: `Ready on http://localhost:3000`

### Access the App
Open your browser: **http://localhost:3000**

---

## 🎮 How to Use

### 1. Landing Page
- Read about features
- Check pricing
- Click "Get Started" or "Dashboard"

### 2. Submit Repository
- Enter a GitHub URL (must use LangChain)
- Example: `langchain-ai/langchain`
- Click "Submit"
- Wait 30-60 seconds for analysis

### 3. Explore Visualization
**Canvas (Left Panel):**
- 🤖 Blue nodes = Agents
- 🔧 Tool nodes = Functions
- ➡️ Arrows = Connections
- Zoom/pan controls
- Click any node for details

**Status Sidebar (Right Panel):**
- Real-time progress messages
- "Start Testing" button
- Test results

### 4. View Details
**Click an Agent:**
- See configuration
- Edit prompt/instructions
- Adjust hyperparameters
- View tools used

**Click a Tool:**
- See implementation
- Edit code
- View parameters

### 5. Run Tests
1. Click "Start Testing"
2. Watch 10 tests execute
3. See real-time highlighting
4. Review results
5. Read recommendations
6. Apply fixes

---

## 📊 What Gets Tested

1. **Hyperparameters** - Model settings optimization
2. **Prompt Injection** - Security vulnerabilities
3. **Tool Calling** - Correct function usage
4. **Relationships** - Agent interactions
5. **Collaboration** - Multi-agent tasks
6. **Error Handling** - Invalid inputs
7. **Output Quality** - Response evaluation
8. **Performance** - Speed metrics
9. **Edge Cases** - Boundary conditions
10. **Security** - Vulnerability scanning

---

## 🏗️ Project Structure

```
calhacks-2025/
├── backend/              Flask API (Python)
│   ├── app.py           Main server & routes
│   ├── services/        Business logic
│   │   ├── github_scraper.py    Get repo files
│   │   ├── agent_parser.py      AI analysis
│   │   ├── test_generator.py    Create & run tests
│   │   └── code_editor.py       Manage changes
│   └── .env             API keys (YOU CREATE THIS)
│
├── frontend/            Next.js app (React/TS)
│   ├── app/            Pages & routing
│   ├── components/     UI components
│   ├── lib/            API client & state
│   └── types/          TypeScript definitions
│
└── Documentation files (README, guides, etc.)
```

---

## 🔧 Common Issues & Fixes

### "Cannot find module" (Backend)
```fish
cd backend
source venv/bin/activate.fish
pip install -r requirements.txt
```

### "Cannot find module" (Frontend)
```fish
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### "Invalid API key"
- Check `backend/.env` file exists
- Verify keys are correct (no quotes/spaces)
- Restart backend server

### "Port already in use"
**Backend:**
- Change `PORT=5001` in `backend/.env`
- Update `NEXT_PUBLIC_API_URL` in `frontend/.env.local`

**Frontend:**
- Run: `npm run dev -- -p 3001`

### Tests not running
- Make sure backend is running
- Check browser console for errors
- Verify API connection in Network tab

---

## 💡 Tips & Best Practices

### For Best Results:
1. **Use smaller repositories first** - Faster analysis
2. **Check repository has LangChain** - Look for agent definitions
3. **Wait for complete analysis** - Don't rush
4. **Explore before testing** - Understand the graph first
5. **Read test results carefully** - Valuable insights

### Example Repositories to Try:
- `langchain-ai/langchain-template` (small, fast)
- `langchain-ai/chat-langchain` (chatbot example)
- Any repo with `from langchain` imports

---

## 📚 Documentation Files

- **README.md** - Complete overview
- **SETUP_GUIDE.md** - This file (detailed setup)
- **QUICKSTART.md** - Minimal quick reference
- **WORKFLOW.md** - Detailed user journey
- **IMPLEMENTATION.md** - What was built
- **backend/README.md** - Backend API docs
- **frontend/README.md** - Frontend docs

---

## 🎯 Success Checklist

Before starting:
- [ ] Python 3.9+ installed
- [ ] Node.js 18+ installed
- [ ] Gemini API key obtained
- [ ] GitHub token created

After setup:
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] `.env` file created with API keys
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Browser showing landing page

First test:
- [ ] Submitted a GitHub URL
- [ ] Saw analysis progress messages
- [ ] Graph appeared with agents/tools
- [ ] Clicked on a node
- [ ] Details panel showed
- [ ] Started testing
- [ ] Tests ran with highlighting
- [ ] Results appeared

---

## 🚨 Need Help?

1. **Check terminal output** - Look for error messages
2. **Verify both servers running** - Backend + Frontend
3. **Test API connection** - Visit http://localhost:5000/health
4. **Check browser console** - F12 → Console tab
5. **Review this guide** - Recheck each step

---

## 🎉 You're All Set!

If you've completed the setup checklist above, you're ready to start testing AI agents!

**Next:** Open http://localhost:3000 and submit your first repository!

---

**Built for CalHacks 2025** 🚀

*Questions? Check WORKFLOW.md for detailed usage guide*
