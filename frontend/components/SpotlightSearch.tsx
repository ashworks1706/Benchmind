'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, File, TestTube, GitBranch, BookOpen, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  title: string;
  preview: string;
  url: string;
  type: string;
  collection: string;
  score: number;
  metadata: Record<string, any>;
}

interface SpotlightSearchProps {
  projectId?: string;
}

const COLLECTION_ICONS: Record<string, any> = {
  agents: GitBranch,
  tools: File,
  reports: TestTube,
  docs: BookOpen,
  code_context: File,
  relationships: ArrowRight,
};

const COLLECTION_LABELS: Record<string, string> = {
  agents: 'Agent',
  tools: 'Tool',
  reports: 'Report',
  docs: 'Documentation',
  code_context: 'Code',
  relationships: 'Relationship',
  projects: 'Project',
  test_sessions: 'Test Session',
};

const TYPE_COLORS: Record<string, string> = {
  agents: 'bg-blue-500/10 text-blue-500',
  tools: 'bg-purple-500/10 text-purple-500',
  reports: 'bg-green-500/10 text-green-500',
  docs: 'bg-orange-500/10 text-orange-500',
  code_context: 'bg-gray-500/10 text-gray-500',
  relationships: 'bg-pink-500/10 text-pink-500',
  projects: 'bg-indigo-500/10 text-indigo-500',
  test_sessions: 'bg-emerald-500/10 text-emerald-500',
};

export function SpotlightSearch({ projectId }: SpotlightSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchMode, setSearchMode] = useState<'hybrid' | 'rag' | 'sql'>('hybrid');
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query.trim(),
            project_id: projectId,
            limit: 20,
            mode: searchMode,  // 'hybrid', 'rag', or 'sql'
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, projectId, searchMode]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      scrollToSelected();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
      scrollToSelected();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        navigateToResult(results[selectedIndex]);
      }
    }
  };

  const scrollToSelected = useCallback(() => {
    setTimeout(() => {
      if (resultsRef.current) {
        const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }, 0);
  }, [selectedIndex]);

  const navigateToResult = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    router.push(result.url);
  };

  const getIcon = (collection: string) => {
    const Icon = COLLECTION_ICONS[collection] || File;
    return <Icon className="w-4 h-4" />;
  };

  const getLabel = (collection: string) => {
    return COLLECTION_LABELS[collection] || 'Item';
  };

  const getColor = (collection: string) => {
    return TYPE_COLORS[collection] || 'bg-gray-500/10 text-gray-500';
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={() => setIsOpen(false)}
      />

      {/* Search Dialog */}
      <div className="fixed top-[20vh] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search agents, tools, reports, docs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
            />
            {isLoading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
            
            {/* Search Mode Toggle */}
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded text-xs">
              <button
                onClick={() => setSearchMode('hybrid')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  searchMode === 'hybrid' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Hybrid: Combines semantic (AI) and keyword search"
              >
                Hybrid
              </button>
              <button
                onClick={() => setSearchMode('rag')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  searchMode === 'rag' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
                title="RAG: Semantic search using AI embeddings"
              >
                AI
              </button>
              <button
                onClick={() => setSearchMode('sql')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  searchMode === 'sql' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
                title="SQL: Keyword-based database search"
              >
                SQL
              </button>
            </div>
            
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 bg-gray-800 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div
            ref={resultsRef}
            className="max-h-[60vh] overflow-y-auto"
          >
            {results.length === 0 && query && !isLoading && (
              <div className="px-4 py-8 text-center text-gray-500">
                No results found for &quot;{query}&quot;
              </div>
            )}

            {results.length === 0 && !query && (
              <div className="px-4 py-8 text-center">
                <Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  Start typing to search across all your project knowledge
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {Object.entries(COLLECTION_LABELS).map(([key, label]) => (
                    <span
                      key={key}
                      className={`px-2 py-1 text-xs rounded-full ${getColor(key)}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => navigateToResult(result)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full px-4 py-3 flex items-start gap-3 transition-colors ${
                  index === selectedIndex
                    ? 'bg-gray-800'
                    : 'hover:bg-gray-800/50'
                }`}
              >
                {/* Icon */}
                <div className={`mt-1 p-2 rounded ${getColor(result.collection)}`}>
                  {getIcon(result.collection)}
                </div>

                {/* Content */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white truncate">
                      {result.title}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${getColor(result.collection)}`}>
                      {getLabel(result.collection)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {result.preview}
                  </p>
                  {result.metadata.file_path && (
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {result.metadata.file_path}
                    </p>
                  )}
                </div>

                {/* Score Badge */}
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  {Math.round(result.score * 100)}%
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          {results.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">↵</kbd>
                  Select
                </span>
              </div>
              <span>{results.length} results</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
