# RAG Database Population - Quick Guide

## 🚀 Quick Start

### Step 1: Install Dependencies (if needed)
```bash
cd backend
pip3 install -r requirements.txt
```

### Step 2: Populate RAG Database
```bash
# Make scripts executable (first time only)
chmod +x populate-rag.fish populate_rag.py

# Run the population script
./populate-rag.fish

# Or use Python directly
python3 populate_rag.py
```

### Step 3: Check Statistics
```bash
python3 populate_rag.py --stats-only
```

## 📊 What Gets Indexed

The script indexes **existing data** from your SQL database into ChromaDB for fast semantic search:

- ✅ **Agent Data**: All agents from completed analyses
- ✅ **Tool Data**: All tools and their definitions
- ✅ **Test Reports**: All test sessions and results
- ✅ **Relationships**: Agent-tool connections

## 🔍 Search Modes (Ctrl+K / Cmd+K)

The enhanced search now supports **3 modes**:

1. **Hybrid** (Default) - Best of both worlds
   - Combines AI semantic search + SQL keyword search
   - Recommended for most use cases

2. **AI** - Semantic understanding
   - Uses embeddings to understand meaning
   - Great for: "show me authentication agents"

3. **SQL** - Exact keyword matching
   - Fast database search
   - Great for: exact project names or IDs

## 📝 Usage Examples

### Search for Authentication Agents
```
Ctrl+K → "authentication" → See all auth-related agents
```

### Find Failed Tests
```
Ctrl+K → "failed tests" → See test failures and recommendations
```

### Find Projects
```
Ctrl+K → Switch to "SQL" mode → Type project name
```

## 🔄 When to Re-run

Run the population script when:
- First time setting up the project ✨
- After importing/migrating data 📦
- RAG database gets corrupted 🔧
- Search results seem outdated 🕐

## 🎯 Clear and Repopulate

**⚠️ Warning: This deletes all indexed data!**

```bash
python3 populate_rag.py --clear
# Type "yes" to confirm
```

## ✅ Verify It's Working

1. Run: `python3 populate_rag.py --stats-only`
2. You should see counts like:
   ```
   agents       :    15 documents
   tools        :    23 documents
   reports      :    45 documents
   ```
3. Open app and press Ctrl+K to search!

## 🐛 Troubleshooting

### "No results found"
→ Run `python3 populate_rag.py` to populate the database

### "ModuleNotFoundError: No module named 'psycopg2'"
→ Run `pip3 install -r requirements.txt`

### Database connection errors
→ Make sure PostgreSQL is running: `docker-compose up -d`

### Search returns old data
→ Re-run: `python3 populate_rag.py --clear`

## 🎨 Frontend Changes

The SpotlightSearch component now has:
- **Mode selector** buttons (Hybrid/AI/SQL)
- **Project search** support
- **Test session** search support
- **Better result categorization**

## 📚 Full Documentation

See `RAG_POPULATION.md` for detailed information about:
- Architecture
- API endpoints
- Performance metrics
- Advanced usage

---

**Happy Searching! 🎉**
