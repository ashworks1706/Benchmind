# AI Agent Testing Framework

An interactive web application that constructs an AI Agent visual editor from LangChain-based AI agent codebases by scraping GitHub repositories. Test, analyze, and improve your AI agents with comprehensive automated testing and real-time visualization.

## 🚀 Features

- **GitHub Repository Analysis**: Automatically scrape and analyze LangChain-based repositories
- **Interactive Visualization**: Zoomable/pannable canvas showing agents, tools, and relationships
- **Automated Testing**: Generate 10 comprehensive test cases covering:
  - Hyperparameter testing
  - Prompt injection attacks
  - Tool calling accuracy
  - Agent relationships and collaboration
  - Error handling
  - Output quality
  - Performance metrics
  - Security vulnerabilities
- **Real-time Code Editing**: Edit agent configurations and tool code with instant reflection
- **Smart Recommendations**: AI-powered fix suggestions with exact file locations
- **Live Testing Dashboard**: Watch tests run with real-time highlighting

## 🏗️ Architecture

### Backend (Flask + Python)
- **GitHub Scraper**: Fetches and parses repository files
- **Agent Parser**: Uses Gemini AI to extract agent configurations, tools, and relationships
- **Test Generator**: Creates and executes comprehensive test cases
- **Code Editor**: Manages code changes and applies fixes

### Frontend (Next.js + React)
- **Landing Page**: Feature-rich presentation with pricing
- **Dashboard**: Main workspace with canvas and panels
- **Canvas**: Interactive visualization using ReactFlow
- **Status Panel**: Real-time progress and test results
- **Details Panel**: Editable agent/tool information

## 📋 Prerequisites

- Python 3.9+
- Node.js 18+
- Gemini API Key
- GitHub Personal Access Token

## 🛠️ Setup

### 🐳 Docker Setup (Recommended)

The easiest way to run the application is using Docker:

```bash
# 1. Setup environment
make setup
# Edit .env and add your credentials

# 2. Start all services (PostgreSQL, Backend, Frontend)
make up

# 3. Access the application
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
```

**Quick Docker Commands:**
```bash
make up           # Start all services
make down         # Stop all services
make logs         # View logs
make db-init      # Initialize database
make rebuild      # Rebuild and restart
make help         # Show all commands
```

See [DOCKER.md](./DOCKER.md) for complete Docker documentation.

### 📦 Manual Setup (Alternative)

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup PostgreSQL
createdb ai_agent_benchmark

# Setup environment variables
cp .env.example .env
# Edit .env and add your API keys + database URL

# Initialize database
python init_db.py
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables (optional)
# Frontend will use http://localhost:5000 by default
```

## 🚀 Running the Application

### With Docker (Recommended)
```bash
# Start everything
make up

# View logs
make logs

# Stop everything
make down
```

### Manual Start

#### Start Backend
```bash
cd backend
source venv/bin/activate
python app.py
# Backend runs on http://localhost:5000
```

#### Start Frontend
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

## 📖 Usage

1. **Navigate to** `http://localhost:3000`
2. **Click** "Dashboard" or "Get Started"
3. **Enter** a GitHub repository URL containing LangChain agents
4. **Submit** and watch as the system:
   - Scrapes the repository
   - Analyzes agents and tools
   - Visualizes the architecture
5. **Explore** the interactive canvas:
   - Click agents to view/edit configurations
   - Click tools to view/edit code
   - Click relationships to understand connections
6. **Click "Start Testing"** to:
   - Generate 10 test cases
   - Watch tests run with live highlighting
   - Review results and recommendations
7. **Apply Fixes** with one click

## 🎯 API Endpoints

### Backend API

- `GET /health` - Health check
- `POST /api/analyze-repo` - Analyze GitHub repository
  ```json
  {
    "github_url": "https://github.com/user/repo"
  }
  ```
- `POST /api/generate-tests` - Generate test cases
- `POST /api/run-test` - Execute a test case
- `POST /api/apply-fix` - Apply suggested fix
- `POST /api/update-agent` - Update agent configuration

## 📁 Project Structure

```
calhacks-2025/
├── backend/
│   ├── app.py                   # Main Flask application
│   ├── config.py               # Configuration
│   ├── requirements.txt        # Python dependencies
│   ├── services/
│   │   ├── github_scraper.py   # Repository scraping
│   │   ├── agent_parser.py     # AI-powered parsing
│   │   ├── test_generator.py   # Test generation & execution
│   │   └── code_editor.py      # Code management
│   └── .env.example
│
└── frontend/
    ├── app/
    │   ├── layout.tsx           # Root layout
    │   ├── page.tsx            # Landing page
    │   ├── globals.css         # Global styles
    │   └── dashboard/
    │       └── page.tsx        # Dashboard
    ├── components/
    │   ├── Navbar.tsx          # Navigation
    │   ├── LandingPage.tsx     # Landing content
    │   ├── Dashboard.tsx       # Main dashboard
    │   ├── Canvas.tsx          # Interactive visualization
    │   ├── StatusPanel.tsx     # Status & results
    │   ├── DetailsPanel.tsx    # Details editor
    │   └── ui/
    │       └── ScrollArea.tsx  # UI components
    ├── lib/
    │   ├── api.ts              # API client
    │   └── store.ts            # State management
    ├── types/
    │   └── index.ts            # TypeScript types
    ├── package.json
    └── .env.local
```

## 🧪 Testing Features

The framework generates 10 types of test cases:

1. **Hyperparameter Testing**: Test different model configurations
2. **Prompt Injection**: Security testing for vulnerabilities
3. **Tool Calling**: Verify correct tool usage
4. **Relationship Validation**: Test agent interactions
5. **Collaborative Behavior**: Multi-agent task testing
6. **Error Handling**: Invalid input handling
7. **Output Quality**: Response quality evaluation
8. **Performance**: Response time and resource usage
9. **Edge Cases**: Boundary condition testing
10. **Security**: Security vulnerability scanning

## 🎨 Tech Stack

### Backend
- Flask (Web framework)
- Google Gemini AI (Agent analysis)
- PyGithub (Repository access)
- LangChain (Agent understanding)

### Frontend
- Next.js 16 (React framework)
- TypeScript (Type safety)
- Tailwind CSS (Styling)
- ReactFlow (Canvas visualization)
- Zustand (State management)
- Framer Motion (Animations)
- Axios (API client)

## 🔑 Environment Variables

### Docker (.env in root directory)
```bash
# GitHub OAuth
GITHUB_OAUTH_CLIENT_ID=your_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_client_secret
GITHUB_OAUTH_CALLBACK=http://localhost:5000/auth/github/callback

# Security Secrets
JWT_SECRET=generate_with_python_secrets
ENCRYPTION_SECRET=generate_with_python_secrets

# API Keys
GEMINI_API_KEY=your_gemini_api_key
GITHUB_TOKEN=your_github_token

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Manual Setup - Backend (.env)
```bash
# Flask Configuration
FLASK_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://localhost/ai_agent_benchmark

# GitHub OAuth
GITHUB_OAUTH_CLIENT_ID=your_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_client_secret
GITHUB_OAUTH_CALLBACK=http://localhost:5000/auth/github/callback

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_SECRET=your_encryption_secret

# API Keys
GEMINI_API_KEY=your_gemini_api_key
GITHUB_TOKEN=your_github_token
```

### Frontend (.env.local) - Optional
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Generate secrets with:**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

## 🤝 Contributing

This project was built for CalHacks 2025. Contributions are welcome!

## 📝 License

MIT License

## 🙏 Acknowledgments

- Google Gemini AI for powering the analysis
- LangChain for agent framework
- CalHacks 2025 organizers

---

Built with ❤️ for CalHacks 2025
