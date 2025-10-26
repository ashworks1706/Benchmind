/**
 * Test Collection Types
 */

export interface TestCollection {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  testCases: string[]; // Array of test case IDs
  testReport: any | null;
  status: 'draft' | 'running' | 'completed' | 'failed';
  sessionId: string | null;
  metadata: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    successRate: number;
  };
}

export interface CollectionSummary {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'completed' | 'failed';
  testCount: number;
  successRate: number;
  lastRun: string;
}
