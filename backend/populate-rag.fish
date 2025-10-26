#!/usr/bin/env fish
# Populate RAG database with existing data from SQL database

set SCRIPT_DIR (dirname (status --current-filename))

echo "🔍 Populating RAG database from existing SQL data..."
echo ""

python3 $SCRIPT_DIR/populate_rag.py $argv

set exit_code $status

if test $exit_code -eq 0
    echo ""
    echo "✨ Successfully populated RAG database!"
else
    echo ""
    echo "❌ Failed to populate RAG database (exit code: $exit_code)"
end

exit $exit_code
