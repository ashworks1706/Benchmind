/**
 * Test Collection Types
 */

import { TestCase } from './index';

export interface TestSession {
  id: string;
  name: string;
  color: string; // Unique color for visualization
  testCases: TestCase[]; // Array of FULL test case objects (not just IDs)
  testReport: any | null;
  createdAt: string;
  completedAt: string | null;
  metadata: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    warningTests: number;
    successRate: number;
    totalFixes: number;
    pendingFixes: number;
    acceptedFixes: number;
    rejectedFixes: number;
  };
  fixes: any[]; // Array of Fix objects with status
  fixesLocked: boolean; // True when user must accept/reject before proceeding
  appliedToGithub?: boolean; // True when fixes have been pushed to GitHub
  githubPrUrl?: string; // URL of the created Pull Request
}

export interface TestCollection {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  testCases: TestCase[]; // Array of FULL test case objects (not just IDs)
  testReport: any | null;
  status: 'draft' | 'running' | 'completed' | 'failed';
  sessionId: string | null;
  metadata: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    successRate: number;
  };
  testSessions: TestSession[]; // Array of test sessions for multi-session support
  activeSessionIds: string[]; // IDs of sessions currently displayed
}

export interface CollectionSummary {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'completed' | 'failed';
  testCount: number;
  successRate: number;
  lastRun: string;
}
