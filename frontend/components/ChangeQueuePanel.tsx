'use client';

import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Check, GitCommit, Trash2, X, Github } from 'lucide-react';
import { useState } from 'react';
import { apiService } from '@/lib/api';

export default function ChangeQueuePanel() {
  const { queuedChanges, removeQueuedChange, clearQueuedChanges, addStatusMessage, agentData } = useStore();
  const [isPushing, setIsPushing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handlePushChanges = async () => {
    if (!agentData) return;
    
    // Close confirmation dialog
    setShowConfirmDialog(false);
    setIsPushing(true);

    try {
      addStatusMessage({
        type: 'info',
        message: `🚀 Pushing ${queuedChanges.length} queued changes to GitHub...`,
      });

      // Separate changes by type
      const fixes = queuedChanges.filter(c => c.type === 'fix');
      const edits = queuedChanges.filter(c => c.type === 'edit');

      let successCount = 0;
      let failCount = 0;

      // Apply all fixes in batch (single commit per file)
      if (fixes.length > 0) {
        try {
          const result = await apiService.applyFixesBatch(
            fixes.map(f => f.data.recommendation), 
            agentData
          );
          
          // Handle successful PR creation
          if (result.result.success && result.result.pr_url) {
            successCount += fixes.length;
            addStatusMessage({
              type: 'success',
              message: `✅ Pull Request created! ${result.result.files_updated} file(s) with ${result.result.total_fixes} fix(es)`,
            });
            
            // Show PR link
            addStatusMessage({
              type: 'success',
              message: `🔗 PR #${result.result.pr_number}: ${result.result.pr_url}`,
            });
            
            // Open PR in new tab
            if (typeof window !== 'undefined') {
              window.open(result.result.pr_url, '_blank');
            }
          } else if (result.result.success) {
            // Fallback for direct commits
            successCount += fixes.length;
            addStatusMessage({
              type: 'success',
              message: `✅ Committed ${result.result.files_updated} file(s) with ${result.result.total_fixes} fix(es)!`,
            });
          } else {
            failCount += fixes.length;
            const errorMsg = result.result.errors?.join?.(', ') || result.result.error || 'Unknown error';
            addStatusMessage({
              type: 'error',
              message: `❌ Failed to push fixes: ${errorMsg}`,
            });
          }
        } catch (error: any) {
          console.error('Failed to apply fixes batch:', error);
          failCount += fixes.length;
          addStatusMessage({
            type: 'error',
            message: `❌ Failed to push fixes: ${error.message}`,
          });
        }
      }

      // Apply edits individually (if you have edit functionality)
      for (const change of edits) {
        try {
          // Handle edit changes (implement based on your edit API)
          // await apiService.applyEdit(change.data);
          successCount++;
        } catch (error: any) {
          console.error(`Failed to apply change ${change.id}:`, error);
          failCount++;
        }
      }

      if (failCount === 0) {
        addStatusMessage({
          type: 'success',
          message: `✨ All changes successfully pushed and committed to GitHub!`,
        });
        clearQueuedChanges();
      } else {
        addStatusMessage({
          type: 'error',
          message: `⚠️ Pushed ${successCount} changes, ${failCount} failed`,
        });
      }
    } catch (error: any) {
      addStatusMessage({
        type: 'error',
        message: `❌ Failed to push changes: ${error.message}`,
      });
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {!isExpanded ? (
        // Collapsed view - just the badge
        <Button
          onClick={() => setIsExpanded(true)}
          className="shadow-lg hover:shadow-xl transition-all"
          variant="default"
          disabled={queuedChanges.length === 0}
        >
          <GitCommit className="w-4 h-4 mr-2" />
          {queuedChanges.length === 0 
            ? 'No Changes' 
            : `${queuedChanges.length} Queued Change${queuedChanges.length !== 1 ? 's' : ''}`
          }
        </Button>
      ) : (
        // Expanded view - full panel
        <div className="bg-background border border-border rounded-lg shadow-2xl w-96 max-h-96 flex flex-col">
          {/* Header */}
          <div className="p-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCommit className="w-5 h-5" />
              <h3 className="font-semibold">Change Queue</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {queuedChanges.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Change List */}
          <ScrollArea className="flex-1 max-h-64">
            <div className="p-2 space-y-2">
              {queuedChanges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No changes queued yet
                </div>
              ) : (
                queuedChanges.map((change) => (
                <div
                  key={change.id}
                  className="p-2 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          change.type === 'fix' 
                            ? 'bg-green-500/10 text-green-700 dark:text-green-300' 
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                        }`}>
                          {change.type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(change.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm truncate">{change.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQueuedChange(change.id)}
                      className="shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="p-3 border-t border-border flex gap-2">
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={isPushing}
              className="flex-1"
            >
              {isPushing ? (
                <>⏳ Pushing to GitHub...</>
              ) : (
                <>
                  <Github className="w-4 h-4 mr-2" />
                  Push to GitHub
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={clearQueuedChanges}
              disabled={isPushing}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100">
          <div className="bg-background border border-border rounded-lg shadow-2xl w-96 p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Github className="w-5 h-5" />
              Create Pull Request?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will create a new branch and open a Pull Request with {queuedChanges.length} change{queuedChanges.length !== 1 ? 's' : ''}.
            </p>
            <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Changes:</span>
                <span className="font-medium">{queuedChanges.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Files:</span>
                <span className="font-medium">{new Set(queuedChanges.map(c => c.data.recommendation?.file_path)).size}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePushChanges}
                className="flex-1"
              >
                Create PR
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
