'use client';

import { useStore } from '@/lib/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertTriangle, FileText, Calendar } from 'lucide-react';

export function TestSuitesPanel() {
  const { testCollections, setShowProgressReport } = useStore();

  const allSessions = testCollections.flatMap(c => 
    (c.testSessions || []).map(session => ({
      ...session,
      collectionName: c.name,
    }))
  );

  if (allSessions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Test Sessions</h3>
        <p className="text-sm text-muted-foreground">
          Run tests to create test sessions and view their progress reports.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Test Suites</h2>
          <span className="text-sm text-muted-foreground">
            {allSessions.length} {allSessions.length === 1 ? 'session' : 'sessions'}
          </span>
        </div>

        <div className="space-y-3">
          {allSessions.map((session) => {
            const hasUnresolvedFixes = session.metadata.pendingFixes > 0;
            
            return (
              <div
                key={session.id}
                className="border-2 rounded-lg p-4 hover:bg-muted/50 transition-colors"
                style={{
                  borderColor: session.color,
                  borderLeftWidth: '6px',
                }}
              >
                {/* Session Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-base" style={{ color: session.color }}>
                        {session.name}
                      </h3>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: session.color }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From collection: {session.collectionName}
                    </p>
                  </div>

                  {hasUnresolvedFixes && (
                    <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500 rounded text-xs font-semibold text-yellow-700 animate-pulse">
                      Action Required
                    </div>
                  )}
                </div>

                {/* Session Stats */}
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      <span className="text-lg font-bold text-green-600">
                        {session.metadata.passedTests}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">Passed</span>
                  </div>
                  
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <XCircle className="w-3 h-3 text-red-600" />
                      <span className="text-lg font-bold text-red-600">
                        {session.metadata.failedTests}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">Failed</span>
                  </div>
                  
                  {session.metadata.warningTests > 0 && (
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <AlertTriangle className="w-3 h-3 text-yellow-600" />
                        <span className="text-lg font-bold text-yellow-600">
                          {session.metadata.warningTests}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">Warnings</span>
                    </div>
                  )}
                  
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="text-lg font-bold text-blue-600 mb-1">
                      {session.metadata.successRate}%
                    </div>
                    <span className="text-xs text-muted-foreground">Success</span>
                  </div>
                </div>

                {/* Fixes Summary */}
                {session.metadata.totalFixes > 0 && (
                  <div className="flex items-center gap-4 text-xs mb-3 p-2 bg-muted/30 rounded">
                    <span className="font-semibold">Fixes:</span>
                    <span className="text-green-600">✅ {session.metadata.acceptedFixes} accepted</span>
                    <span className="text-red-600">❌ {session.metadata.rejectedFixes} rejected</span>
                    <span className="text-yellow-600 font-semibold">⏳ {session.metadata.pendingFixes} pending</span>
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Created: {new Date(session.createdAt).toLocaleString()}</span>
                  </div>
                  {session.completedAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Completed: {new Date(session.completedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* View Progress Report Button */}
                <Button
                  onClick={() => setShowProgressReport(true, session.id)}
                  className="w-full"
                  variant={hasUnresolvedFixes ? 'default' : 'outline'}
                  style={{
                    backgroundColor: hasUnresolvedFixes ? session.color : undefined,
                    borderColor: !hasUnresolvedFixes ? session.color : undefined,
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {hasUnresolvedFixes ? 'Review Pending Fixes' : 'View Progress Report'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
