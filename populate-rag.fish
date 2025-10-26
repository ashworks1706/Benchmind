#!/usr/bin/env fish
# Quick helper to populate RAG database from project root

echo "🔍 Populating RAG database with existing data..."
echo ""

cd (dirname (status --current-filename))/backend

if not test -f populate_rag.py
    echo "❌ Error: populate_rag.py not found!"
    echo "   Please run this script from the project root directory."
    exit 1
end

# Run the population script
python3 populate_rag.py $argv

set exit_code $status

if test $exit_code -eq 0
    echo ""
    echo "✨ Successfully populated RAG database!"
    echo ""
    echo "💡 Tips:"
    echo "   • Press Ctrl+K (Cmd+K on Mac) to search"
    echo "   • Try different modes: Hybrid, AI, SQL"
    echo "   • Check stats: cd backend && python3 populate_rag.py --stats-only"
else
    echo ""
    echo "❌ Failed to populate RAG database (exit code: $exit_code)"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   • Install deps: cd backend && pip3 install -r requirements.txt"
    echo "   • Start database: docker-compose up -d"
    echo "   • Check logs above for errors"
end

exit $exit_code
