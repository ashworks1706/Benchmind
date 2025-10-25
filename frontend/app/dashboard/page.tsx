'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { projectService } from '@/lib/projects';
import { Project } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Plus, Github, LogOut, FolderGit2, Activity, Calendar, TrendingUp } from 'lucide-react';
import { Dashboard } from '@/components/Dashboard';

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProjects, setShowProjects] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      // If not authenticated, show old dashboard (no auth required yet)
      setLoading(false);
      return;
    }

    if (user) {
      setShowProjects(true);
      loadProjects();
    }
  }, [user, authLoading]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowProjects(false);
  };

  // Show old dashboard if not logged in
  if (!user && !authLoading) {
    return (
      <div className="flex flex-col h-screen">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h1 className="text-xl font-bold">AI Agent Benchmark</h1>
          <Button
            onClick={() => router.push('/login')}
            variant="outline"
          >
            <Github className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </div>
        <Dashboard />
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show projects dashboard if logged in
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">AI Agent Benchmark</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
              <img 
                src={user?.avatarUrl} 
                alt={user?.username}
                className="w-8 h-8 rounded-full"
              />
              <span className="font-medium">{user?.username}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<FolderGit2 className="w-6 h-6" />}
            title="Total Projects"
            value={projects.length}
            color="blue"
          />
          <StatCard
            icon={<Activity className="w-6 h-6" />}
            title="Total Analyses"
            value={projects.reduce((sum, p) => sum + p.totalAnalyses, 0)}
            color="green"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Avg Score"
            value={
              projects.length > 0
                ? Math.round(projects.reduce((sum, p) => sum + (p.averageScore || 0), 0) / projects.length)
                : 0
            }
            suffix="%"
            color="purple"
          />
        </div>

        {/* Projects Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Your Projects</h2>
            <Button
              onClick={() => router.push('/projects/new')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>

          {projects.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
              <FolderGit2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first project to start benchmarking your AI agents
              </p>
              <Button
                onClick={() => router.push('/projects/new')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => router.push(`/projects/${project.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, title, value, suffix = '', color }: any) {
  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-background border border-border rounded-xl p-6 space-y-3">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <div className="text-3xl font-bold">{value}{suffix}</div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </div>
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-background border border-border rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer space-y-4"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <h3 className="font-semibold text-lg truncate">{project.name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Github className="w-4 h-4" />
            <span className="truncate">{project.repoName}</span>
          </div>
        </div>
      </div>

      {project.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <Activity className="w-4 h-4 text-blue-600" />
          <span>{project.totalAnalyses} analyses</span>
        </div>
        {project.averageScore && (
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span>{project.averageScore}% avg</span>
          </div>
        )}
      </div>

      {project.lastAnalyzedAt && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>Last analyzed {new Date(project.lastAnalyzedAt).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
}

