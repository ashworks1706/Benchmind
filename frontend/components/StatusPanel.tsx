'use client';

import { useStore } from '@/lib/store';
import { ScrollArea } from './ui/ScrollArea';
import { ProgressSteps } from './ProgressSteps';
import { Loader2 } from 'lucide-react';

export function StatusPanel() {
  const {
    statusMessages,
    isLoading,
    analysisSteps,
  } = useStore();

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold">Status & Progress</h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        {/* Show analysis progress if in progress */}
        {isLoading && analysisSteps.length > 0 && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analysis Progress
            </h4>
            <ProgressSteps steps={analysisSteps} />
          </div>
        )}
        
        <div className="space-y-3">
          {statusMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No messages yet. Submit a GitHub repository to get started.
            </p>
          ) : (
            statusMessages.map((msg) => (
              <StatusMessage key={msg.id} message={msg} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function StatusMessage({ message }: { message: any }) {
  const typeColors = {
    info: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500',
    success: 'bg-green-500/10 text-green-700 dark:text-green-300 border-l-4 border-green-500',
    error: 'bg-red-500/10 text-red-700 dark:text-red-300 border-l-4 border-red-500',
    progress: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-l-4 border-purple-500',
  };

  const typeIcons = {
    info: '💡',
    success: '✓',
    error: '✗',
    progress: '⟳',
  };

  return (
    <div
      className={`p-3 rounded-md text-sm animate-in slide-in-from-right-5 ${typeColors[message.type as keyof typeof typeColors]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <span className="text-base">{typeIcons[message.type as keyof typeof typeIcons]}</span>
          <p className="flex-1 leading-relaxed">{message.message}</p>
        </div>
        <span className="text-xs opacity-70 whitespace-nowrap">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
