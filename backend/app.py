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

from services.github_scraper import GitHubScraper
from services.agent_parser import AgentParser
from services.test_generator import TestGenerator
from services.code_editor import CodeEditor
from services.cache_manager import CacheManager
from services.encryption import encrypt_token, decrypt_token

from database import get_db, init_db
from models import User, Project, Analysis, GitHubRepositoryCache

load_dotenv()

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

def _get_auth_user():
    """Get authenticated user from JWT token"""
    auth = request.headers.get('Authorization')
    if not auth:
        return None
    if auth.startswith('Bearer '):
        token = auth.split(' ', 1)[1]
    else:
        token = auth
    data = _decode_jwt(token)
    if not data or not data.get('id'):
        return None
    
    # Fetch user from database
    with get_db() as db:
        user = db.query(User).filter(User.id == data.get('id')).first()
        if user:
            # Decrypt access token for use
            if user.github_access_token_encrypted:
                user.decrypted_token = decrypt_token(user.github_access_token_encrypted)
        return user

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

def run_analysis_async(analysis_id, github_url):
    """Run analysis in background thread and update progress"""
    try:
        # Check cache first
        cached_data = cache_manager.get(github_url)
        
        if cached_data:
            # Return cached data immediately
            analysis_progress[analysis_id] = {
                'step': 1,
                'name': 'Loading from cache',
                'status': 'in_progress',
                'message': 'Found cached analysis...',
                'total_steps': 5
            }
            time.sleep(0.5)
            
            analysis_progress[analysis_id] = {
                'step': 5,
                'name': 'Complete',
                'status': 'completed',
                'message': f'✨ Loaded from cache! Found {len(cached_data["agents"])} agents, {len(cached_data["tools"])} tools, {len(cached_data["relationships"])} relationships',
                'total_steps': 5,
                'data': cached_data,
                'from_cache': True
            }
            return
        
        # Step 1: Fetching repository
        analysis_progress[analysis_id] = {
            'step': 1,
            'name': 'Fetching repository',
            'status': 'in_progress',
            'message': 'Connecting to GitHub...',
            'total_steps': 5
        }
        time.sleep(0.5)  # Small delay for UI
        
        repo_data = github_scraper.scrape_repository(github_url)
        
        # Step 2: Scanning files
        analysis_progress[analysis_id] = {
            'step': 2,
            'name': 'Scanning files',
            'status': 'in_progress',
            'message': f'Found {len(repo_data["files"])} files, analyzing...',
            'total_steps': 5
        }
        time.sleep(0.5)
        
        # Step 3: Identifying agents
        analysis_progress[analysis_id] = {
            'step': 3,
            'name': 'Identifying agents',
            'status': 'in_progress',
            'message': 'Analyzing code structure with AI...',
            'total_steps': 5
        }
        
        agent_data = agent_parser.parse_agents(repo_data)
        
        # Store partial data
        analysis_partial_data[analysis_id] = {
            'agents': agent_data.get('agents', []),
            'tools': agent_data.get('tools', []),
            'relationships': agent_data.get('relationships', []),
            'repository': agent_data.get('repository', {}),
        }
        
        # Step 4: Extracting tools
        analysis_progress[analysis_id] = {
            'step': 4,
            'name': 'Extracting tools',
            'status': 'in_progress',
            'message': f'Found {len(agent_data["tools"])} tools...',
            'total_steps': 5
        }
        time.sleep(0.5)
        
        # Step 5: Mapping relationships
        analysis_progress[analysis_id] = {
            'step': 5,
            'name': 'Mapping relationships',
            'status': 'in_progress',
            'message': 'Building relationship graph...',
            'total_steps': 5
        }
        time.sleep(0.5)
        
        # Cache the results
        cache_manager.set(github_url, agent_data)
        
        # Complete
        analysis_progress[analysis_id] = {
            'step': 5,
            'name': 'Complete',
            'status': 'completed',
            'message': f'Analysis complete! Found {len(agent_data["agents"])} agents, {len(agent_data["tools"])} tools, {len(agent_data["relationships"])} relationships',
            'total_steps': 5,
            'data': agent_data,
            'from_cache': False
        }
        
    except Exception as e:
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
    """Exchange code for token and return user + JWT (for frontend to store)"""
    code = request.args.get('code')
    state = request.args.get('state')
    if not code:
        return jsonify({'error': 'Missing code'}), 400

    client_id = os.getenv('GITHUB_OAUTH_CLIENT_ID')
    client_secret = os.getenv('GITHUB_OAUTH_CLIENT_SECRET')
    if not client_id or not client_secret:
        return jsonify({'error': 'OAuth client id/secret not configured'}), 500

    token_url = 'https://github.com/login/oauth/access_token'
    headers = {'Accept': 'application/json'}
    resp = requests.post(token_url, data={
        'client_id': client_id,
        'client_secret': client_secret,
        'code': code
    }, headers=headers)
    if resp.status_code != 200:
        return jsonify({'error': 'Failed to fetch access token', 'detail': resp.text}), 500
    token_data = resp.json()
    access_token = token_data.get('access_token')
    if not access_token:
        return jsonify({'error': 'No access token returned', 'detail': token_data}), 500

    # Fetch user info
    user_resp = requests.get('https://api.github.com/user', headers={'Authorization': f'token {access_token}'})
    if user_resp.status_code != 200:
        return jsonify({'error': 'Failed to fetch user info', 'detail': user_resp.text}), 500
    gh_user = user_resp.json()

    # Store or update user in database
    github_id = str(gh_user.get('id'))
    
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
        
        # Return user data with unencrypted token
        user_data = user.to_dict()
        user_data['accessToken'] = access_token  # Frontend needs this
        
        return jsonify({'user': user_data, 'userToken': token, 'token': token}), 200


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
        
        # Add new cache entries
        simplified = []
        for r in repos:
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
        
        if not github_url:
            return jsonify({'error': 'GitHub URL is required'}), 400
        
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
        thread = Thread(target=run_analysis_async, args=(analysis_id, github_url))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'status': 'started',
            'analysis_id': analysis_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analysis-status/<analysis_id>', methods=['GET'])
def get_analysis_status(analysis_id):
    """
    Get current status of an analysis
    """
    if analysis_id not in analysis_progress:
        return jsonify({'error': 'Analysis not found'}), 404
    
    progress = analysis_progress[analysis_id]
    
    # If completed, include the data
    if progress['status'] == 'completed' and 'data' in progress:
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
    Expected payload: { "agent_data": {...}, "repo_url": "..." }
    """
    try:
        data = request.json
        agent_data = data.get('agent_data')
        repo_url = data.get('repo_url', '')
        
        if not agent_data:
            return jsonify({'error': 'Agent data is required'}), 400
        
        # Check cache first
        cache_key = f"testing_{repo_url}" if repo_url else None
        if cache_key and cache_key in testing_cache:
            cached_session = testing_cache[cache_key]
            # Create new session with cached test cases
            session_id = str(uuid.uuid4())
            testing_sessions[session_id] = {
                'agent_data': agent_data,
                'test_cases': cached_session['test_cases'],
                'test_results': [],
                'status': 'ready_for_confirmation',
                'progress': [],
                'from_cache': True
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
        session_id = str(uuid.uuid4())
        testing_sessions[session_id] = {
            'agent_data': agent_data,
            'test_cases': [],
            'test_results': [],
            'status': 'generating',
            'progress': [],
            'from_cache': False
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
            
            test_cases = test_generator.generate_test_cases(agent_data, progress_callback)
            testing_sessions[session_id]['test_cases'] = test_cases
            testing_sessions[session_id]['status'] = 'ready_for_confirmation'
            
            # Cache the test cases
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
    List all cached repositories
    """
    try:
        cached_repos = cache_manager.get_all_cached_repos()
        return jsonify({
            'status': 'success',
            'cached_repos': cached_repos
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cache/invalidate', methods=['POST'])
def invalidate_cache():
    """
    Invalidate cache for a specific GitHub URL
    Expected payload: { "github_url": "..." }
    """
    try:
        data = request.json
        github_url = data.get('github_url')
        
        if not github_url:
            return jsonify({'error': 'GitHub URL is required'}), 400
        
        success = cache_manager.invalidate(github_url)
        
        return jsonify({
            'status': 'success',
            'invalidated': success
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cache/clear', methods=['POST'])
def clear_cache():
    """
    Clear all cached data
    """
    try:
        cache_manager.clear_all()
        
        return jsonify({
            'status': 'success',
            'message': 'All cache cleared'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
