'use client';

import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface Step {
  step: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message: string;
}

interface ProgressStepsProps {
  steps: Step[];
}

export function ProgressSteps({ steps }: ProgressStepsProps) {
  return (
    <div className="space-y-3 py-4">
      {steps.map((step, index) => (
        <div key={step.step} className="relative">
          {/* Connection line */}
          {index < steps.length - 1 && (
            <div
              className={`absolute left-[15px] top-8 w-0.5 h-8 ${
                step.status === 'completed'
                  ? 'bg-green-500'
                  : 'bg-border'
              }`}
            />
          )}
          
          {/* Step content */}
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {step.status === 'completed' ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : step.status === 'in_progress' ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : step.status === 'error' ? (
                <Circle className="w-8 h-8 text-red-500" />
              ) : (
                <Circle className="w-8 h-8 text-muted-foreground/30" />
              )}
            </div>
            
            {/* Text content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={`font-medium ${
                  step.status === 'completed'
                    ? 'text-green-700 dark:text-green-300'
                    : step.status === 'in_progress'
                    ? 'text-primary'
                    : step.status === 'error'
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-muted-foreground'
                }`}>
                  {step.name}
                </h4>
                {step.status === 'in_progress' && (
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </span>
                )}
              </div>
              <p className={`text-sm mt-1 ${
                step.status === 'completed'
                  ? 'text-green-600 dark:text-green-400'
                  : step.status === 'error'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-muted-foreground'
              }`}>
                {step.message}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
