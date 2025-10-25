'use client';

import { useState, useEffect } from 'react';

export interface User {
  id: string;
  githubId: string;
  username: string;
  email: string;
  avatarUrl: string;
  accessToken: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  private: boolean;
  updated_at: string;
  language: string;
  stargazers_count: number;
}

class AuthService {
  private readonly BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  
  async loginWithGitHub(): Promise<void> {
    // Redirect to backend OAuth flow
    window.location.href = `${this.BACKEND_URL}/auth/github/login`;
  }

  async handleCallback(code: string): Promise<User> {
    const response = await fetch(`${this.BACKEND_URL}/auth/github/callback?code=${code}`);
    if (!response.ok) {
      throw new Error('Failed to authenticate');
    }
    const data = await response.json();
    
    // Store user in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('accessToken', data.user.accessToken);
    }
    
    return data.user;
  }

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userToken');
    }
  }

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  getUserToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('userToken');
  }

  async getGitHubRepos(): Promise<GitHubRepo[]> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${this.BACKEND_URL}/auth/github/repos`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch repositories');
    }

    return response.json();
  }

  async refreshUserRepos(): Promise<GitHubRepo[]> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${this.BACKEND_URL}/auth/github/repos/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to refresh repositories');
    }

    return response.json();
  }
}

export const authService = new AuthService();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async () => {
    await authService.loginWithGitHub();
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
