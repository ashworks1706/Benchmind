from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import uuid
import time
from threading import Thread

from services.github_scraper import GitHubScraper
from services.agent_parser import AgentParser
from services.test_generator import TestGenerator
from services.code_editor import CodeEditor

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize services
github_scraper = GitHubScraper()
agent_parser = AgentParser()
test_generator = TestGenerator()
code_editor = CodeEditor()

# Store analysis progress in memory (in production, use Redis or similar)
analysis_progress = {}

def run_analysis_async(analysis_id, github_url):
    """Run analysis in background thread and update progress"""
    try:
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
        
        # Complete
        analysis_progress[analysis_id] = {
            'step': 5,
            'name': 'Complete',
            'status': 'completed',
            'message': f'Analysis complete! Found {len(agent_data["agents"])} agents, {len(agent_data["tools"])} tools, {len(agent_data["relationships"])} relationships',
            'total_steps': 5,
            'data': agent_data
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
            'data': progress['data']
        }), 200
    
    return jsonify({
        'status': 'in_progress' if progress['status'] == 'in_progress' else progress['status'],
        'progress': {
            'step': progress['step'],
            'name': progress['name'],
            'status': progress['status'],
            'message': progress['message'],
            'total_steps': progress['total_steps']
        }
    }), 200

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

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
