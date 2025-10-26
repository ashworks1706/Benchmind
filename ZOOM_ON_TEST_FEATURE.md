# Auto-Zoom on Test Execution Feature

## Overview
Added automatic camera zoom functionality that focuses on currently highlighted test elements during test execution.

## Implementation Details

### New Function: `zoomToTestElements`
**Location**: `frontend/components/Canvas.tsx` (lines ~255-303)

**Purpose**: Automatically zooms and centers the canvas view on the currently running test and all its connected agents/tools.

**Features**:
- Calculates bounding box around highlighted test elements
- Extra padding (120px) for better focus
- Slightly higher zoom range (0.5 to 1.2) compared to auto-fit (0.3 to 1.0)
- Smooth transition with cubic-bezier easing

**Triggers**:
1. When `isTestingInProgress` becomes true
2. When `currentRunningTestId` changes (next test in sequence)
3. When `highlightedElements` set updates

### How It Works

1. **Detects active test execution**:
   - Monitors `isTestingInProgress` state
   - Tracks `currentRunningTestId` for current test
   - Watches `highlightedElements` for connected nodes

2. **Calculates focus region**:
   ```typescript
   const highlightedNodes = nodes.filter(node => {
     if (node.type === 'test') {
       return currentRunningTestId && (node.data as TestCase).id === currentRunningTestId;
     } else {
       return highlightedElements.has(node.id) || highlightedElements.has(node.data.id);
     }
   });
   ```

3. **Computes optimal zoom**:
   - Bounding box: min/max X/Y of all highlighted nodes
   - Scale calculation: fits content within viewport with padding
   - Zoom range: 0.5x to 1.2x (allows slight zoom in for focus)

4. **Smooth transition**:
   - **During testing**: 0.6s cubic-bezier(0.4, 0.0, 0.2, 1) - smooth, cinematic
   - **Manual controls**: 0.1s ease-out - quick response
   - **While dragging**: No transition - instant feedback

### useEffect Hook
**Location**: Lines ~305-315

```typescript
useEffect(() => {
  if (isTestingInProgress && nodes.length > 0) {
    const timer = setTimeout(() => {
      zoomToTestElements();
    }, 300); // Delay for smoother transition
    return () => clearTimeout(timer);
  }
}, [isTestingInProgress, currentRunningTestId, highlightedElements.size, nodes.length, zoomToTestElements]);
```

**Why 300ms delay?**
- Allows highlight updates to complete before zooming
- Creates smoother visual experience
- Prevents jarring transitions during state updates

### CSS Transition Enhancement
**Location**: Lines ~1097-1106

```typescript
transition: isDragging 
  ? 'none' 
  : isTestingInProgress 
    ? 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)' // Smooth zoom during testing
    : 'transform 0.1s ease-out', // Quick zoom for manual controls
```

**Transition Modes**:
1. **Dragging**: No transition (instant feedback)
2. **Testing**: 0.6s cubic-bezier (smooth, cinematic zoom)
3. **Manual**: 0.1s ease-out (quick response)

## User Experience

### Before
- Test execution would highlight nodes
- No camera movement
- User had to manually pan/zoom to see test progress
- Easy to lose track of which test is running

### After
- **Automatic focus** on current test
- **Smooth camera movement** to highlighted region
- **Dynamic tracking** as tests progress through sequence
- **Better visibility** of test targets and connections
- **Cinematic feel** with 0.6s smooth transitions

## Visual Behavior

1. **Test starts**: Camera smoothly zooms to test node + connected elements
2. **Test progresses**: View stays focused on highlighted region
3. **Next test**: Camera transitions to new test's region
4. **Test completes**: View remains on last test (no jarring reset)
5. **Manual interaction**: User can still pan/zoom freely (transitions become quick)

## Configuration

### Zoom Parameters (Adjustable)
```typescript
const padding = 120; // Extra padding for test focus
let scale = Math.max(0.5, Math.min(scale, 1.2)); // Zoom range
```

### Timing Parameters (Adjustable)
```typescript
setTimeout(() => zoomToTestElements(), 300); // Delay before zoom
transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)' // Animation duration
```

## Testing

### To Test:
1. Navigate to http://localhost:3000
2. Load a project with agents/tools
3. Create or run test cases
4. Observe:
   - ✅ Camera automatically zooms to running test
   - ✅ Smooth 0.6s transition animation
   - ✅ All connected nodes visible in viewport
   - ✅ Proper padding around focused region
   - ✅ Transitions between tests are smooth
   - ✅ Manual pan/zoom still works

### Edge Cases Handled:
- ❌ No highlighted nodes → No zoom (silent fail)
- ❌ Testing not in progress → No zoom
- ❌ No nodes on canvas → No zoom
- ✅ Multiple tests → Zooms to each sequentially
- ✅ User interrupts → Manual control takes over

## Performance

### Optimizations:
1. **useMemo** for node filtering (prevents recalculation)
2. **useCallback** for zoom function (stable reference)
3. **setTimeout** to batch updates (prevents rapid re-renders)
4. **Conditional transitions** (no animation while dragging)

### Dependencies:
```typescript
[nodes, isTestingInProgress, currentRunningTestId, highlightedElements]
```

## Future Enhancements

### Potential Improvements:
1. **Zoom level presets**: Save/restore user's preferred zoom
2. **Follow mode**: Option to disable auto-zoom during tests
3. **Zoom speed control**: User-adjustable transition duration
4. **Smart framing**: Predict next test and pre-position camera
5. **Mini-map**: Overview with current viewport indicator
6. **Keyboard shortcuts**: Space to reset view, 'F' to focus current test

## Related Files

- `frontend/components/Canvas.tsx` - Main implementation
- `frontend/lib/store.ts` - Test execution state management
- `frontend/components/TestingPanel.tsx` - Test runner controls

## Dependencies

- React hooks: `useState`, `useCallback`, `useEffect`, `useMemo`
- Store state: `isTestingInProgress`, `currentRunningTestId`, `highlightedElements`
- Canvas state: `nodes`, `transform`, `isDragging`

---

**Status**: ✅ Implemented and ready for testing
**Version**: 1.0.0
**Date**: October 26, 2025
