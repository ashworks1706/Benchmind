# Backend Requirements for Authentication & Project Management

## 🔐 Authentication Endpoints

### 1. GitHub OAuth Flow
```python
# POST /auth/github/login
- Redirect to GitHub OAuth with appropriate scopes
- Required scopes: read:user, user:email, repo

# GET /auth/github/callback?code=<code>
- Exchange code for access token
- Fetch user info from GitHub API
- Create or update user in database
- Return JWT token + user object
Response: {
  "user": {
    "id": "uuid",
    "githubId": "123456",
    "username": "octocat",
    "email": "octo@cat.com",
    "avatarUrl": "https://...",
    "accessToken": "ghp_..."
  }
}

# GET /auth/github/repos
- Requires: Authorization: Bearer <token>
- Fetch user's GitHub repositories
- Cache in database for performance
Response: GitHubRepo[]

# POST /auth/github/repos/refresh
- Requires: Authorization: Bearer <token>
- Force refresh repositories from GitHub API
- Update cache
Response: GitHubRepo[]
```

## 📁 Project Management Endpoints

### 2. Projects CRUD
```python
# GET /projects
- Requires: Authorization: Bearer <token>
- List all projects for authenticated user
- Include stats (totalAnalyses, averageScore, etc.)
Response: Project[]

# GET /projects/{id}
- Requires: Authorization: Bearer <token>
- Get single project details
- Verify user owns project
Response: Project

# POST /projects
- Requires: Authorization: Bearer <token>
Body: {
  "name": string,
  "description": string (optional),
  "repoUrl": string,
  "config": ProjectConfig (optional, uses defaults)
}
- Parse repo owner/name from URL
- Create project linked to user
Response: Project

# PATCH /projects/{id}
- Requires: Authorization: Bearer <token>
- Update project details or configuration
- Verify user owns project
Response: Project

# DELETE /projects/{id}
- Requires: Authorization: Bearer <token>
- Delete project and all related data
- Verify user owns project
```

### 3. Project Analysis
```python
# POST /projects/{id}/analyze
- Requires: Authorization: Bearer <token>
- Trigger new analysis for project
- Use project's configuration settings
- Queue analysis job (async)
Response: {
  "analysisId": "uuid",
  "status": "queued"
}

# GET /projects/{id}/analyses
- Requires: Authorization: Bearer <token>
- List all analyses for project
- Include test results and scores
Response: Analysis[]

# GET /analyses/{id}
- Requires: Authorization: Bearer <token>
- Get single analysis details
- Verify user owns parent project
Response: Analysis with full AgentData

# GET /analyses/{id}/status
- Requires: Authorization: Bearer <token>
- Check analysis progress
Response: {
  "status": "queued" | "processing" | "completed" | "failed",
  "progress": 0-100
}
```

## 💾 Database Models

### User
```python
class User:
    id: UUID (PK)
    github_id: str (unique)
    username: str
    email: str
    avatar_url: str
    github_access_token: str (encrypted)
    created_at: datetime
    updated_at: datetime
```

### Project
```python
class Project:
    id: UUID (PK)
    user_id: UUID (FK -> User)
    name: str
    description: str (nullable)
    repo_url: str
    repo_name: str
    repo_owner: str
    
    # Configuration (JSON field)
    config: {
        "testingEnabled": bool,
        "autoTestOnAnalysis": bool,
        "testDepth": str,
        "thresholds": {...},
        "includeTools": bool,
        "includeRelationships": bool,
        "cacheEnabled": bool,
        "notifyOnCompletion": bool,
        "notifyOnFailures": bool
    }
    
    # Metadata
    created_at: datetime
    updated_at: datetime
    last_analyzed_at: datetime (nullable)
    
    # Computed stats
    total_analyses: int
    total_tests: int
    average_score: float (nullable)
```

### Analysis
```python
class Analysis:
    id: UUID (PK)
    project_id: UUID (FK -> Project)
    
    # Agent data (JSON field - full AgentData)
    agent_data: JSON
    
    # Status
    status: str  # queued, processing, completed, failed
    progress: int
    error_message: str (nullable)
    
    # Results
    test_report: JSON (nullable)
    overall_score: float (nullable)
    
    # Metadata
    created_at: datetime
    completed_at: datetime (nullable)
    duration_ms: int (nullable)
```

### GitHubRepository (Cache)
```python
class GitHubRepository:
    id: int (PK - GitHub repo ID)
    user_id: UUID (FK -> User)
    name: str
    full_name: str
    description: str (nullable)
    html_url: str
    private: bool
    language: str (nullable)
    stargazers_count: int
    updated_at: datetime
    cached_at: datetime
```

## 🔧 Implementation Notes

### Authentication Middleware
- Create JWT middleware to verify Bearer tokens
- Extract user ID from token
- Attach user to request context

### GitHub OAuth Setup
1. Register GitHub OAuth App
2. Set callback URL: `http://localhost:3000/auth/callback`
3. Store CLIENT_ID and CLIENT_SECRET in environment

### Environment Variables
```
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_OAUTH_CALLBACK=http://localhost:3000/auth/callback
JWT_SECRET=your_jwt_secret
JWT_ALGORITHM=HS256
JWT_EXPIRATION=7d
DATABASE_URL=postgresql://...
```

### Security Considerations
- Encrypt GitHub access tokens before storing
- Use HTTPS in production
- Implement rate limiting
- Add CORS for frontend domain
- Validate all project ownership before operations

### Analysis Queue
- Use Celery or similar for async analysis
- Update Analysis.status and progress during processing
- Store results in Analysis.agent_data and test_report

## 📊 Migration Plan

1. **Phase 1: Auth (Week 1)**
   - GitHub OAuth flow
   - User model and endpoints
   - JWT middleware
   - Repository caching

2. **Phase 2: Projects (Week 2)**
   - Project CRUD
   - Configuration management
   - Ownership validation

3. **Phase 3: Analysis Integration (Week 3)**
   - Link existing analysis to projects
   - Async job queue
   - Progress tracking
   - Historical data

4. **Phase 4: Polish (Week 4)**
   - Statistics computation
   - Performance optimization
   - Error handling
   - Documentation
