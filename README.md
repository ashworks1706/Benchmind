# Benchmind: Repository-Native AI Agent Analysis and Benchmarking Workspace

Benchmind is a full-stack workspace for analyzing and stress-testing LangChain-style agent repositories from GitHub, then turning those analyses into structured test sessions, benchmark reports, and fix recommendations. It is designed for engineers who need to inspect how an agent system is wired, run repeatable quality/performance/security-oriented evaluations, and review actionable remediation suggestions in one place. The system combines repository scraping, LLM-assisted structure extraction, simulated test execution, persistent project/session storage, and hybrid semantic search over analyses and reports.

## Problem

Most agent teams can answer “does the bot respond?” but struggle to answer “how reliable is this architecture over repeated scenarios, where does it fail, and what should we fix first?” Benchmind addresses that gap by turning repository structure into a testable representation of agents, tools, and relationships, then generating benchmark-oriented test suites and report artifacts that surface measurable pass/fail patterns, category-level weaknesses, and prioritized recommendations.

## System Overview

At runtime, Benchmind behaves as an asynchronous pipeline rather than a single request/response app. A user authenticates with GitHub, creates a project from a repository, and starts analysis for that project. The backend scrapes repository files, uses Gemini-based parsing to infer agent/tool/relationship structures, stores analysis artifacts in PostgreSQL, and optionally indexes them into ChromaDB. Testing sessions are then generated from the analysis, reviewed/edited, and executed in a lightweight simulation framework. Results are aggregated into report objects and rendered as interactive dashboards and research-style report pages with optional PDF export.

**Important caveat:** test execution is currently simulation-heavy. The framework models agent behavior from extracted configuration and metadata instead of executing the target repository as a live deployed service. Treat outputs as structured evaluation signals for architecture iteration, not as full production runtime validation.

The architecture is retrieval-and-structure first, then evaluation. Instead of benchmarking a raw chat endpoint directly, Benchmind benchmarks an extracted representation of a multi-agent system, which makes it useful for architecture review and iterative tuning workflows.

## What BenchMind Measures

Benchmind produces test outputs and report summaries around categories such as tool calling, reasoning, collaboration, relationship behavior, performance, error handling, and security-oriented checks. Generated tests include explicit benchmark fields and pass/fail logic, and report generation computes aggregate summaries, category averages, and recommendation bundles suitable for review sessions.

## End-to-End Data Flow

User input begins as project metadata and a repository URL. Benchmind then performs: (1) repository scraping, (2) LLM parsing into `agents`, `tools`, and `relationships`, (3) asynchronous progress tracking and persistence, (4) test suite generation with category-specific metrics and benchmarks, (5) simulated per-test execution and recommendation generation, and (6) report persistence and rendering. Searchability is added by indexing analyses and reports into ChromaDB collections and exposing a hybrid search endpoint consumed by the global Spotlight UI.

## Core Components

The backend is a Flask API with modules for GitHub scraping, Gemini-based parsing, test framework and test generation, code-edit/PR automation, token encryption, and RAG indexing/search. PostgreSQL stores users, projects, analyses, repository cache entries, and test sessions. The frontend is a Next.js app with authenticated project workflows, an interactive canvas for architecture visualization, testing controls, report pages, and keyboard-driven spotlight search.

## Integrations and Dependencies

Benchmind integrates with GitHub OAuth for authentication and repository discovery, GitHub API access for scraping and optional fix PR operations, Google Gemini models for parsing/test synthesis tasks, PostgreSQL via SQLAlchemy for durable state, and ChromaDB + FastEmbed for semantic indexing and retrieval. Frontend visualization and reporting rely on React/TypeScript, Zustand state management, Recharts charting, and jsPDF/html2canvas export tooling.

## Setup and Local Execution

Clone the repository and move into the project root:

```bash
git clone https://github.com/ashworks1706/Benchmind.git
cd Benchmind
```

Benchmind supports both Docker-first and manual startup. Docker is the recommended path because PostgreSQL, backend, and frontend are started together with persistent volumes.

Create `.env` from `.env.example`, fill required secrets (`GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`, `GEMINI_API_KEY`, `GITHUB_TOKEN`, plus strong `JWT_SECRET` and `ENCRYPTION_SECRET`), then run:

```bash
make start
```

Core service endpoints:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

Useful operational commands:

```bash
make logs
make down
make restart
make rag-index
make rag-stats
```

For manual development, set up backend and frontend separately:

```bash
# backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python init_db.py
python app.py

# frontend (new terminal)
cd ../frontend
npm install --legacy-peer-deps
npm run dev
```

## Operational Notes and Caveats

Benchmind is best treated as a research/prototyping benchmark workspace for agent architecture evaluation. Generated tests and metrics are useful for comparative iteration and triage, but they do not replace full production runtime observability. Some repository documentation and naming surfaces still reflect legacy names and evolving architecture conventions. In addition, a few API/documentation surfaces are in transition (for example, historical endpoint docs and newer project-scoped workflows), so use the active frontend flows and backend routes as the source of truth.

## Project Status

Benchmind is actively structured around project-scoped analyses, test session persistence, report workflows, and hybrid search. It includes CI container build checks and a working Docker development path. The codebase also contains signs of ongoing iteration (legacy docs, evolving route assumptions, and refactoring opportunities), so contributors should expect active cleanup rather than frozen interfaces.

## License

This project is distributed under the [MIT License](LICENSE).
