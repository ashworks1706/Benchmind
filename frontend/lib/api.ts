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
};
