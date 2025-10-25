# AI Agent Testing Framework - Backend

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Add your API keys to `.env`:
- `GEMINI_API_KEY`: Your Google Gemini API key
- `GITHUB_TOKEN`: Your GitHub personal access token

## Running the Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

- `GET /health` - Health check
- `POST /api/analyze-repo` - Analyze a GitHub repository
- `POST /api/generate-tests` - Generate test cases
- `POST /api/run-test` - Run a specific test
- `POST /api/apply-fix` - Apply a suggested fix
- `POST /api/update-agent` - Update agent configuration

## Project Structure

```
backend/
├── app.py                  # Main Flask application
├── config.py              # Configuration
├── requirements.txt       # Dependencies
├── services/
│   ├── github_scraper.py  # GitHub repository scraping
│   ├── agent_parser.py    # Agent parsing and analysis
│   ├── test_generator.py  # Test case generation and execution
│   └── code_editor.py     # Code editing and fix application
```
