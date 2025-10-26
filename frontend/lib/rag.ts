/**
 * RAG Search API Client
 * Provides search functionality across all indexed knowledge
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface SearchResult {
  id: string;
  title: string;
  preview: string;
  url: string;
  type: string;
  collection: string;
  score: number;
  metadata: Record<string, string | number | boolean>;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  count: number;
}

export interface RAGStats {
  agents: number;
  tools: number;
  reports: number;
  docs: number;
  code_context: number;
  relationships: number;
  total: number;
}

/**
 * Search across all indexed knowledge
 */
export async function searchKnowledge(
  query: string,
  projectId?: string,
  limit: number = 10
): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE}/api/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      project_id: projectId,
      limit,
    }),
  });

  if (!response.ok) {
    throw new Error('Search failed');
  }

  return response.json();
}

/**
 * Index analysis data into RAG system
 */
export async function indexAnalysis(analysisId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/rag/index/analysis/${analysisId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to index analysis');
  }
}

/**
 * Index test report into RAG system
 */
export async function indexTestReport(sessionId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/rag/index/report/${sessionId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to index test report');
  }
}

/**
 * Get RAG database statistics
 */
export async function getRAGStats(): Promise<RAGStats> {
  const response = await fetch(`${API_BASE}/api/rag/stats`);

  if (!response.ok) {
    throw new Error('Failed to get RAG stats');
  }

  const data = await response.json();
  return data.stats;
}
