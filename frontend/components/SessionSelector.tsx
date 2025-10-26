'use client';

import { useStore } from '@/lib/store';
import { Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export const SESSION_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple gradient
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Pink-red gradient
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Blue-cyan gradient
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Green-cyan gradient
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Pink-yellow gradient
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', // Cyan-purple gradient
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // Soft pastel gradient
  'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)', // Orange-pink gradient
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', // Peach gradient
  'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)', // Red-blue gradient
];

export function SessionSelector() {
  const { testCollections, activeCollectionId, visibleSessionIds, toggleSessionVisibility } = useStore();

  const activeCollection = testCollections.find(c => c.id === activeCollectionId);
  const sessions = activeCollection?.testSessions || [];

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-background/95 backdrop-blur-sm border-2 border-primary/20 rounded-lg shadow-xl p-3 max-w-4xl">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-xs font-bold text-muted-foreground uppercase">Test Sessions</h3>
        <span className="text-xs text-muted-foreground">
          ({visibleSessionIds.length} of {sessions.length} visible)
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {sessions.map((session, index) => {
          const isVisible = visibleSessionIds.includes(session.id);
          const sessionColor = session.color || SESSION_COLORS[index % SESSION_COLORS.length];
          
          return (
            <button
              key={session.id}
              onClick={() => toggleSessionVisibility(session.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                isVisible
                  ? 'border-opacity-80 shadow-lg'
                  : 'bg-muted/50 border-muted opacity-50 hover:opacity-70'
              }`}
              style={{
                background: isVisible ? sessionColor : undefined,
                borderImage: isVisible ? `${sessionColor} 1` : undefined,
              }}
            >
              {/* Visibility Icon */}
              <div className="shrink-0">
                {isVisible ? (
                  <Eye className="w-4 h-4 text-white drop-shadow" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
              </div>

              {/* Color Indicator */}
              <div
                className="w-3 h-3 rounded-full shrink-0 border border-white/30 shadow"
                style={{ background: sessionColor }}
              />

              {/* Session Info */}
              <div className="flex flex-col items-start">
                <span className="text-xs font-semibold text-white drop-shadow-md">
                  {session.name}
                </span>
                <div className="flex items-center gap-2 text-xs text-white/90">
                  <span className="flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    {session.metadata.passedTests}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <XCircle className="w-3 h-3" />
                    {session.metadata.failedTests}
                  </span>
                  {session.metadata.warningTests > 0 && (
                    <span className="flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      {session.metadata.warningTests}
                    </span>
                  )}
                </div>
              </div>

              {/* Pending Fixes Badge */}
              {session.metadata.pendingFixes > 0 && (
                <div className="flex-shrink-0 px-1.5 py-0.5 bg-yellow-500/20 border border-yellow-500 rounded text-xs font-semibold text-yellow-700">
                  {session.metadata.pendingFixes} pending
                </div>
              )}

              {/* Completion Date */}
              {session.completedAt && (
                <span className="text-xs text-muted-foreground">
                  {new Date(session.completedAt).toLocaleDateString()}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
        💡 <strong>Tip:</strong> Click sessions to toggle visibility. Multiple sessions can be displayed simultaneously with different colors.
      </div>
    </div>
  );
}
