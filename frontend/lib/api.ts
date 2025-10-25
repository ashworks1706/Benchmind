import axios from 'axios';
import { AgentData, TestCase, TestResult, Fix } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Analyze GitHub repository
  analyzeRepository: async (githubUrl: string): Promise<AgentData> => {
    const response = await api.post('/api/analyze-repo', {
      github_url: githubUrl,
    });
    return response.data.data;
  },

  // Start repository analysis (non-blocking, returns analysis_id)
  startAnalysis: async (githubUrl: string): Promise<string> => {
    const response = await api.post('/api/analyze-repo', {
      github_url: githubUrl,
    });
    return response.data.analysis_id;
  },

  // Get analysis status by ID
  getAnalysisStatus: async (analysisId: string): Promise<{
    status: 'in_progress' | 'success' | 'error';
    progress: {
      step: number;
      name: string;
      status: string;
      message: string;
      total_steps: number;
    };
    data?: AgentData;
    from_cache?: boolean;
  }> => {
    const response = await api.get(`/api/analysis-status/${analysisId}`);
    return response.data;
  },

  // Generate test cases
  generateTests: async (agentData: AgentData): Promise<TestCase[]> => {
    const response = await api.post('/api/generate-tests', {
      agent_data: agentData,
    });
    return response.data.test_cases;
  },

  // Run a specific test
  runTest: async (
    testCase: TestCase,
    agentData: AgentData
  ): Promise<TestResult> => {
    const response = await api.post('/api/run-test', {
      test_case: testCase,
      agent_data: agentData,
    });
    return response.data.result;
  },

  // Apply a fix
  applyFix: async (fix: Fix, agentData: AgentData) => {
    const response = await api.post('/api/apply-fix', {
      fix: fix.fix,
      agent_data: agentData,
    });
    return response.data;
  },

  // Update agent configuration
  updateAgent: async (agentId: string, updates: any) => {
    const response = await api.post('/api/update-agent', {
      agent_id: agentId,
      updates,
    });
    return response.data;
  },

  // Cache management
  listCachedRepos: async () => {
    const response = await api.get('/api/cache/list');
    return response.data.cached_repos;
  },

  invalidateCache: async (githubUrl: string) => {
    const response = await api.post('/api/cache/invalidate', {
      github_url: githubUrl,
    });
    return response.data;
  },

  clearAllCache: async () => {
    const response = await api.post('/api/cache/clear');
    return response.data;
  },
};
