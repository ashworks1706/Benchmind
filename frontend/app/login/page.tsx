'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Github, Zap, Target, TrendingUp, Shield } from 'lucide-react';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="max-w-6xl w-full mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Branding */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Agent Benchmark
              </h1>
              <p className="text-xl text-muted-foreground">
                Comprehensive analysis and testing platform for your AI agent systems
              </p>
            </div>

            <div className="space-y-4">
              <Feature
                icon={<Target className="w-5 h-5" />}
                title="Deep Analysis"
                description="Visualize agent architectures, tools, and relationships"
              />
              <Feature
                icon={<Zap className="w-5 h-5" />}
                title="Research-Level Testing"
                description="Industry-standard benchmarks for accuracy, performance, and security"
              />
              <Feature
                icon={<TrendingUp className="w-5 h-5" />}
                title="Track Progress"
                description="Monitor improvements across multiple projects and iterations"
              />
              <Feature
                icon={<Shield className="w-5 h-5" />}
                title="Best Practices"
                description="Get actionable recommendations to improve your agents"
              />
            </div>
          </div>

          {/* Right side - Login Card */}
          <div className="bg-background/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-8 space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-bold">Welcome Back</h2>
              <p className="text-muted-foreground">
                Sign in with GitHub to access your projects
              </p>
            </div>

            <Button
              onClick={login}
              size="lg"
              className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Github className="w-6 h-6 mr-3" />
              Continue with GitHub
            </Button>

            <div className="pt-4 space-y-2 text-sm text-muted-foreground text-center">
              <p>By signing in, you agree to our Terms of Service</p>
              <p>We only access public repository information</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
