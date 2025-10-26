# Implementation Roadmap - Phase 3 & 4

## Phase 3: Enhanced GitHub Data Integration

### Goal
Fetch comprehensive agent and tool data directly from GitHub repositories to provide researchers with deeper insights into implementation details, dependencies, and usage patterns.

### Backend Changes Required

#### 1. Update `backend/services/github_scraper.py`

**Current State**: Basic repo file scanning  
**Target State**: Full file content fetching with metadata

```python
# New functions to add:

async def fetch_file_content(repo_url: str, file_path: str, branch: str = "main") -> dict:
    """
    Fetch complete file content from GitHub
    Returns: {
        'content': str,
        'size': int,
        'sha': str,
        'url': str,
        'language': str
    }
    """
    pass

async def extract_dependencies(file_content: str, language: str) -> list:
    """
    Parse imports and dependencies from code
    Python: import statements, from X import Y
    JavaScript: require(), import statements
    Returns list of dependency names
    """
    pass

async def extract_docstrings(file_content: str, language: str) -> dict:
    """
    Extract documentation from code
    Python: docstrings
    JavaScript: JSDoc comments
    Returns structured documentation
    """
    pass

async def analyze_usage_patterns(repo_url: str, file_path: str) -> dict:
    """
    Search repo for usages of functions/classes from file
    Returns: {
        'used_by': [list of files],
        'call_count': int,
        'example_usages': [code snippets]
    }
    """
    pass
```

#### 2. Update `backend/services/agent_parser.py`

**Enhance `AgentParser` class**:

```python
class AgentParser:
    def __init__(self, github_scraper):
        self.github_scraper = github_scraper
        self.cache_manager = CacheManager()
    
    async def parse_agent_enhanced(self, agent_file_path: str) -> dict:
        """
        Parse agent with full GitHub data
        """
        # Fetch full file content
        content = await self.github_scraper.fetch_file_content(agent_file_path)
        
        # Extract metadata
        dependencies = await self.github_scraper.extract_dependencies(content)
        documentation = await self.github_scraper.extract_docstrings(content)
        usage = await self.github_scraper.analyze_usage_patterns(agent_file_path)
        
        return {
            'id': generate_id(agent_file_path),
            'name': extract_name(content),
            'type': detect_type(content),
            'full_code': content['content'],
            'code_snippet': truncate_code(content['content'], max_lines=50),
            'dependencies': dependencies,
            'documentation': documentation,
            'usage_patterns': usage,
            'file_metadata': {
                'size': content['size'],
                'sha': content['sha'],
                'language': content['language']
            },
            # ... existing fields
        }
```

#### 3. Add Caching Layer

**File**: `backend/services/cache_manager.py` (update existing)

```python
class CacheManager:
    def cache_github_content(self, file_path: str, content: dict, ttl: int = 3600):
        """Cache GitHub API responses to avoid rate limiting"""
        cache_key = f"github:content:{file_path}"
        self.cache.set(cache_key, content, ttl)
    
    def get_cached_github_content(self, file_path: str) -> Optional[dict]:
        """Retrieve cached GitHub content"""
        cache_key = f"github:content:{file_path}"
        return self.cache.get(cache_key)
```

### Frontend Changes Required

#### 4. Update Type Definitions

**File**: `frontend/types/index.ts`

```typescript
export interface Agent {
  // ... existing fields
  
  // New fields from enhanced parsing
  full_code?: string;
  dependencies?: string[];
  documentation?: {
    description: string;
    parameters?: Array<{ name: string; type: string; description: string }>;
    returns?: string;
    examples?: string[];
  };
  usage_patterns?: {
    used_by: string[];
    call_count: number;
    example_usages: string[];
  };
  file_metadata?: {
    size: number;
    sha: string;
    language: string;
  };
}
```

#### 5. Enhance DetailsPanel

**File**: `frontend/components/DetailsPanel.tsx`

Add new sections to `AgentDetails`:

```tsx
{/* Dependencies Section */}
{agent.dependencies && agent.dependencies.length > 0 && (
  <div>
    <label className="text-sm font-serif font-semibold text-foreground block mb-3">
      Dependencies ({agent.dependencies.length})
    </label>
    <div className="flex flex-wrap gap-2">
      {agent.dependencies.map((dep, i) => (
        <span key={i} className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-xs font-mono">
          {dep}
        </span>
      ))}
    </div>
  </div>
)}

{/* Documentation Section */}
{agent.documentation && (
  <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5">
    <h5 className="font-serif font-semibold text-sm text-purple-700 dark:text-purple-300 mb-3">
      Documentation
    </h5>
    <div className="space-y-3 text-sm">
      <p className="leading-relaxed">{agent.documentation.description}</p>
      {agent.documentation.examples && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-2">Examples:</label>
          {agent.documentation.examples.map((example, i) => (
            <pre key={i} className="text-xs font-mono bg-background/80 p-2 rounded mb-2">
              {example}
            </pre>
          ))}
        </div>
      )}
    </div>
  </div>
)}

{/* Usage Patterns Section */}
{agent.usage_patterns && (
  <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-500/5">
    <h5 className="font-serif font-semibold text-sm text-orange-700 dark:text-orange-300 mb-3">
      Usage Patterns
    </h5>
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">Used by {agent.usage_patterns.used_by.length} files</span>
        <span className="text-xs font-mono">{agent.usage_patterns.call_count} calls</span>
      </div>
      {agent.usage_patterns.example_usages.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-2">Example Usage:</label>
          <pre className="text-xs font-mono bg-background/80 p-2 rounded max-h-32 overflow-y-auto">
            {agent.usage_patterns.example_usages[0]}
          </pre>
        </div>
      )}
    </div>
  </div>
)}
```

### API Changes

#### 6. Update Backend Endpoint

**File**: `backend/app.py`

```python
@app.route('/api/parse-agents', methods=['POST'])
async def parse_agents_enhanced():
    data = request.get_json()
    repo_url = data.get('repo_url')
    
    # Use enhanced parser
    parser = AgentParser(github_scraper)
    agents = await parser.parse_repository_enhanced(repo_url)
    
    return jsonify({
        'agents': agents,
        'tools': tools,
        'relationships': relationships,
        'metadata': {
            'enhanced': True,
            'fetched_at': datetime.utcnow().isoformat()
        }
    })
```

### Testing Plan

1. **Unit Tests**:
   - Test GitHub content fetching
   - Test dependency extraction
   - Test docstring parsing

2. **Integration Tests**:
   - Test full agent parsing pipeline
   - Test caching behavior
   - Test rate limit handling

3. **E2E Tests**:
   - Parse sample repository
   - Verify enhanced data in UI
   - Check performance impact

---

## Phase 4: Dynamic Cost Adjustment

### Goal
Make costs reactive to Objective Focus sliders, allowing researchers to experiment with different optimization strategies and see real-time cost impacts.

### State Management

#### 1. Add to Zustand Store

**File**: `frontend/lib/store.ts`

```typescript
interface ObjectiveFocus {
  reasoning: number;      // 0-100
  accuracy: number;       // 0-100
  costOptimization: number; // 0-100
  speed: number;          // 0-100
}

interface Store {
  // ... existing state
  
  objectiveFocus: ObjectiveFocus;
  setObjectiveFocus: (focus: Partial<ObjectiveFocus>) => void;
  getMultipliers: () => {
    reasoning: number;
    accuracy: number;
    cost: number;
    speed: number;
    overall: number;
  };
}

// Implementation
setObjectiveFocus: (focus) => {
  set((state) => ({
    objectiveFocus: { ...state.objectiveFocus, ...focus }
  }));
},

getMultipliers: () => {
  const focus = get().objectiveFocus;
  const reasoningFactor = 1 + (focus.reasoning - 50) / 100;
  const accuracyFactor = 1 + (focus.accuracy - 50) / 100;
  const costFactor = 1 - (focus.costOptimization - 50) / 100;
  const speedFactor = 1 - (focus.speed - 50) / 100;
  
  return {
    reasoning: reasoningFactor,
    accuracy: accuracyFactor,
    cost: costFactor,
    speed: speedFactor,
    overall: (reasoningFactor * accuracyFactor * costFactor * speedFactor) / 4,
  };
},
```

#### 2. Update ObjectiveFocusPanel

**File**: `frontend/components/ObjectiveFocusPanel.tsx`

```typescript
export function ObjectiveFocusPanel() {
  const { objectiveFocus, setObjectiveFocus } = useStore();
  
  const handleFocusChange = (key: keyof ObjectiveFocus, value: number) => {
    setObjectiveFocus({ [key]: value });
  };
  
  // Use store state instead of local state
  const multipliers = useStore.getState().getMultipliers();
  
  // ... rest of component
}
```

#### 3. Update Cost Calculator

**File**: `frontend/lib/costCalculator.ts`

```typescript
/**
 * Apply objective focus multipliers to base cost
 */
export function applyFocusMultipliers(
  baseCost: CostEstimate,
  multipliers: { overall: number }
): CostEstimate {
  return {
    ...baseCost,
    totalCost: baseCost.totalCost * multipliers.overall,
    inputTokens: Math.round(baseCost.inputTokens * multipliers.overall),
    outputTokens: Math.round(baseCost.outputTokens * multipliers.overall),
  };
}

/**
 * Calculate agent cost with focus applied
 */
export function calculateAgentCostWithFocus(
  agent: any,
  multipliers?: { overall: number }
): CostEstimate {
  const baseCost = calculateAgentCost(agent);
  
  if (!multipliers) return baseCost;
  
  return applyFocusMultipliers(baseCost, multipliers);
}

// Similar for calculateToolCostWithFocus, calculateConnectionCostWithFocus
```

#### 4. Update Canvas to Use Dynamic Costs

**File**: `frontend/components/Canvas.tsx`

```typescript
export function Canvas() {
  const { objectiveFocus } = useStore();
  const multipliers = useStore.getState().getMultipliers();
  
  // Subscribe to focus changes
  useEffect(() => {
    // Costs will automatically update when multipliers change
    // because components recalculate on render
  }, [objectiveFocus]);
  
  // ... rest of component
}

// In AgentNode component:
function AgentNode({ data }: { data: Agent }) {
  const multipliers = useStore.getState().getMultipliers();
  const cost = calculateAgentCostWithFocus(data, multipliers);
  
  // ... render with adjusted cost
}

// In ToolNode component:
function ToolNode({ data }: { data: Tool }) {
  const multipliers = useStore.getState().getMultipliers();
  const cost = calculateToolCostWithFocus(data, multipliers);
  
  // ... render with adjusted cost
}
```

#### 5. Add Visual Feedback

**Enhancement**: Highlight nodes when costs change significantly

```typescript
function AgentNode({ data }: { data: Agent }) {
  const multipliers = useStore.getState().getMultipliers();
  const [prevMultiplier, setPrevMultiplier] = useState(multipliers.overall);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (Math.abs(multipliers.overall - prevMultiplier) > 0.1) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }
    setPrevMultiplier(multipliers.overall);
  }, [multipliers.overall]);
  
  return (
    <div className={`transition-all ${isAnimating ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}>
      {/* ... node content */}
    </div>
  );
}
```

### Performance Optimization

#### 6. Debounce Slider Updates

**File**: `frontend/components/ObjectiveFocusPanel.tsx`

```typescript
import { useDebouncedCallback } from 'use-debounce';

export function ObjectiveFocusPanel() {
  const { setObjectiveFocus } = useStore();
  const [localFocus, setLocalFocus] = useState(objectiveFocus);
  
  // Debounce store updates (300ms delay)
  const debouncedUpdate = useDebouncedCallback(
    (focus: ObjectiveFocus) => {
      setObjectiveFocus(focus);
    },
    300
  );
  
  const handleFocusChange = (key: keyof ObjectiveFocus, value: number) => {
    const newFocus = { ...localFocus, [key]: value };
    setLocalFocus(newFocus);
    debouncedUpdate(newFocus);
  };
  
  // ... rest
}
```

#### 7. Memoize Cost Calculations

```typescript
const AgentNode = memo(function AgentNode({ data }: { data: Agent }) {
  const multipliers = useStore.getState().getMultipliers();
  
  const cost = useMemo(
    () => calculateAgentCostWithFocus(data, multipliers),
    [data.id, multipliers.overall] // Only recalc when these change
  );
  
  // ... render
});
```

### User Experience Enhancements

#### 8. Add Before/After Comparison

**New Component**: `frontend/components/CostComparisonModal.tsx`

```typescript
export function CostComparisonModal() {
  const { objectiveFocus, agentData } = useStore();
  const baselineMultipliers = { overall: 1.0 };
  const currentMultipliers = useStore.getState().getMultipliers();
  
  // Calculate baseline vs current costs
  const baselineCost = calculateSystemCost(agentData, baselineMultipliers);
  const currentCost = calculateSystemCost(agentData, currentMultipliers);
  
  return (
    <div className="p-6">
      <h3 className="font-serif font-bold text-xl mb-4">Cost Impact Analysis</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-muted rounded">
          <h4 className="font-semibold mb-2">Baseline (50/50/50/50)</h4>
          <div className="text-2xl font-bold">{formatCost(baselineCost.totalDaily)}/day</div>
          <div className="text-sm text-muted-foreground">{formatCost(baselineCost.totalMonthly)}/month</div>
        </div>
        
        <div className="p-4 bg-primary/10 rounded">
          <h4 className="font-semibold mb-2">Current Configuration</h4>
          <div className="text-2xl font-bold">{formatCost(currentCost.totalDaily)}/day</div>
          <div className="text-sm text-muted-foreground">{formatCost(currentCost.totalMonthly)}/month</div>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-yellow-500/10 rounded">
        <div className="flex justify-between items-center">
          <span>Difference:</span>
          <span className={`text-xl font-bold ${
            currentCost.totalDaily > baselineCost.totalDaily ? 'text-red-600' : 'text-green-600'
          }`}>
            {currentCost.totalDaily > baselineCost.totalDaily ? '+' : ''}
            {formatCost(currentCost.totalDaily - baselineCost.totalDaily)}/day
          </span>
        </div>
      </div>
    </div>
  );
}
```

### Testing Plan

1. **Slider Interaction**:
   - Verify immediate UI feedback
   - Check debounced store updates
   - Test multiplier calculations

2. **Cost Updates**:
   - Verify all nodes update costs
   - Check Details Panel updates
   - Test edge label updates

3. **Performance**:
   - Measure render time with 50+ nodes
   - Test slider responsiveness
   - Verify no memory leaks

4. **Visual Feedback**:
   - Test animation triggers
   - Verify color changes
   - Check comparison modal

### Dependencies to Install

```bash
npm install use-debounce
```

---

## Timeline Estimate

### Phase 3: Enhanced GitHub Data (2-3 days)
- Day 1: Backend GitHub scraper enhancements
- Day 2: Frontend type updates and UI
- Day 3: Testing and refinement

### Phase 4: Dynamic Cost Adjustment (2-3 days)
- Day 1: Store management and cost calculator updates
- Day 2: Canvas integration and visual feedback
- Day 3: Performance optimization and testing

**Total**: 4-6 days for both phases

---

## Success Criteria

### Phase 3
- ✅ Full file content fetched from GitHub
- ✅ Dependencies extracted and displayed
- ✅ Documentation parsed and shown
- ✅ Usage patterns analyzed
- ✅ Caching prevents rate limiting

### Phase 4
- ✅ Sliders update costs in real-time
- ✅ Visual feedback on cost changes
- ✅ Performance remains smooth (< 100ms updates)
- ✅ Comparison modal shows impact
- ✅ Debouncing prevents lag

---

## Risk Mitigation

1. **GitHub API Rate Limits**:
   - Solution: Aggressive caching
   - Fallback: Use cached data if rate limited

2. **Performance with Many Nodes**:
   - Solution: Memoization and debouncing
   - Fallback: Limit real-time updates to visible nodes

3. **Complex Cost Calculations**:
   - Solution: Web Workers for heavy computation
   - Fallback: Simplify calculation model

---

**Ready for Implementation**: Yes  
**Blocked By**: None  
**Next Action**: Begin Phase 3 backend work
