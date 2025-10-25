'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, GitHubRepo } from '@/lib/auth';
import { authService } from '@/lib/auth';
import { projectService } from '@/lib/projects';
import { DEFAULT_PROJECT_CONFIG, ProjectConfig } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Github, Search, RefreshCw, Settings2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function NewProjectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_PROJECT_CONFIG);
  const [creating, setCreating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadRepos();
    }
  }, [user, authLoading, router]);

  const loadRepos = async () => {
    try {
      setLoading(true);
      const data = await authService.getGitHubRepos();
      setRepos(data);
    } catch (error) {
      console.error('Failed to load repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const data = await authService.refreshUserRepos();
      setRepos(data);
    } catch (error) {
      console.error('Failed to refresh repositories:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectRepo = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    if (!projectName) {
      setProjectName(repo.name);
    }
    if (!description && repo.description) {
      setDescription(repo.description);
    }
  };

  const handleCreate = async () => {
    if (!selectedRepo) return;

    try {
      setCreating(true);
      const project = await projectService.createProject({
        name: projectName,
        description,
        repoUrl: selectedRepo.html_url,
        config,
      });
      router.push(`/projects/${project.id}`);
    } catch (error: any) {
      console.error('Failed to create project:', error);
      alert(error.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Create New Project</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Repository Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Select Repository</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[600px] border border-border rounded-lg">
              <div className="p-4 space-y-2">
                {filteredRepos.map((repo) => (
                  <div
                    key={repo.id}
                    onClick={() => handleSelectRepo(repo)}
                    className={`p-4 border border-border rounded-lg cursor-pointer transition-all hover:border-blue-500 ${
                      selectedRepo?.id === repo.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Github className="w-4 h-4 flex-shrink-0" />
                          <span className="font-semibold truncate">{repo.name}</span>
                          {repo.private && (
                            <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                              Private
                            </span>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {repo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {repo.language && <span>{repo.language}</span>}
                          <span>⭐ {repo.stargazers_count}</span>
                          <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Project Configuration */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Project Details</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My AI Agent Project"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your project..."
                  rows={3}
                />
              </div>

              {selectedRepo && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm font-medium mb-2">Selected Repository</div>
                  <div className="flex items-center gap-2 text-sm">
                    <Github className="w-4 h-4" />
                    <span className="font-mono">{selectedRepo.full_name}</span>
                  </div>
                </div>
              )}

              {/* Advanced Configuration */}
              <div className="border border-border rounded-lg">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    <span className="font-medium">Advanced Configuration</span>
                  </div>
                  <span>{showAdvanced ? '−' : '+'}</span>
                </button>

                {showAdvanced && (
                  <div className="p-4 border-t border-border space-y-4">
                    <div className="space-y-2">
                      <Label>Test Depth</Label>
                      <Select
                        value={config.testDepth}
                        onValueChange={(value: any) => setConfig({ ...config, testDepth: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="research">Research Level</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tool Accuracy Threshold</Label>
                        <Input
                          type="number"
                          value={config.thresholds.toolAccuracy}
                          onChange={(e) => setConfig({
                            ...config,
                            thresholds: { ...config.thresholds, toolAccuracy: Number(e.target.value) }
                          })}
                          min={0}
                          max={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Response Time (ms)</Label>
                        <Input
                          type="number"
                          value={config.thresholds.responseTime}
                          onChange={(e) => setConfig({
                            ...config,
                            thresholds: { ...config.thresholds, responseTime: Number(e.target.value) }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleCreate}
              disabled={!selectedRepo || !projectName || creating}
              className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
