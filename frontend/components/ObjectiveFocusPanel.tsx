'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { ChevronUp, ChevronDown, Settings2 } from 'lucide-react';

interface ObjectiveFocus {
  reasoning: number;      // 0-100: More reasoning depth vs speed
  accuracy: number;       // 0-100: Higher accuracy vs cost
  costOptimization: number; // 0-100: Lower cost vs performance
  speed: number;          // 0-100: Faster execution vs thoroughness
}

export function ObjectiveFocusPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [focus, setFocus] = useState<ObjectiveFocus>({
    reasoning: 50,
    accuracy: 50,
    costOptimization: 50,
    speed: 50,
  });

  const handleFocusChange = (key: keyof ObjectiveFocus, value: number) => {
    setFocus(prev => ({ ...prev, [key]: value }));
  };

  const getFocusMultiplier = () => {
    // Calculate cost multipliers based on focus settings
    // Higher reasoning/accuracy = higher cost
    // Higher cost optimization = lower cost but lower quality
    // Higher speed = lower cost but may reduce quality
    
    const reasoningFactor = 1 + (focus.reasoning - 50) / 100; // 0.5 to 1.5
    const accuracyFactor = 1 + (focus.accuracy - 50) / 100;   // 0.5 to 1.5
    const costFactor = 1 - (focus.costOptimization - 50) / 100; // 1.5 to 0.5
    const speedFactor = 1 - (focus.speed - 50) / 100;          // 1.5 to 0.5
    
    return {
      reasoning: reasoningFactor,
      accuracy: accuracyFactor,
      cost: costFactor,
      speed: speedFactor,
      overall: (reasoningFactor * accuracyFactor * costFactor * speedFactor) / 4,
    };
  };

  const multipliers = getFocusMultiplier();

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Collapsed State - Just an icon button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-background border-2 border-primary/30 rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:border-primary/50 hover:scale-105"
          title="Objective Focus Controls"
        >
          <Settings2 className="w-6 h-6 text-primary" />
        </button>
      )}

      {/* Expanded State - Full control panel */}
      {isExpanded && (
        <div className="bg-background border-2 border-primary/30 rounded-lg shadow-2xl w-80 overflow-hidden">
          {/* Header */}
          <div className="bg-primary/10 border-b border-primary/20 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              <h3 className="font-serif font-semibold text-sm">Objective Focus</h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-primary/20 rounded transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Controls */}
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {/* Reasoning Focus */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-serif font-medium text-foreground">
                  Reasoning Depth
                </label>
                <span className="text-xs font-mono text-muted-foreground">
                  {focus.reasoning}% • ×{multipliers.reasoning.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={focus.reasoning}
                onChange={(e) => handleFocusChange('reasoning', parseInt(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-reasoning"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Fast Response</span>
                <span>Deep Reasoning</span>
              </div>
            </div>

            {/* Accuracy Priority */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-serif font-medium text-foreground">
                  Accuracy Priority
                </label>
                <span className="text-xs font-mono text-muted-foreground">
                  {focus.accuracy}% • ×{multipliers.accuracy.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={focus.accuracy}
                onChange={(e) => handleFocusChange('accuracy', parseInt(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-accuracy"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Balanced</span>
                <span>Maximum Accuracy</span>
              </div>
            </div>

            {/* Cost Optimization */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-serif font-medium text-foreground">
                  Cost Optimization
                </label>
                <span className="text-xs font-mono text-muted-foreground">
                  {focus.costOptimization}% • ×{multipliers.cost.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={focus.costOptimization}
                onChange={(e) => handleFocusChange('costOptimization', parseInt(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-cost"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Performance First</span>
                <span>Minimize Cost</span>
              </div>
            </div>

            {/* Speed Priority */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-serif font-medium text-foreground">
                  Speed Priority
                </label>
                <span className="text-xs font-mono text-muted-foreground">
                  {focus.speed}% • ×{multipliers.speed.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={focus.speed}
                onChange={(e) => handleFocusChange('speed', parseInt(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-speed"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Thorough</span>
                <span>Maximum Speed</span>
              </div>
            </div>

            {/* Overall Impact */}
            <div className="pt-3 border-t border-border">
              <div className="text-xs font-serif font-semibold text-foreground mb-2">
                Overall Cost Impact
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-xs text-muted-foreground">System Multiplier:</span>
                <span className={`text-sm font-mono font-bold ${
                  multipliers.overall > 1 ? 'text-red-600' : 
                  multipliers.overall < 0.8 ? 'text-green-600' : 
                  'text-yellow-600'
                }`}>
                  ×{multipliers.overall.toFixed(3)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {multipliers.overall > 1.2 
                  ? 'High-quality configuration. Expect increased costs but better results.'
                  : multipliers.overall < 0.8
                  ? 'Cost-optimized configuration. Lower costs but may reduce quality.'
                  : 'Balanced configuration. Good compromise between cost and quality.'}
              </p>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => setFocus({
                reasoning: 50,
                accuracy: 50,
                costOptimization: 50,
                speed: 50,
              })}
              className="w-full py-2 text-xs font-serif border border-border rounded hover:bg-muted transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
