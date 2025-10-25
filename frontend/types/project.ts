export interface Project {
  id: string;
  name: string;
  description?: string;
  repoUrl: string;
  repoName: string;
  repoOwner: string;
  userId: string;
  
  // Configuration
  config: ProjectConfig;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastAnalyzedAt?: string;
  
  // Stats
  totalAnalyses: number;
  totalTests: number;
  averageScore?: number;
}

export interface ProjectConfig {
  // Test Settings
  testingEnabled: boolean;
  autoTestOnAnalysis: boolean;
  testDepth: 'basic' | 'intermediate' | 'advanced' | 'research';
  
  // Benchmark Thresholds
  thresholds: {
    toolAccuracy: number;
    routingAccuracy: number;
    responseTime: number;
    reasoningScore: number;
    collaborationEfficiency: number;
    securityScore: number;
  };
  
  // Analysis Settings
  includeTools: boolean;
  includeRelationships: boolean;
  cacheEnabled: boolean;
  
  // Notifications
  notifyOnCompletion: boolean;
  notifyOnFailures: boolean;
}

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  testingEnabled: true,
  autoTestOnAnalysis: true,
  testDepth: 'intermediate',
  thresholds: {
    toolAccuracy: 85,
    routingAccuracy: 85,
    responseTime: 500,
    reasoningScore: 85,
    collaborationEfficiency: 85,
    securityScore: 90,
  },
  includeTools: true,
  includeRelationships: true,
  cacheEnabled: true,
  notifyOnCompletion: false,
  notifyOnFailures: true,
};
