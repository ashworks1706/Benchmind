import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Configuration class for the application"""
    
    # API Keys
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
    
    # Flask Config
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    PORT = int(os.getenv('PORT', 5000))
    
    # Test Configuration
    MAX_TEST_CASES = 10
    TEST_TIMEOUT = 300  # 5 minutes
    
    # Parser Configuration
    MAX_FILE_SIZE = 1024 * 1024 * 5  # 5MB
    SUPPORTED_EXTENSIONS = ['.py', '.js', '.ts', '.json']
    
    @staticmethod
    def validate():
        """Validate required configuration"""
        if not Config.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set")
        if not Config.GITHUB_TOKEN:
            raise ValueError("GITHUB_TOKEN is not set")
