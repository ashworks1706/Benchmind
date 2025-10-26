'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { ArrowLeft, FileText, Calendar, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReportsListPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const { testCollections, loadFromLocalStorage } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      await loadFromLocalStorage();
      setIsLoading(false);
    };
    load();
  }, [loadFromLocalStorage]);

  const handleReportClick = (sessionId: string) => {
    router.push(`/projects/${projectId}/reports/${sessionId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
          <div className="text-xl font-semibold">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-muted/30">
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/projects/${projectId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Button>
          
          <h1 className="text-4xl font-bold mb-2">Test Reports</h1>
          <p className="text-muted-foreground">
            View all testing sessions and their reports
          </p>
        </div>

        {/* Reports Grid */}
        {testCollections.length === 0 ? (
          <div className="text-center py-16 bg-background rounded-lg border border-border">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Test Reports Yet</h3>
            <p className="text-muted-foreground mb-6">
              Run test sessions from the project dashboard to generate reports
            </p>
            <Button onClick={() => router.push(`/projects/${projectId}`)}>
              Go to Project Dashboard
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testCollections.map((collection) => {
              const session = collection.testSessions?.[0];
              if (!session) return null;

              const { metadata } = session;
              const successRate = metadata?.successRate || 0;
              const statusColor = 
                successRate >= 90 ? 'text-green-600' :
                successRate >= 70 ? 'text-yellow-600' :
                'text-red-600';

              return (
                <div
                  key={collection.id}
                  onClick={() => handleReportClick(session.id)}
                  className="bg-background rounded-lg border border-border p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                        {collection.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {collection.description}
                      </p>
                    </div>
                    <FileText className="w-5 h-5 text-muted-foreground shrink-0 ml-2" />
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-2xl font-bold">{metadata?.totalTests || 0}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded">
                      <div className="text-2xl font-bold text-green-600">{metadata?.passedTests || 0}</div>
                      <div className="text-xs text-muted-foreground">Passed</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 dark:bg-red-950/20 rounded">
                      <div className="text-2xl font-bold text-red-600">{metadata?.failedTests || 0}</div>
                      <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                  </div>

                  {/* Success Rate */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className={`font-bold ${statusColor}`}>{successRate.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          successRate >= 90 ? 'bg-green-500' :
                          successRate >= 70 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${successRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(collection.createdAt).toLocaleDateString()}
                    </div>
                    {metadata?.totalFixes > 0 && (
                      <div className="flex items-center gap-1">
                        {metadata.pendingFixes > 0 ? (
                          <>
                            <AlertCircle className="w-3 h-3 text-yellow-600" />
                            <span>{metadata.pendingFixes} pending fixes</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span>All reviewed</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
