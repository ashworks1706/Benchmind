import { Project, ProjectConfig } from '@/types/project';
import { authService } from './auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

class ProjectService {
  async getProjects(): Promise<Project[]> {
    const token = authService.getUserToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${BACKEND_URL}/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    return response.json();
  }

  async getProject(id: string): Promise<Project> {
    const token = authService.getUserToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${BACKEND_URL}/projects/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }

    return response.json();
  }

  async createProject(data: {
    name: string;
    description?: string;
    repoUrl: string;
    config?: Partial<ProjectConfig>;
  }): Promise<Project> {
    const token = authService.getUserToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${BACKEND_URL}/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create project');
    }

    return response.json();
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const token = authService.getUserToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${BACKEND_URL}/projects/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update project');
    }

    return response.json();
  }

  async deleteProject(id: string): Promise<void> {
    const token = authService.getUserToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${BACKEND_URL}/projects/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
  }

  async analyzeProject(id: string): Promise<{ analysisId: string }> {
    const token = authService.getUserToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${BACKEND_URL}/projects/${id}/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to start analysis');
    }

    return response.json();
  }

  async getProjectAnalyses(projectId: string): Promise<any[]> {
    const token = authService.getUserToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/analyses`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch analyses');
    }

    return response.json();
  }
}

export const projectService = new ProjectService();
