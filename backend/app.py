from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

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

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Backend is running'}), 200

@app.route('/api/analyze-repo', methods=['POST'])
def analyze_repository():
    """
    Analyze a GitHub repository to extract agent information
    Expected payload: { "github_url": "https://github.com/user/repo" }
    """
    try:
        data = request.json
        github_url = data.get('github_url')
        
        if not github_url:
            return jsonify({'error': 'GitHub URL is required'}), 400
        
        # Step 1: Scrape repository
        repo_data = github_scraper.scrape_repository(github_url)
        
        # Step 2: Parse agents and their configurations
        agent_data = agent_parser.parse_agents(repo_data)
        
        return jsonify({
            'status': 'success',
            'data': agent_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
