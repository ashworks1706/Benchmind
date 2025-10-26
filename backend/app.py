from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from dotenv import load_dotenv
import os
import uuid
import time
from threading import Thread
import jwt
import requests
from datetime import datetime, timedelta
from sqlalchemy import func
import logging

from services.github_scraper import GitHubScraper
from services.agent_parser import AgentParser
from services.test_generator import TestGenerator
from services.code_editor import CodeEditor
from services.cache_manager import CacheManager
from services.encryption import encrypt_token, decrypt_token

from database import get_db, init_db
from models import User, Project, Analysis, GitHubRepositoryCache

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize database on startup
try:
    init_db()
except Exception as e:
    print(f"Note: Database initialization: {e}")

JWT_SECRET = os.getenv('JWT_SECRET', 'dev-secret')
JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
JWT_EXPIRE_DAYS = int(os.getenv('JWT_EXPIRE_DAYS', '7'))

def _create_jwt(payload: dict) -> str:
    to_encode = payload.copy()
    expire = datetime.utcnow() + timedelta(days=JWT_EXPIRE_DAYS)
    to_encode.update({ 'exp': expire })
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def _decode_jwt(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        return {}

def _get_auth_user_id():
    """Get authenticated user ID from JWT token"""
    auth = request.headers.get('Authorization')
    if not auth:
        return None
    if auth.startswith('Bearer '):
        token = auth.split(' ', 1)[1]
    else:
        token = auth
    data = _decode_jwt(token)
    return data.get('id') if data else None

def _get_auth_user():
    """Get authenticated user from JWT token - returns user with decrypted token"""
    user_id = _get_auth_user_id()
    if not user_id:
        return None
    
    # Fetch user from database
    with get_db() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            # Create a detached user object with necessary attributes
            user_data = {
                'id': user.id,
                'github_id': user.github_id,
                'username': user.username,
                'email': user.email,
                'avatar_url': user.avatar_url,
                'decrypted_token': decrypt_token(user.github_access_token_encrypted) if user.github_access_token_encrypted else None
            }
            # Create a simple object to hold user data
            class UserData:
                def __init__(self, data):
                    for key, value in data.items():
                        setattr(self, key, value)
            return UserData(user_data)
        return None

# Initialize services
github_scraper = GitHubScraper()
agent_parser = AgentParser()
test_generator = TestGenerator()
code_editor = CodeEditor()
cache_manager = CacheManager()

# Store analysis progress in memory (in production, use Redis or similar)
analysis_progress = {}
# Store repository URLs for each analysis
analysis_urls = {}
# Store partial results during analysis
analysis_partial_data = {}

def run_analysis_async(analysis_id, github_url, project_id=None):
    """Run analysis in background thread and update progress"""
    start_time = time.time()
    logger.info(f"Starting analysis {analysis_id} for URL: {github_url}")
    
    try:
        # Check database cache first
        logger.info(f"Checking database cache for {github_url}")
        with get_db() as db:
            # Look for a recent completed analysis with this repo URL
            if project_id:
                cached_analysis = db.query(Analysis).filter(
                    Analysis.project_id == project_id,
                    Analysis.status == 'completed',
                    Analysis.agent_data.isnot(None)
                ).order_by(Analysis.created_at.desc()).first()
            else:
                # Check if any project has this repo URL and has a completed analysis
                projects = db.query(Project).filter(Project.repo_url == github_url).all()
                cached_analysis = None
                for proj in projects:
                    analysis = db.query(Analysis).filter(
                        Analysis.project_id == proj.id,
                        Analysis.status == 'completed',
                        Analysis.agent_data.isnot(None)
                    ).order_by(Analysis.created_at.desc()).first()
                    if analysis:
                        cached_analysis = analysis
                        break
            
            if cached_analysis and cached_analysis.agent_data:
                logger.info(f"Found cached analysis in database for {github_url}")
                # Return cached data immediately
                analysis_progress[analysis_id] = {
                    'step': 1,
                    'name': 'Loading from cache',
                    'status': 'in_progress',
                    'message': 'Found cached analysis in database...',
                    'total_steps': 5
                }
                time.sleep(0.5)
                
                cached_data = cached_analysis.agent_data
                logger.info(f"Cached data has {len(cached_data.get('agents', []))} agents, "
                          f"{len(cached_data.get('tools', []))} tools, "
                          f"{len(cached_data.get('relationships', []))} relationships")
                
                analysis_progress[analysis_id] = {
                    'step': 5,
                    'name': 'Complete',
                    'status': 'completed',
                    'message': f'✨ Loaded from cache! Found {len(cached_data.get("agents", []))} agents, {len(cached_data.get("tools", []))} tools, {len(cached_data.get("relationships", []))} relationships',
                    'total_steps': 5,
                    'data': cached_data,
                    'from_cache': True
                }
                return
        
        # Step 1: Fetching repository
        logger.info(f"Step 1: Fetching repository from GitHub")
        analysis_progress[analysis_id] = {
            'step': 1,
            'name': 'Fetching repository',
            'status': 'in_progress',
            'message': 'Connecting to GitHub...',
            'total_steps': 5
        }
        time.sleep(0.5)  # Small delay for UI
        
        repo_data = github_scraper.scrape_repository(github_url)
        logger.info(f"Successfully fetched repo, found {len(repo_data.get('files', []))} files")
        
        # Step 2: Scanning files
        logger.info(f"Step 2: Scanning files")
        analysis_progress[analysis_id] = {
            'step': 2,
            'name': 'Scanning files',
            'status': 'in_progress',
            'message': f'Found {len(repo_data.get("files", []))} files, analyzing...',
            'total_steps': 5
        }
        time.sleep(0.5)
        
        # Step 3: Identifying agents
        logger.info(f"Step 3: Identifying agents with AI")
        analysis_progress[analysis_id] = {
            'step': 3,
            'name': 'Identifying agents',
            'status': 'in_progress',
            'message': 'Analyzing code structure with AI...',
            'total_steps': 5
        }
        
        agent_data = agent_parser.parse_agents(repo_data)
        logger.info(f"Agent parser returned data with keys: {agent_data.keys() if agent_data else 'None'}")
        
        if not agent_data:
            logger.error("Agent parser returned None or empty data")
            agent_data = {
                'agents': [],
                'tools': [],
                'relationships': [],
                'repository': {}
            }
        
        agents_count = len(agent_data.get('agents', []))
        tools_count = len(agent_data.get('tools', []))
        relationships_count = len(agent_data.get('relationships', []))
        
        logger.info(f"Analysis found: {agents_count} agents, {tools_count} tools, {relationships_count} relationships")
        
        # Store partial data
        analysis_partial_data[analysis_id] = {
            'agents': agent_data.get('agents', []),
            'tools': agent_data.get('tools', []),
            'relationships': agent_data.get('relationships', []),
            'repository': agent_data.get('repository', {}),
        }
        
        # Step 4: Extracting tools
        logger.info(f"Step 4: Extracting tools")
        analysis_progress[analysis_id] = {
            'step': 4,
            'name': 'Extracting tools',
            'status': 'in_progress',
            'message': f'Found {tools_count} tools...',
            'total_steps': 5
        }
        time.sleep(0.5)
        
        # Step 5: Mapping relationships
        logger.info(f"Step 5: Mapping relationships")
        analysis_progress[analysis_id] = {
            'step': 5,
            'name': 'Mapping relationships',
            'status': 'in_progress',
            'message': 'Building relationship graph...',
            'total_steps': 5
        }
        time.sleep(0.5)
        
        # Save to database instead of cache
        logger.info(f"Saving analysis results to database")
        duration_ms = int((time.time() - start_time) * 1000)
        
        with get_db() as db:
            # Create new analysis record
            new_analysis = Analysis(
                id=analysis_id,
                project_id=project_id,
                agent_data=agent_data,
                status='completed',
                progress=100,
                from_cache=False,
                duration_ms=duration_ms,
                completed_at=datetime.utcnow()
            )
            db.add(new_analysis)
            
            # Update project stats if project_id provided
            if project_id:
                project = db.query(Project).filter(Project.id == project_id).first()
                if project:
                    project.last_analyzed_at = datetime.utcnow()
                    project.total_analyses = (project.total_analyses or 0) + 1
                    logger.info(f"Updated project {project_id} stats")
            
            db.commit()
            logger.info(f"Analysis {analysis_id} saved to database")
        
        # Complete
        analysis_progress[analysis_id] = {
            'step': 5,
            'name': 'Complete',
            'status': 'completed',
            'message': f'Analysis complete! Found {agents_count} agents, {tools_count} tools, {relationships_count} relationships',
            'total_steps': 5,
            'data': agent_data,
            'from_cache': False
        }
        
        logger.info(f"Analysis {analysis_id} completed successfully in {duration_ms}ms")
        
    except Exception as e:
        logger.error(f"Analysis {analysis_id} failed with error: {str(e)}", exc_info=True)
        
        # Save failed analysis to database
        try:
            with get_db() as db:
                failed_analysis = Analysis(
                    id=analysis_id,
                    project_id=project_id,
                    status='failed',
                    progress=0,
                    error_message=str(e),
                    completed_at=datetime.utcnow()
                )
                db.add(failed_analysis)
                db.commit()
                logger.info(f"Failed analysis {analysis_id} saved to database")
        except Exception as db_error:
            logger.error(f"Failed to save error to database: {str(db_error)}")
        
        analysis_progress[analysis_id] = {
            'step': 0,
            'name': 'Error',
            'status': 'error',
            'message': str(e),
            'total_steps': 5
        }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Backend is running'}), 200


# --- GitHub OAuth & User Endpoints (prototype) ---
@app.route('/auth/github/login', methods=['GET'])
def github_login():
    """Redirect user to GitHub OAuth page"""
    client_id = os.getenv('GITHUB_OAUTH_CLIENT_ID')
    redirect_uri = os.getenv('GITHUB_OAUTH_CALLBACK') or os.getenv('GITHUB_OAUTH_REDIRECT')
    if not client_id or not redirect_uri:
        return jsonify({'error': 'OAuth not configured. Set GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CALLBACK in env.'}), 500

    state = str(uuid.uuid4())
    # In production store state in DB or session
    params = {
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'scope': 'read:user repo',
        'state': state,
        'allow_signup': 'true'
    }
    github_auth = 'https://github.com/login/oauth/authorize'
    url = requests.Request('GET', github_auth, params=params).prepare().url
    # Redirect the client to GitHub OAuth URL
    from flask import redirect
    return redirect(url)


@app.route('/auth/github/callback', methods=['GET'])
def github_callback():
    """Exchange code for token and redirect to frontend with user data"""
    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')
    
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    
    # Handle OAuth errors
    if error:
        return redirect(f'{frontend_url}/auth/callback?error={error}')
    
    if not code:
        return redirect(f'{frontend_url}/auth/callback?error=no_code')

    client_id = os.getenv('GITHUB_OAUTH_CLIENT_ID')
    client_secret = os.getenv('GITHUB_OAUTH_CLIENT_SECRET')
    if not client_id or not client_secret:
        return redirect(f'{frontend_url}/auth/callback?error=oauth_not_configured')

    token_url = 'https://github.com/login/oauth/access_token'
    headers = {'Accept': 'application/json'}
    resp = requests.post(token_url, data={
        'client_id': client_id,
        'client_secret': client_secret,
        'code': code
    }, headers=headers)
    if resp.status_code != 200:
        return redirect(f'{frontend_url}/auth/callback?error=token_exchange_failed')
    
    token_data = resp.json()
    access_token = token_data.get('access_token')
    if not access_token:
        return redirect(f'{frontend_url}/auth/callback?error=no_access_token')

    # Fetch user info
    user_resp = requests.get('https://api.github.com/user', headers={'Authorization': f'token {access_token}'})
    if user_resp.status_code != 200:
        return redirect(f'{frontend_url}/auth/callback?error=user_fetch_failed')
    gh_user = user_resp.json()

    # Store or update user in database
    github_id = str(gh_user.get('id'))
    
    try:
        with get_db() as db:
            user = db.query(User).filter(User.github_id == github_id).first()
            
            if not user:
                # Create new user
                user = User(
                    github_id=github_id,
                    username=gh_user.get('login'),
                    email=gh_user.get('email'),
                    avatar_url=gh_user.get('avatar_url'),
                    github_access_token_encrypted=encrypt_token(access_token)
                )
                db.add(user)
                db.flush()  # Get the ID
            else:
                # Update existing user
                user.username = gh_user.get('login')
                user.email = gh_user.get('email')
                user.avatar_url = gh_user.get('avatar_url')
                user.github_access_token_encrypted = encrypt_token(access_token)
                user.updated_at = datetime.utcnow()
            
            db.commit()
            
            # Create JWT for frontend
            token = _create_jwt({
                'id': user.id,
                'github_id': github_id,
                'username': user.username
            })
            
            # Redirect to frontend with code (frontend will call backend to get user data)
            return redirect(f'{frontend_url}/auth/callback?code={code}&token={token}&access_token={access_token}')
    
    except Exception as e:
        return redirect(f'{frontend_url}/auth/callback?error=database_error')


@app.route('/auth/github/repos', methods=['GET'])
def list_user_repos():
    """Return repositories for authenticated user (with caching)"""
    user = _get_auth_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    access_token = getattr(user, 'decrypted_token', None)
    if not access_token:
        return jsonify({'error': 'No stored access token for user'}), 400

    # Check cache first (repos cached within last hour)
    with get_db() as db:
        cached_repos = db.query(GitHubRepositoryCache).filter(
            GitHubRepositoryCache.user_id == user.id,
            GitHubRepositoryCache.cached_at > datetime.utcnow() - timedelta(hours=1)
        ).all()
        
        if cached_repos:
            return jsonify([repo.to_dict() for repo in cached_repos]), 200

    # Fetch from GitHub API
    repos = []
    try:
        page = 1
        while True:
            r = requests.get('https://api.github.com/user/repos', params={'per_page': 100, 'page': page}, headers={'Authorization': f'token {access_token}'})
            if r.status_code != 200:
                break
            page_data = r.json()
            if not page_data:
                break
            repos.extend(page_data)
            page += 1
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    # Cache repos in database
    with get_db() as db:
        # Clear old cache for this user
        db.query(GitHubRepositoryCache).filter(GitHubRepositoryCache.user_id == user.id).delete()
        db.commit()  # Commit the deletion first
        
        # Add new cache entries
        simplified = []
        for r in repos:
            # Check if repo already exists (to handle duplicate IDs across users)
            existing = db.query(GitHubRepositoryCache).filter(GitHubRepositoryCache.id == r.get('id')).first()
            if existing:
                # Update existing entry
                existing.user_id = user.id
                existing.name = r.get('name')
                existing.full_name = r.get('full_name')
                existing.description = r.get('description')
                existing.html_url = r.get('html_url')
                existing.private = r.get('private', False)
                existing.language = r.get('language')
                existing.stargazers_count = r.get('stargazers_count', 0)
                existing.updated_at = datetime.fromisoformat(r.get('updated_at').replace('Z', '+00:00')) if r.get('updated_at') else None
                existing.cached_at = datetime.utcnow()
                simplified.append(existing.to_dict())
            else:
                # Create new entry
                cache_entry = GitHubRepositoryCache(
                    id=r.get('id'),
                    user_id=user.id,
                    name=r.get('name'),
                    full_name=r.get('full_name'),
                    description=r.get('description'),
                    html_url=r.get('html_url'),
                    private=r.get('private', False),
                    language=r.get('language'),
                    stargazers_count=r.get('stargazers_count', 0),
                    updated_at=datetime.fromisoformat(r.get('updated_at').replace('Z', '+00:00')) if r.get('updated_at') else None
                )
                db.add(cache_entry)
                simplified.append(cache_entry.to_dict())
        
        db.commit()
    
    return jsonify(simplified), 200


@app.route('/auth/github/repos/refresh', methods=['POST'])
def refresh_user_repos():
    # For now just call list_user_repos (no caching layer implemented yet)
    return list_user_repos()


# --- Project Management Endpoints (Database) ---
@app.route('/projects', methods=['GET'])
def list_projects():
    user = _get_auth_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    with get_db() as db:
        projects = db.query(Project).filter(Project.user_id == user.id).all()
        return jsonify([p.to_dict() for p in projects]), 200


@app.route('/projects', methods=['POST'])
def create_project():
    user = _get_auth_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json or {}
    name = data.get('name')
    repo_url = data.get('repoUrl') or data.get('repo_url') or data.get('repo')
    description = data.get('description', '')
    config = data.get('config', {})

    if not name or not repo_url:
        return jsonify({'error': 'name and repoUrl are required'}), 400

    # Parse repo owner and name from URL
    parts = repo_url.rstrip('/').split('/')
    repo_name = parts[-1]
    repo_owner = parts[-2] if len(parts) >= 2 else ''
    
    with get_db() as db:
        project = Project(
            user_id=user.id,
            name=name,
            description=description,
            repo_url=repo_url,
            repo_name=repo_name,
            repo_owner=repo_owner,
            config=config
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        
        return jsonify(project.to_dict()), 201


@app.route('/projects/<project_id>', methods=['GET'])
def get_project(project_id):
    user = _get_auth_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    with get_db() as db:
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.user_id == user.id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found or unauthorized'}), 404
        
        return jsonify(project.to_dict()), 200


@app.route('/projects/<project_id>', methods=['PATCH'])
def update_project(project_id):
    user = _get_auth_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    with get_db() as db:
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.user_id == user.id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found or unauthorized'}), 404

        data = request.json or {}
        # Only allow updating certain fields
        if 'name' in data:
            project.name = data['name']
        if 'description' in data:
            project.description = data['description']
        if 'config' in data:
            project.config = data['config']
        
        project.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(project)
        
        return jsonify(project.to_dict()), 200


@app.route('/projects/<project_id>', methods=['DELETE'])
def delete_project(project_id):
    user = _get_auth_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    with get_db() as db:
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.user_id == user.id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found or unauthorized'}), 404
        
        db.delete(project)
        db.commit()
        
        return jsonify({'status': 'deleted'}), 200



@app.route('/api/analyze-repo', methods=['POST'])
def analyze_repository():
    """
    Start analysis of a GitHub repository (non-blocking)
    Returns an analysis_id to track progress
    """
    try:
        data = request.json
        github_url = data.get('github_url')
        project_id = data.get('project_id')  # Optional project ID to associate with
        
        if not github_url:
            logger.error("No GitHub URL provided in request")
            return jsonify({'error': 'GitHub URL is required'}), 400
        
        logger.info(f"Starting analysis for URL: {github_url}, project_id: {project_id}")
        
        # Generate unique analysis ID
        analysis_id = str(uuid.uuid4())
        
        # Store URL for this analysis
        analysis_urls[analysis_id] = github_url
        
        # Initialize progress
        analysis_progress[analysis_id] = {
            'step': 0,
            'name': 'Starting',
            'status': 'pending',
            'message': 'Initializing analysis...',
            'total_steps': 5
        }
        
        # Start analysis in background thread
        thread = Thread(target=run_analysis_async, args=(analysis_id, github_url, project_id))
        thread.daemon = True
        thread.start()
        
        logger.info(f"Analysis {analysis_id} started in background thread")
        
        return jsonify({
            'status': 'started',
            'analysis_id': analysis_id
        }), 200
        
    except Exception as e:
        logger.error(f"Failed to start analysis: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/analysis-status/<analysis_id>', methods=['GET'])
def get_analysis_status(analysis_id):
    """
    Get current status of an analysis
    """
    if analysis_id not in analysis_progress:
        logger.warning(f"Analysis {analysis_id} not found in progress cache")
        # Try to find in database
        try:
            with get_db() as db:
                analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
                if analysis:
                    logger.info(f"Found analysis {analysis_id} in database with status: {analysis.status}")
                    if analysis.status == 'completed' and analysis.agent_data:
                        response_data = {
                            'status': 'success',
                            'progress': {
                                'step': 5,
                                'name': 'Complete',
                                'status': 'completed',
                                'message': 'Analysis complete',
                                'total_steps': 5
                            },
                            'data': analysis.agent_data,
                            'from_cache': analysis.from_cache
                        }
                        # Include test_cases if available
                        if analysis.test_cases:
                            response_data['test_cases'] = analysis.test_cases
                        return jsonify(response_data), 200
                    elif analysis.status == 'failed':
                        return jsonify({
                            'status': 'error',
                            'progress': {
                                'step': 0,
                                'name': 'Error',
                                'status': 'error',
                                'message': analysis.error_message or 'Analysis failed',
                                'total_steps': 5
                            }
                        }), 200
        except Exception as e:
            logger.error(f"Error checking database for analysis {analysis_id}: {str(e)}")
        
        return jsonify({'error': 'Analysis not found'}), 404
    
    progress = analysis_progress[analysis_id]
    logger.debug(f"Analysis {analysis_id} status: {progress['status']}, step: {progress['step']}")
    
    # If completed, include the data
    if progress['status'] == 'completed' and 'data' in progress:
        agent_count = len(progress['data'].get('agents', []))
        tool_count = len(progress['data'].get('tools', []))
        rel_count = len(progress['data'].get('relationships', []))
        logger.info(f"Analysis {analysis_id} completed: {agent_count} agents, {tool_count} tools, {rel_count} relationships")
        
        return jsonify({
            'status': 'success',
            'progress': {
                'step': progress['step'],
                'name': progress['name'],
                'status': progress['status'],
                'message': progress['message'],
                'total_steps': progress['total_steps']
            },
            'data': progress['data'],
            'from_cache': progress.get('from_cache', False)
        }), 200
    
    # Include partial data if available (for recovery on reload)
    response = {
        'status': 'in_progress' if progress['status'] == 'in_progress' else progress['status'],
        'progress': {
            'step': progress['step'],
            'name': progress['name'],
            'status': progress['status'],
            'message': progress['message'],
            'total_steps': progress['total_steps']
        }
    }
    
    # Add partial data if analysis is in progress
    if analysis_id in analysis_partial_data:
        response['partial_data'] = analysis_partial_data[analysis_id]
    
    return jsonify(response), 200

@app.route('/api/generate-tests', methods=['POST'])
def generate_tests():
    """
    Generate test cases for the analyzed agents
    Expected payload: { "agent_data": {...} }
    """
    try:
        data = request.json
        agent_data = data.get('agent_data')
        
        if not agent_data:
            return jsonify({'error': 'Agent data is required'}), 400
        
        test_cases = test_generator.generate_test_cases(agent_data)
        
        return jsonify({
            'status': 'success',
            'test_cases': test_cases
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/run-test', methods=['POST'])
def run_test():
    """
    Run a specific test case
    Expected payload: { "test_case": {...}, "agent_data": {...} }
    """
    try:
        data = request.json
        test_case = data.get('test_case')
        agent_data = data.get('agent_data')
        
        if not test_case or not agent_data:
            return jsonify({'error': 'Test case and agent data are required'}), 400
        
        result = test_generator.run_test(test_case, agent_data)
        
        return jsonify({
            'status': 'success',
            'result': result
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/apply-fix', methods=['POST'])
def apply_fix():
    """
    Apply a suggested fix to the codebase
    Expected payload: { "fix": {...}, "agent_data": {...} }
    """
    try:
        data = request.json
        fix = data.get('fix')
        agent_data = data.get('agent_data')
        
        if not fix or not agent_data:
            return jsonify({'error': 'Fix and agent data are required'}), 400
        
        updated_code = code_editor.apply_fix(fix, agent_data)
        
        return jsonify({
            'status': 'success',
            'updated_code': updated_code
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/apply-fixes-batch', methods=['POST'])
def apply_fixes_batch():
    """
    Apply multiple fixes in a single commit to GitHub
    Expected payload: { "fixes": [...], "agent_data": {...} }
    """
    try:
        data = request.json
        fixes = data.get('fixes', [])
        agent_data = data.get('agent_data')
        
        if not fixes or not agent_data:
            return jsonify({'error': 'Fixes and agent data are required'}), 400
        
        result = code_editor.apply_fixes_batch(fixes, agent_data)
        
        return jsonify({
            'status': 'success',
            'result': result
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/update-agent', methods=['POST'])
def update_agent():
    """
    Update agent configuration or tool code
    Expected payload: { "agent_id": "...", "updates": {...} }
    """
    try:
        data = request.json
        agent_id = data.get('agent_id')
        updates = data.get('updates')
        
        if not agent_id or not updates:
            return jsonify({'error': 'Agent ID and updates are required'}), 400
        
        updated_agent = code_editor.update_agent(agent_id, updates)
        
        return jsonify({
            'status': 'success',
            'updated_agent': updated_agent
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Store testing sessions
testing_sessions = {}
testing_progress = {}
testing_cache = {}  # Cache for test sessions by repo URL

@app.route('/api/testing/start', methods=['POST'])
def start_testing_session():
    """
    Start a new testing session with progress tracking
    Expected payload: { "agent_data": {...}, "repo_url": "...", "analysis_id": "..." }
    """
    try:
        data = request.json
        agent_data = data.get('agent_data')
        repo_url = data.get('repo_url', '')
        analysis_id = data.get('analysis_id')  # Get analysis ID if provided
        
        if not agent_data:
            logger.error("No agent data provided for testing session")
            return jsonify({'error': 'Agent data is required'}), 400
        
        logger.info(f"Starting testing session for repo: {repo_url}, analysis_id: {analysis_id}")
        
        # Check if we have test cases in the database for this analysis
        if analysis_id:
            try:
                with get_db() as db:
                    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
                    if analysis and analysis.test_cases:
                        logger.info(f"Found {len(analysis.test_cases)} cached test cases in database for analysis {analysis_id}")
                        # Create new session with cached test cases
                        session_id = str(uuid.uuid4())
                        testing_sessions[session_id] = {
                            'agent_data': agent_data,
                            'test_cases': analysis.test_cases,
                            'test_results': [],
                            'status': 'ready_for_confirmation',
                            'progress': [],
                            'from_cache': True,
                            'analysis_id': analysis_id
                        }
                        testing_progress[session_id] = [{
                            'type': 'status',
                            'data': {
                                'message': '⚡ Loaded test cases from database!',
                                'progress': 100
                            },
                            'timestamp': time.time()
                        }]
                        return jsonify({
                            'session_id': session_id,
                            'from_cache': True,
                            'message': 'Test session loaded from database'
                        }), 200
            except Exception as e:
                logger.error(f"Error loading test cases from database: {str(e)}")
        
        # Check legacy cache (for backwards compatibility)
        cache_key = f"testing_{repo_url}" if repo_url else None
        if cache_key and cache_key in testing_cache:
            logger.info(f"Found test cases in legacy cache for {repo_url}")
            cached_session = testing_cache[cache_key]
            # Create new session with cached test cases
            session_id = str(uuid.uuid4())
            testing_sessions[session_id] = {
                'agent_data': agent_data,
                'test_cases': cached_session['test_cases'],
                'test_results': [],
                'status': 'ready_for_confirmation',
                'progress': [],
                'from_cache': True,
                'analysis_id': analysis_id
            }
            testing_progress[session_id] = [{
                'type': 'status',
                'data': {
                    'message': '⚡ Loaded test cases from cache!',
                    'progress': 100
                },
                'timestamp': time.time()
            }]
            return jsonify({
                'session_id': session_id,
                'from_cache': True,
                'message': 'Test session loaded from cache'
            }), 200
        
        # Create testing session
        logger.info(f"Creating new testing session (no cache found)")
        session_id = str(uuid.uuid4())
        testing_sessions[session_id] = {
            'agent_data': agent_data,
            'test_cases': [],
            'test_results': [],
            'status': 'generating',
            'progress': [],
            'from_cache': False,
            'analysis_id': analysis_id
        }
        
        # Generate test cases in background with progress updates
        def generate_with_progress():
            def progress_callback(event_type, data):
                if session_id not in testing_progress:
                    testing_progress[session_id] = []
                testing_progress[session_id].append({
                    'type': event_type,
                    'data': data,
                    'timestamp': time.time()
                })
                
                # Store test cases as they're generated
                if event_type == 'test_case_generated':
                    test_case = data.get('test_case')
                    if test_case:
                        testing_sessions[session_id]['test_cases'].append(test_case)
            
            logger.info(f"Generating test cases for session {session_id}")
            test_cases = test_generator.generate_test_cases(agent_data, progress_callback)
            testing_sessions[session_id]['test_cases'] = test_cases
            testing_sessions[session_id]['status'] = 'ready_for_confirmation'
            logger.info(f"Generated {len(test_cases)} test cases for session {session_id}")
            
            # Save test cases to database if analysis_id is provided
            if analysis_id:
                try:
                    with get_db() as db:
                        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
                        if analysis:
                            analysis.test_cases = test_cases
                            db.commit()
                            logger.info(f"Saved {len(test_cases)} test cases to database for analysis {analysis_id}")
                except Exception as e:
                    logger.error(f"Error saving test cases to database: {str(e)}")
            
            # Cache the test cases (legacy)
            if cache_key:
                testing_cache[cache_key] = {
                    'test_cases': test_cases,
                    'timestamp': time.time()
                }
        
        thread = Thread(target=generate_with_progress)
        thread.start()
        
        return jsonify({
            'status': 'success',
            'session_id': session_id
        }), 200
        
    except Exception as e:
        logger.error(f"Error starting testing session: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/testing/progress/<session_id>', methods=['GET'])
def get_testing_progress(session_id):
    """Get progress updates for a testing session"""
    try:
        if session_id not in testing_sessions:
            return jsonify({'error': 'Session not found'}), 404
        
        session = testing_sessions[session_id]
        progress = testing_progress.get(session_id, [])
        
        return jsonify({
            'status': session['status'],
            'test_cases': session['test_cases'],
            'progress': progress,
            'test_results': session.get('test_results', [])
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/testing/update-tests', methods=['POST'])
def update_test_cases():
    """
    Update test cases based on user feedback
    Expected payload: { "session_id": "...", "feedback": "..." }
    """
    try:
        data = request.json
        session_id = data.get('session_id')
        feedback = data.get('feedback')
        
        if not session_id or not feedback:
            return jsonify({'error': 'Session ID and feedback are required'}), 400
        
        if session_id not in testing_sessions:
            return jsonify({'error': 'Session not found'}), 404
        
        session = testing_sessions[session_id]
        current_tests = session['test_cases']
        agent_data = session['agent_data']
        
        # Clear previous progress
        testing_progress[session_id] = []
        
        def progress_callback(event_type, data):
            if session_id not in testing_progress:
                testing_progress[session_id] = []
            testing_progress[session_id].append({
                'type': event_type,
                'data': data,
                'timestamp': time.time()
            })
        
        updated_tests = test_generator.update_test_cases(
            current_tests,
            feedback,
            agent_data,
            progress_callback
        )
        
        testing_sessions[session_id]['test_cases'] = updated_tests
        
        return jsonify({
            'status': 'success',
            'test_cases': updated_tests
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/testing/confirm', methods=['POST'])
def confirm_tests():
    """
    User confirms test cases and starts execution
    Expected payload: { "session_id": "..." }
    """
    try:
        data = request.json
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({'error': 'Session ID is required'}), 400
        
        if session_id not in testing_sessions:
            return jsonify({'error': 'Session not found'}), 404
        
        testing_sessions[session_id]['status'] = 'running_tests'
        
        # Run tests in background
        def run_tests():
            session = testing_sessions[session_id]
            test_cases = session['test_cases']
            agent_data = session['agent_data']
            results = []
            
            # Clear progress
            testing_progress[session_id] = []
            
            def progress_callback(event_type, data):
                if session_id not in testing_progress:
                    testing_progress[session_id] = []
                testing_progress[session_id].append({
                    'type': event_type,
                    'data': data,
                    'timestamp': time.time()
                })
            
            for test_case in test_cases:
                result = test_generator.run_test(test_case, agent_data, progress_callback)
                results.append(result)
                testing_sessions[session_id]['test_results'] = results
            
            # Generate report
            report = test_generator.generate_test_report(results, agent_data)
            testing_sessions[session_id]['report'] = report
            testing_sessions[session_id]['status'] = 'completed'
        
        thread = Thread(target=run_tests)
        thread.start()
        
        return jsonify({
            'status': 'success',
            'message': 'Tests started'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/testing/report/<session_id>', methods=['GET'])
def get_test_report(session_id):
    """Get comprehensive test report with graphs"""
    try:
        if session_id not in testing_sessions:
            return jsonify({'error': 'Session not found'}), 404
        
        session = testing_sessions[session_id]
        
        if 'report' not in session:
            return jsonify({'error': 'Report not ready yet'}), 404
        
        return jsonify({
            'status': 'success',
            'report': session['report']
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cache/list', methods=['GET'])
def list_cached_repos():
    """
    List all cached repositories (from database analyses)
    """
    try:
        logger.info("Fetching cached analyses from database")
        with get_db() as db:
            # Get all completed analyses with their project info
            analyses = db.query(Analysis).filter(
                Analysis.status == 'completed',
                Analysis.agent_data.isnot(None)
            ).order_by(Analysis.created_at.desc()).limit(50).all()
            
            cached_repos = []
            seen_projects = set()
            
            for analysis in analyses:
                if analysis.project_id and analysis.project_id not in seen_projects:
                    project = db.query(Project).filter(Project.id == analysis.project_id).first()
                    if project:
                        cached_repos.append({
                            'repo_url': project.repo_url,
                            'project_name': project.name,
                            'last_analyzed': analysis.completed_at.isoformat() if analysis.completed_at else None,
                            'agent_count': len(analysis.agent_data.get('agents', [])),
                            'tool_count': len(analysis.agent_data.get('tools', [])),
                        })
                        seen_projects.add(analysis.project_id)
            
            logger.info(f"Found {len(cached_repos)} cached repositories")
            return jsonify({
                'status': 'success',
                'cached_repos': cached_repos
            }), 200
        
    except Exception as e:
        logger.error(f"Error listing cached repos: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/cache/invalidate', methods=['POST'])
def invalidate_cache():
    """
    Invalidate cache for a specific GitHub URL (delete analyses for that repo)
    Expected payload: { "github_url": "..." }
    """
    try:
        data = request.json
        github_url = data.get('github_url')
        
        if not github_url:
            logger.error("No GitHub URL provided for cache invalidation")
            return jsonify({'error': 'GitHub URL is required'}), 400
        
        logger.info(f"Invalidating cache for {github_url}")
        
        with get_db() as db:
            # Find all projects with this repo URL
            projects = db.query(Project).filter(Project.repo_url == github_url).all()
            
            deleted_count = 0
            for project in projects:
                # Delete all analyses for this project
                analyses = db.query(Analysis).filter(Analysis.project_id == project.id).all()
                for analysis in analyses:
                    db.delete(analysis)
                    deleted_count += 1
                    
                # Reset project stats
                project.last_analyzed_at = None
                project.total_analyses = 0
            
            db.commit()
            logger.info(f"Deleted {deleted_count} analyses for {github_url}")
        
        return jsonify({
            'status': 'success',
            'invalidated': True,
            'deleted_analyses': deleted_count
        }), 200
        
    except Exception as e:
        logger.error(f"Error invalidating cache: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/cache/clear', methods=['POST'])
def clear_cache():
    """
    Clear all cached data (delete all analyses)
    """
    try:
        logger.info("Clearing all cache from database")
        
        with get_db() as db:
            # Delete all analyses
            deleted_count = db.query(Analysis).delete()
            
            # Reset all project stats
            projects = db.query(Project).all()
            for project in projects:
                project.last_analyzed_at = None
                project.total_analyses = 0
            
            db.commit()
            logger.info(f"Deleted {deleted_count} analyses from database")
        
        return jsonify({
            'status': 'success',
            'message': f'All cache cleared ({deleted_count} analyses deleted)'
        }), 200
        
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
