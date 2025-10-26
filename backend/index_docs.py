"""
Helper script to index documentation into RAG system
Uses HuggingFace sentence-transformers for embeddings (no API key needed)
"""

from services.rag_service import get_rag_service
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define documentation structure with sections
DOCUMENTATION_SECTIONS = [
    {
        'id': 'getting-started',
        'title': 'Getting Started',
        'content': '''
        This framework helps you test and evaluate AI agent systems. 
        Start by connecting your GitHub repository containing LangChain agents.
        The system will automatically detect agents, tools, and their relationships.
        ''',
        'keywords': ['getting started', 'setup', 'introduction', 'quickstart', 'begin']
    },
    {
        'id': 'analysis',
        'title': 'Code Analysis',
        'content': '''
        The analysis phase scans your repository to identify:
        - AI agents and their configurations
        - Tools used by each agent
        - Relationships between agents and tools
        - Code structure and architecture
        This creates a comprehensive map of your agentic system.
        ''',
        'keywords': ['analysis', 'scan', 'detect', 'agents', 'tools', 'code analysis']
    },
    {
        'id': 'test-generation',
        'title': 'Test Generation',
        'content': '''
        Automatic test generation creates comprehensive test suites for your agents:
        - Functional tests for agent behavior
        - Tool integration tests
        - Performance benchmarks
        - Edge case scenarios
        Tests are generated based on agent capabilities and tool usage patterns.
        ''',
        'keywords': ['test generation', 'testing', 'test cases', 'automatic tests']
    },
    {
        'id': 'test-categories',
        'title': 'Test Categories',
        'content': '''
        Tests are organized into categories:
        - Functional: Core agent functionality
        - Integration: Tool and API integrations
        - Performance: Response times and efficiency
        - Reliability: Error handling and recovery
        - Security: Input validation and safety
        Each category has specific metrics and benchmarks.
        ''',
        'keywords': ['categories', 'functional', 'integration', 'performance', 'reliability', 'security']
    },
    {
        'id': 'reports',
        'title': 'Test Reports',
        'content': '''
        Comprehensive test reports include:
        - Executive summary with key metrics
        - Category performance analysis
        - Detailed test results
        - Visualization charts and graphs
        - Recommendations for improvements
        Reports can be exported and shared with your team.
        ''',
        'keywords': ['reports', 'results', 'metrics', 'analysis', 'visualization']
    },
    {
        'id': 'fix-recommendations',
        'title': 'Fix Recommendations',
        'content': '''
        AI-powered fix recommendations:
        - Identifies issues found in tests
        - Suggests specific code changes
        - Explains the rationale
        - Estimates impact and priority
        You can review, accept, or reject each fix individually.
        ''',
        'keywords': ['fixes', 'recommendations', 'improvements', 'suggestions', 'code changes']
    },
    {
        'id': 'github-integration',
        'title': 'GitHub Integration',
        'content': '''
        Seamless GitHub integration:
        - Connect with OAuth
        - Read repository code
        - Create pull requests with fixes
        - Track changes over time
        All code changes are submitted as reviewable PRs.
        ''',
        'keywords': ['github', 'integration', 'pull request', 'pr', 'git', 'repository']
    },
    {
        'id': 'metrics',
        'title': 'Metrics and Benchmarks',
        'content': '''
        Track important metrics:
        - Test success rate
        - Performance scores
        - Cost analysis (tokens, API calls)
        - Response time distribution
        - Error rates
        Compare against benchmarks to measure improvements.
        ''',
        'keywords': ['metrics', 'benchmarks', 'performance', 'tracking', 'kpi']
    },
    {
        'id': 'best-practices',
        'title': 'Best Practices',
        'content': '''
        Follow these best practices:
        - Run tests regularly during development
        - Review and accept appropriate fixes
        - Monitor performance trends
        - Keep tests updated with code changes
        - Use categories to organize test suites
        Regular testing helps maintain agent quality.
        ''',
        'keywords': ['best practices', 'tips', 'guidelines', 'recommendations', 'advice']
    },
    {
        'id': 'troubleshooting',
        'title': 'Troubleshooting',
        'content': '''
        Common issues and solutions:
        - Analysis not detecting agents: Check file structure and imports
        - Tests failing: Review agent configurations and API keys
        - Slow performance: Optimize tool usage and reduce API calls
        - Fix application errors: Review code conflicts
        Check logs for detailed error messages.
        ''',
        'keywords': ['troubleshooting', 'problems', 'issues', 'errors', 'debugging', 'help']
    },
]

def index_documentation():
    """Index all documentation sections into RAG system"""
    try:
        logger.info("Starting documentation indexing...")
        rag = get_rag_service()
        
        count = rag.index_documentation(DOCUMENTATION_SECTIONS)
        logger.info(f"Successfully indexed {count} documentation sections")
        
        # Get stats
        stats = rag.get_stats()
        logger.info(f"RAG database stats: {stats}")
        
        return count
        
    except Exception as e:
        logger.error(f"Error indexing documentation: {str(e)}", exc_info=True)
        raise

if __name__ == '__main__':
    count = index_documentation()
    print(f"✅ Indexed {count} documentation sections")
