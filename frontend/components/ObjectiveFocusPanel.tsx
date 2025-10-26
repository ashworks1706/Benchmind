'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { ChevronUp, ChevronDown, Settings2 } from 'lucide-react';

export function ObjectiveFocusPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { objectiveFocus, setObjectiveFocus } = useStore();

  const handleFocusChange = (key: keyof typeof objectiveFocus, value: number) => {
    setObjectiveFocus({ [key]: value });
  };

  const getFocusMultiplier = () => {
    // Calculate cost multipliers based on focus settings
    // Higher reasoning/accuracy = higher cost
    // Higher cost optimization = lower cost but lower quality
    // Higher speed = lower cost but may reduce quality
    
    const reasoningFactor = 1 + (objectiveFocus.reasoning - 50) / 100; // 0.5 to 1.5
    const accuracyFactor = 1 + (objectiveFocus.accuracy - 50) / 100;   // 0.5 to 1.5
    const costFactor = 1 - (objectiveFocus.costOptimization - 50) / 100; // 1.5 to 0.5
    const speedFactor = 1 - (objectiveFocus.speed - 50) / 100;          // 1.5 to 0.5
    
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
                  {objectiveFocus.reasoning}% • ×{multipliers.reasoning.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={objectiveFocus.reasoning}
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
                  {objectiveFocus.accuracy}% • ×{multipliers.accuracy.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={objectiveFocus.accuracy}
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
                  {objectiveFocus.costOptimization}% • ×{multipliers.cost.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={objectiveFocus.costOptimization}
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
                  {objectiveFocus.speed}% • ×{multipliers.speed.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={objectiveFocus.speed}
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
              <div className="flex items-center justify-between p-2 bg-muted rounded mb-2">
                <span className="text-xs text-muted-foreground">System Multiplier:</span>
                <span className={`text-sm font-mono font-bold ${
                  multipliers.overall > 1 ? 'text-red-600' : 
                  multipliers.overall < 0.8 ? 'text-green-600' : 
                  'text-yellow-600'
                }`}>
                  ×{multipliers.overall.toFixed(3)}
                </span>
              </div>
              
              {/* Visual Effects Summary */}
              <div className="space-y-1 mb-2 p-2 bg-primary/5 rounded border border-primary/20">
                <div className="text-xs font-serif font-semibold text-primary mb-1">
                  Canvas Visual Effects
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                  <div>Node Size: {((0.85 + (objectiveFocus.reasoning / 200)) * 100).toFixed(0)}%</div>
                  <div>Color: {((0.6 + (objectiveFocus.accuracy / 250)) * 100).toFixed(0)}%</div>
                  <div>Opacity: {((1.0 - (objectiveFocus.costOptimization / 500)) * 100).toFixed(0)}%</div>
                  <div>Animation: {(1.2 - (objectiveFocus.speed / 200)).toFixed(2)}s</div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {multipliers.overall > 1.2 
                  ? '🔥 High-quality configuration. Nodes are larger and more vibrant. Expect increased costs but better results.'
                  : multipliers.overall < 0.8
                  ? '⚡ Cost-optimized configuration. Nodes are smaller and lighter. Lower costs but may reduce quality.'
                  : '⚖️ Balanced configuration. Good compromise between cost and quality.'}
              </p>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => setObjectiveFocus({
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
