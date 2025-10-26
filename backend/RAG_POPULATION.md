# RAG Database Population

This document explains how to populate and manage the RAG (Retrieval-Augmented Generation) database with existing data from the SQL database.

## Overview

The RAG system uses ChromaDB with FastEmbed embeddings to provide semantic search across:
- **Agents**: Agent definitions, capabilities, and code
- **Tools**: Tool definitions, parameters, and usage
- **Reports**: Test reports, results, and recommendations
- **Relationships**: Agent-tool connections
- **Code Context**: Code snippets and documentation

## Quick Start

### Populate RAG Database

```bash
# From backend directory
cd backend

# Run the population script
./populate-rag.fish

# Or directly with Python
python3 populate_rag.py
```

### Check RAG Statistics

```bash
python3 populate_rag.py --stats-only
```

### Clear and Repopulate

```bash
# Clear existing data and repopulate (use with caution!)
python3 populate_rag.py --clear
```

## What Gets Indexed

### From Analyses
- Agent definitions with names, types, and descriptions
- Tool definitions with parameters and usage examples
- Agent-tool relationships and connections
- Code snippets with context

### From Test Sessions
- Test report summaries with success rates
- Category performance metrics
- Individual test results with details
- Recommendations and fixes

## Search Modes

The enhanced search endpoint supports three modes:

### 1. Hybrid (Default)
Combines RAG semantic search with SQL keyword search for best results.

```bash
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "authentication agent", "mode": "hybrid"}'
```

### 2. RAG Only
Uses AI embeddings for semantic understanding of search queries.

```bash
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "how to authenticate users", "mode": "rag"}'
```

### 3. SQL Only
Traditional keyword-based search in project and session names/descriptions.

```bash
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "billing", "mode": "sql"}'
```

## Frontend Integration

The SpotlightSearch component (`Ctrl+K` / `Cmd+K`) now includes:

- **Mode Toggle**: Switch between Hybrid/AI/SQL search
- **Enhanced Results**: Shows projects and test sessions from SQL
- **Visual Indicators**: Different colors for different result types

## Automatic Indexing

New data is automatically indexed when:

1. **Analysis Complete**: After GitHub scraping and agent parsing
   - Endpoint: `/api/projects/{id}/analyze`
   - Indexes: agents, tools, relationships, code snippets

2. **Tests Run**: After test session completion
   - Endpoint: `/api/projects/{id}/tests/{sessionId}/run`
   - Indexes: test reports, results, recommendations

## Database Structure

### ChromaDB Collections

```
chromadb/
├── agents/          # Agent definitions
├── tools/           # Tool definitions
├── reports/         # Test reports and results
├── docs/            # Documentation (future)
├── code_context/    # Code snippets
└── relationships/   # Agent-tool connections
```

### Metadata Schema

Each indexed document includes:
- `analysis_id` or `session_id`: Source identifier
- `project_id`: Parent project
- `page_type`: Where to navigate (`project_detail`, `report_detail`, `docs`)
- `page_url`: Full URL path
- `section_id`: Anchor for deep linking
- `timestamp`: Index time

## Performance

- **Embeddings**: FastEmbed (BAAI/bge-small-en-v1.5)
  - Model size: 33MB
  - Dimensions: 384
  - Fast and accurate for code/tech content

- **Search Speed**: 
  - RAG: ~100-200ms for 10 results
  - SQL: ~10-50ms for 5 results
  - Hybrid: ~150-250ms total

## Troubleshooting

### No Results Found

1. Check if RAG database is populated:
   ```bash
   python3 populate_rag.py --stats-only
   ```

2. If empty, populate it:
   ```bash
   ./populate-rag.fish
   ```

### Stale Data

If you've made changes to existing analyses or reports:

```bash
# Repopulate to get latest data
python3 populate_rag.py --clear
```

### Search Quality Issues

- **Too many irrelevant results**: Use SQL mode for exact matching
- **Missing results**: Use Hybrid mode for broader coverage
- **Wrong context**: Check if data is properly indexed (stats-only)

## Examples

### Search for Agents

```python
# Find all authentication-related agents
GET /api/search
{
  "query": "authentication login user",
  "mode": "rag",
  "limit": 10
}
```

### Find Test Failures

```python
# Find failed tests with recommendations
GET /api/search
{
  "query": "failed error fix",
  "mode": "hybrid",
  "limit": 20
}
```

### Project Discovery

```python
# Find projects by name or description
GET /api/search
{
  "query": "e-commerce",
  "mode": "sql",
  "limit": 5
}
```

## Maintenance

### Regular Updates

Run weekly to ensure RAG database stays in sync:

```bash
# Add to cron or scheduled task
0 2 * * 0 cd /path/to/backend && ./populate-rag.fish
```

### Monitor Usage

Check ChromaDB size and performance:

```bash
du -sh data/chromadb/
# Should be < 100MB for typical usage
```

### Backup

ChromaDB data is stored in `backend/data/chromadb/`:

```bash
# Backup
tar -czf chromadb-backup-$(date +%Y%m%d).tar.gz data/chromadb/

# Restore
tar -xzf chromadb-backup-20250101.tar.gz
```

## API Reference

### POST /api/search

Search across all indexed knowledge.

**Request:**
```json
{
  "query": "string",
  "project_id": "optional-uuid",
  "limit": 10,
  "mode": "hybrid|rag|sql"
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "string",
      "title": "string",
      "preview": "string",
      "url": "string",
      "type": "string",
      "collection": "string",
      "score": 0.95,
      "metadata": {}
    }
  ],
  "query": "string",
  "count": 10,
  "mode": "hybrid"
}
```

### GET /api/rag/stats

Get RAG database statistics (future endpoint).

## Architecture

```
User Query (Ctrl+K)
    ↓
SpotlightSearch Component
    ↓
POST /api/search
    ↓
    ├─→ RAG Service (ChromaDB + FastEmbed)
    │   ├─→ agents collection
    │   ├─→ tools collection
    │   ├─→ reports collection
    │   └─→ code_context collection
    │
    └─→ SQL Database (PostgreSQL)
        ├─→ projects table
        └─→ test_sessions table
    ↓
Merged & Sorted Results
    ↓
Navigate to Result URL
```

## Future Enhancements

- [ ] Index documentation pages
- [ ] Add filters (date range, project, type)
- [ ] Implement pagination for large result sets
- [ ] Add search analytics and popular queries
- [ ] Support boolean operators (AND, OR, NOT)
- [ ] Add autocomplete suggestions
- [ ] Export search results

## Contributing

To improve search quality:

1. Enhance indexing in `services/rag_service.py`
2. Add more metadata for better filtering
3. Improve result ranking algorithms
4. Add more SQL search targets

## License

Same as parent project.
