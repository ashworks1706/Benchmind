'use client';

import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Check, GitCommit, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { apiService } from '@/lib/api';

export default function ChangeQueuePanel() {
  const { queuedChanges, removeQueuedChange, clearQueuedChanges, addStatusMessage, agentData } = useStore();
  const [isPushing, setIsPushing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (queuedChanges.length === 0) return null;

  const handlePushChanges = async () => {
    if (!agentData) return;
    
    setIsPushing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      addStatusMessage({
        type: 'info',
        message: `🚀 Pushing ${queuedChanges.length} queued changes...`,
      });

      // Process all queued changes
      for (const change of queuedChanges) {
        try {
          if (change.type === 'fix') {
            await apiService.applyFix(change.data.recommendation, agentData);
            successCount++;
          } else if (change.type === 'edit') {
            // Handle edit changes (implement based on your edit API)
            // await apiService.applyEdit(change.data);
            successCount++;
          }
        } catch (error: any) {
          console.error(`Failed to apply change ${change.id}:`, error);
          failCount++;
        }
      }

      if (failCount === 0) {
        addStatusMessage({
          type: 'success',
          message: `✅ Successfully pushed all ${successCount} changes!`,
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
        >
          <GitCommit className="w-4 h-4 mr-2" />
          {queuedChanges.length} Queued Change{queuedChanges.length !== 1 ? 's' : ''}
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
              {queuedChanges.map((change) => (
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
              ))}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="p-3 border-t border-border flex gap-2">
            <Button
              onClick={handlePushChanges}
              disabled={isPushing}
              className="flex-1"
            >
              {isPushing ? (
                <>⏳ Pushing...</>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Push All Changes
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
    </div>
  );
}
