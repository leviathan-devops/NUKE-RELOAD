# KRAKEN-HIVE INTEGRATION PLAN
## Self-Contained Shared Subconscious for Kraken Agent Harness

**Version:** 1.0  
**Date:** 2026-04-08  
**Goal:** Hive Mind accessible ONLY to Kraken orchestrator, zero spillover to Shark/Manta agents

---

## 1. The Core Problem

### 1.1 Current Hive Mind Architecture
- **Global access:** Any agent can use `hive_context` and `hive_remember` tools
- **Shared namespace:** All plugins/data in `viking://resources/hive-mind/shared/`
- **Risk:** Context spillover to non-Kraken agents

### 1.2 Desired Architecture
```
┌─────────────────────────────────────────────────────────────────────────┐
│                         KRAKEN ORCHESTRATOR                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  KRAKEN-HIVE ENGINE (Full Access)                                │   │
│  │                                                                   │   │
│  │  • kraken_hive_search()    → Search ALL cluster memories        │   │
│  │  • kraken_hive_remember()  → Store decisions, patterns, learnings │   │
│  │  • kraken_hive_get_cluster() → Get specific cluster's context    │   │
│  │  • kraken_hive_inject()     → Inject relevant context into tasks  │   │
│  │                                                                   │   │
│  │  STORAGE: viking://resources/kraken-hive/                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ↑ Kraken sees ALL, processes ALL, coordinates ALL                       │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  SHARK/MANTA AGENTS (Zero Hive Access)                           │   │
│  │                                                                   │   │
│  │  • No hive_context tool                                          │   │
│  │  • No hive_remember tool                                         │   │
│  │  • Only cluster/task execution tools                             │   │
│  │  • Only see what Kraken injects into their task context         │   │
│  │                                                                   │   │
│  │  T2 Memory (later): Shark accesses via read_file() reference     │   │
│  │  to kraken-context library, NOT via direct Hive tools            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Design

### 2.1 Namespace Isolation

| Layer | Namespace | Access |
|-------|-----------|--------|
| **Kraken Hive** | `viking://resources/kraken-hive/` | ONLY Kraken orchestrator |
| **Cluster Memories** | `viking://resources/kraken-hive/clusters/{cluster-id}/` | Kraken only |
| **Session Memories** | `viking://resources/kraken-hive/sessions/{session-id}/` | Kraken only |
| **Pattern Library** | `viking://resources/kraken-hive/patterns/` | Kraken only |
| **Shared Context** | `viking://resources/kraken-hive/shared/` | Kraken only |

### 2.2 Tool Access Matrix

| Tool | kraken-architect | kraken-executor | shark-* | manta-* |
|------|------------------|-----------------|---------|---------|
| `kraken_hive_search` | ✅ | ✅ | ❌ | ❌ |
| `kraken_hive_remember` | ✅ | ✅ | ❌ | ❌ |
| `kraken_hive_get_cluster` | ✅ | ✅ | ❌ | ❌ |
| `kraken_hive_inject` | ✅ | ❌ | ❌ | ❌ |
| `spawn_cluster_task` | ✅ | ✅ | ❌ | ❌ |
| `spawn_shark_agent` | ✅ | ✅ | ❌ | ❌ |
| `spawn_manta_agent` | ✅ | ✅ | ❌ | ❌ |

### 2.3 How Agents Communicate WITHOUT Talking

```
┌─────────────────────────────────────────────────────────────────────┐
│                     KRAKEN COORDINATION FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

SHARK/MANTA AGENTS (no Hive access):
┌────────────────────────────────────────┐
│                                        │
│  1. Complete task                      │
│  2. Write results to cluster state     │
│  3. Report completion to Kraken        │
│                                        │
│  They don't know what others are doing │
│  They don't remember across sessions    │
│                                        │
└────────────────────────────────────────┘
                    ↓
                    (cluster-state-hook captures this)

KRAKEN ORCHESTRATOR (full Hive access):
┌────────────────────────────────────────┐
│                                        │
│  1. Reads cluster states               │
│  2. Stores summaries to kraken-hive     │
│  3. Searches hive for patterns        │
│  4. Assigns new tasks based on        │
│     accumulated context               │
│                                        │
│  Sees ALL, remembers ALL, coordinates  │
│                                        │
└────────────────────────────────────────┘
                    ↓
                    (kraken_hive_inject → task assignment)

AGENTS GET CONTEXT ONLY VIA TASK ASSIGNMENT:
┌────────────────────────────────────────┐
│                                        │
│  Task: "Build login API"               │
│  + Injected context from Hive:         │
│    "Previous similar task took 2hrs,   │
│     pattern X caused issue Y"           │
│                                        │
│  Agent sees ONLY this task context      │
│  No awareness of other agents/sessions │
│                                        │
└────────────────────────────────────────┘
```

---

## 3. Implementation Plan

### 3.1 Phase 1: Kraken-Hive Core (Week 1)

#### A. Create Kraken-Hive Engine Module

```typescript
// src/kraken-hive/index.ts

/**
 * Kraken-Hive: Self-contained Hive Mind for Kraken orchestrator only
 * 
 * All data isolated to viking://resources/kraken-hive/
 * No other agents have access - they can't even see the tools
 */

// Storage namespace - ONLY Kraken accesses this
const KRAKEN_HIVE_NAMESPACE = 'viking://resources/kraken-hive';

// Categories of memory
const MEMORY_CATEGORIES = {
  CLUSTER: 'clusters',      // viking://resources/kraken-hive/clusters/{id}/
  SESSION: 'sessions',      // viking://resources/kraken-hive/sessions/{id}/
  PATTERNS: 'patterns',      // viking://resources/kraken-hive/patterns/
  DECISIONS: 'decisions',    // viking://resources/kraken-hive/decisions/
  FAILURES: 'failures',      // viking://resources/kraken-hive/failures/
  BREAKTHROUGHS: 'breakthroughs',  // viking://resources/kraken-hive/breakthroughs/
};

export class KrakenHiveEngine {
  private ovClient: OpenVikingClient;
  
  constructor() {
    this.ovClient = createOVClient({
      namespace: KRAKEN_HIVE_NAMESPACE,
      // Explicitly NOT exposing these to other agents
    });
  }
  
  // Search across ALL Kraken memories
  async search(query: string, filters?: SearchFilters): Promise<HivememoryResult[]> {
    return this.ovClient.search(query, {
      namespace: KRAKEN_HIVE_NAMESPACE,
      ...filters,
    });
  }
  
  // Store cluster-specific memory
  async rememberCluster(clusterId: string, key: string, content: string): Promise<void> {
    const uri = `viking://resources/kraken-hive/clusters/${clusterId}/${key}.md`;
    await this.ovClient.store(uri, content);
  }
  
  // Store session memory
  async rememberSession(sessionId: string, key: string, content: string): Promise<void> {
    const uri = `viking://resources/kraken-hive/sessions/${sessionId}/${key}.md`;
    await this.ovClient.store(uri, content);
  }
  
  // Store pattern for future reuse
  async rememberPattern(pattern: Pattern): Promise<void> {
    const uri = `viking://resources/kraken-hive/patterns/${pattern.type}/${pattern.id}.md`;
    await this.ovClient.store(uri, pattern.toMarkdown());
  }
  
  // Get memories relevant to a specific task
  async getContextForTask(task: Task): Promise<InjectedContext> {
    const relevant = await this.search(task.description, { limit: 5 });
    return this.synthesizeContext(relevant);
  }
  
  // Inject context into task (called by Kraken before assignment)
  synthesizeContext(memories: HivememoryResult[]): InjectedContext {
    // Returns structured context to inject into task assignment
    return {
      patterns: memories.filter(m => m.type === 'pattern'),
      failures: memories.filter(m => m.type === 'failure'),
      previousWork: memories.filter(m => m.type === 'session'),
    };
  }
}
```

#### B. Register Kraken-Hive Tools (ONLY for kraken-* agents)

```typescript
// src/tools/kraken-hive-tools.ts

export const KRAKEN_HIVE_TOOLS = {
  kraken_hive_search: tool({
    description: 'Search the Kraken Hive Mind for relevant memories, patterns, and past decisions. Only accessible to Kraken orchestrator.',
    args: {
      query: z.string().describe('What to search for'),
      category: z.enum(['all', 'clusters', 'sessions', 'patterns', 'decisions']).default('all'),
      limit: z.number().default(5),
    },
    execute: async (args, ctx) => {
      // ONLY allow if agent is kraken-architect or kraken-executor
      if (!ctx.isKrakenAgent()) {
        return { error: 'Access denied - Kraken Hive is for Kraken orchestrator only' };
      }
      
      const results = await ctx.krakenHive.search(args.query, {
        category: args.category,
        limit: args.limit,
      });
      
      return formatResults(results);
    }
  }),
  
  kraken_hive_remember: tool({
    description: 'Store a memory, decision, or pattern to Kraken Hive Mind. Only accessible to Kraken orchestrator.',
    args: {
      key: z.string().describe('Short key for this memory'),
      content: z.string().describe('Full content to remember'),
      category: z.enum(['cluster', 'session', 'pattern', 'decision', 'failure', 'breakthrough']),
      targetId: z.string().optional().describe('Cluster or session ID if category requires it'),
    },
    execute: async (args, ctx) => {
      if (!ctx.isKrakenAgent()) {
        return { error: 'Access denied - Kraken Hive is for Kraken orchestrator only' };
      }
      
      switch (args.category) {
        case 'cluster':
          await ctx.krakenHive.rememberCluster(args.targetId!, args.key, args.content);
          break;
        case 'session':
          await ctx.krakenHive.rememberSession(args.targetId!, args.key, args.content);
          break;
        case 'pattern':
          await ctx.krakenHive.rememberPattern(parsePattern(args.key, args.content));
          break;
        default:
          await ctx.krakenHive.remember(args.category, args.key, args.content);
      }
      
      return { success: true, stored: args.key };
    }
  }),
  
  kraken_hive_get_cluster_context: tool({
    description: 'Get all memories related to a specific cluster. Only accessible to Kraken orchestrator.',
    args: {
      clusterId: z.string().describe('Cluster ID to get context for'),
    },
    execute: async (args, ctx) => {
      if (!ctx.isKrakenAgent()) {
        return { error: 'Access denied - Kraken Hive is for Kraken orchestrator only' };
      }
      
      const memories = await ctx.krakenHive.getClusterMemories(args.clusterId);
      return formatClusterContext(memories);
    }
  }),
  
  kraken_hive_inject_context: tool({
    description: 'Inject relevant Hive context into a task for an agent. Only accessible to Kraken architect.',
    args: {
      taskId: z.string().describe('Task to inject context into'),
      includePatterns: z.boolean().default(true),
      includeFailures: z.boolean().default(true),
      includePreviousWork: z.boolean().default(true),
    },
    execute: async (args, ctx) => {
      // ONLY kraken-architect can inject context
      if (ctx.agentName !== 'kraken-architect') {
        return { error: 'Only Kraken architect can inject context' };
      }
      
      const task = ctx.getTask(args.taskId);
      const context = await ctx.krakenHive.getContextForTask(task);
      
      // Inject into task context - agent will see this when assigned
      ctx.injectContextIntoTask(args.taskId, context);
      
      return { success: true, injected: context.summary };
    }
  }),
};
```

### 3.2 Phase 2: Cluster State Hook (Week 1-2)

#### Cluster State Hook - Captures Agent Activity WITHOUT Hive Access

```typescript
// src/hooks/cluster-state-hook.ts

/**
 * Cluster State Hook - Captures what agents do WITHOUT giving them Hive access
 * 
 * This hook runs for ALL agents (Shark/Manta) but ONLY extracts state info
 * It does NOT give them Hive access - it just tracks activity for Kraken
 */

export const clusterStateHook = safeHook(
  async (input, output, ctx) => {
    // Track activity for ALL agents (Shark, Manta, Kraken)
    const sessionState = ctx.getSessionState();
    
    // Initialize cluster state tracking
    if (!sessionState.clusterActivity) {
      sessionState.clusterActivity = new Map();
    }
    
    // Extract relevant activity
    const activity = extractActivity(input, output);
    
    if (activity) {
      // Store in SESSION STATE (not Hive - that's Kraken's job)
      const clusterId = activity.clusterId;
      const clusterActivity = sessionState.clusterActivity.get(clusterId) || {
        tasks: [],
        files: [],
        errors: [],
        completions: [],
      };
      
      clusterActivity.tasks.push(activity);
      sessionState.clusterActivity.set(clusterId, clusterActivity);
      
      // If this is Kraken agent, ALSO store to Hive
      if (ctx.isKrakenAgent()) {
        await ctx.krakenHive.rememberClusterActivity(clusterId, activity);
      }
    }
  },
  {
    // This hook runs for ALL agents - but extracts state, not granting access
    agentFilter: ['kraken-architect', 'kraken-executor', 'shark-*', 'manta-*'],
    pluginName: 'kraken-agent',
  }
);

function extractActivity(input, output): ClusterActivity | null {
  // Extract meaningful activity from tool calls
  if (input.tool === 'spawn_cluster_task') {
    return {
      type: 'task_queued',
      taskId: input.args.taskId,
      clusterId: input.args.clusterId,
      timestamp: Date.now(),
    };
  }
  
  if (output.success && input.tool === 'write_file') {
    return {
      type: 'file_written',
      file: input.args.path,
      clusterId: getCurrentCluster(input),
      timestamp: Date.now(),
    };
  }
  
  if (output.error) {
    return {
      type: 'error',
      error: output.error,
      clusterId: getCurrentCluster(input),
      timestamp: Date.now(),
    };
  }
  
  return null;
}
```

### 3.3 Phase 3: Shark T2 Memory Access (Week 2-3)

#### Shark T2 Library - Read-Only Hive Access via Reference

```typescript
// src/agents/sharks/kraken-context/T2_LIBRARY.md

# KRAKEN CONTEXT - T2 REFERENCE
## For Shark Agents (Read-Only Reference)

This is a READ-ONLY reference library. Sharks access this via `read_file` calls.
They do NOT have direct Hive tools - Kraken orchestrator controls what they see.

### How Sharks Get Context

1. Kraken assigns task WITH injected context
2. Context includes T2 references from Hive
3. Shark reads the T2 reference files
4. Shark never directly accesses Hive

### Available T2 References

- `T2_PATTERNS.md` - Common patterns discovered by Kraken
- `T2_FAILURE_MODES.md` - Known failure patterns to avoid  
- `T2_BUILD_CHAIN.md` - Successful build chains

### Rules

- Sharks can READ these files
- Sharks can NOT write to kraken-hive namespace
- Sharks can NOT call kraken_hive_* tools
- Context injection is Kraken's job only
```

#### Shark Tool - Read T2 Reference (NOT Hive Directly)

```typescript
// src/tools/shark-t2-tools.ts

// Sharks get these tools - NOT hive tools, just T2 reference tools

export const SHARK_T2_TOOLS = {
  read_kraken_context: tool({
    description: 'Read Kraken T2 context library for patterns and best practices. This is read-only reference, not Hive access.',
    args: {
      topic: z.enum(['patterns', 'failures', 'build-chain', 'architecture']).describe('Topic to get context for'),
    },
    execute: async (args, ctx) => {
      // Sharks can read T2 library
      const content = await ctx.readT2File(`T2_${args.topic.toUpperCase()}.md`);
      return content;
    }
  }),
  
  report_to_kraken: tool({
    description: 'Report completion or issue to Kraken orchestrator. This is how Sharks communicate - they write to Kraken, not to each other.',
    args: {
      taskId: z.string().describe('Task being reported on'),
      status: z.enum(['complete', 'blocked', 'error']).describe('Task status'),
      details: z.string().describe('Details of completion or issue'),
    },
    execute: async (args, ctx) => {
      // Sharks report to Kraken via this tool
      // Kraken processes the report and decides next steps
      await ctx.reportToKraken(args);
      return { success: true, reported: args.taskId };
    }
  }),
};
```

### 3.4 Phase 4: Kraken Coordination Loop (Week 3)

#### Kraken Orchestration Loop

```typescript
// src/orchestration/kraken-orchestration-loop.ts

/**
 * Kraken Orchestration Loop
 * 
 * This is how Kraken coordinates without agents talking to each other:
 * 
 * 1. Kraken ASSIGNs tasks (agents don't choose them)
 * 2. Agents EXECUTE and REPORT to Kraken
 * 3. Kraken STOREs to Hive (agents don't)
 * 4. Kraken SEARCHes Hive for next task context
 * 5. Repeat
 */

export class KrakenOrchestrationLoop {
  private hive: KrakenHiveEngine;
  private clusterManager: ClusterManager;
  
  async orchestrate(task: Task): Promise<void> {
    // Step 1: Get context from Hive
    const context = await this.hive.getContextForTask(task);
    
    // Step 2: Select cluster based on context
    const cluster = await this.selectCluster(task, context);
    
    // Step 3: Inject relevant context (only what agent needs)
    const injectedContext = this.hive.synthesizeContext(context, {
      taskType: task.type,
      clusterId: cluster.id,
    });
    
    // Step 4: Assign task WITH context
    await this.clusterManager.assignTask(cluster.id, {
      ...task,
      injectedContext,
    });
    
    // Step 5: Wait for completion
    const result = await this.waitForCompletion(task.id);
    
    // Step 6: Store result to Hive (agent doesn't access)
    await this.hive.rememberSession(
      result.sessionId,
      `task_${task.id}`,
      this.formatResult(result)
    );
    
    // Step 7: If breakthrough, store to patterns
    if (result.isBreakthrough) {
      await this.hive.rememberPattern({
        type: 'breakthrough',
        description: result.summary,
        taskId: task.id,
        clusterId: cluster.id,
      });
    }
  }
  
  private async selectCluster(task: Task, context: InjectedContext): Promise<ClusterConfig> {
    // Use Hive memories to select best cluster
    const clusterLoad = this.clusterManager.getAllClusterStatuses();
    const relevantPatterns = context.patterns;
    
    // Strategy: 
    // - Shark-heavy tasks → alpha cluster
    // - Manta precision tasks → gamma cluster
    // - Balanced → beta cluster
    
    if (task.type === 'steamroll') return this.clusterManager.getLeastLoaded('alpha');
    if (task.type === 'debug') return this.clusterManager.getLeastLoaded('gamma');
    return this.clusterManager.getLeastLoaded('beta');
  }
}
```

---

## 4. Directory Structure (Updated)

```
kraken-agent/
├── src/
│   ├── index.ts                      # Plugin entry - registers ONLY kraken-* agents
│   ├── kraken-hive/                  # NEW: Self-contained Hive engine
│   │   ├── index.ts                 # KrakenHiveEngine class
│   │   ├── client.ts                # OpenViking client (kraken-hive namespace only)
│   │   ├── types.ts                 # Hive memory types
│   │   └── storage.ts               # Local fallback storage
│   ├── tools/
│   │   ├── kraken-hive-tools.ts      # KRAKEN ONLY - hive search/remember/inject
│   │   ├── cluster-tools.ts         # spawn_cluster_task, etc.
│   │   └── shark-t2-tools.ts        # Shark read-only T2 reference tools
│   ├── hooks/
│   │   ├── cluster-state-hook.ts    # Track ALL agent activity
│   │   ├── kraken-only-hook.ts      # Enforce kraken-hive namespace isolation
│   │   └── context-injection-hook.ts # Inject Hive context into tasks
│   ├── orchestration/
│   │   ├── kraken-orchestration-loop.ts  # Main coordination loop
│   │   └── task-assigner.ts          # Assign tasks with context
│   ├── agents/
│   │   ├── kraken/
│   │   │   ├── architect.ts          # Has kraken_hive_* tools
│   │   │   └── executor.ts           # Has kraken_hive_* tools
│   │   └── sharks/
│   │       ├── shark-agent.ts        # NO hive tools, only T2 reference
│   │       └── manta-agent.ts        # NO hive tools, only T2 reference
│   └── factory/
│       └── (from v4.1 boilerplate)
├── kraken-context/                    # NEW: T2 reference library for Sharks
│   ├── T2_PATTERNS.md
│   ├── T2_FAILURE_MODES.md
│   ├── T2_BUILD_CHAIN.md
│   └── T2_ARCHITECTURE.md
└── tests/
    ├── kraken-hive-isolation.test.ts  # Verify no spillover
    ├── cluster-state-tracking.test.ts
    └── orchestration-loop.test.ts
```

---

## 5. Isolation Verification Tests

### Test 1: Verify Shark Has No Hive Tools

```typescript
test('Shark agent does NOT have kraken_hive_search tool', async () => {
  const sharkTools = getRegisteredTools('shark-alpha-1');
  expect(sharkTools).not.toContain('kraken_hive_search');
  expect(sharkTools).not.toContain('kraken_hive_remember');
  expect(sharkTools).not.toContain('kraken_hive_inject');
});

test('Shark agent does NOT have hive_context tool', async () => {
  const sharkTools = getRegisteredTools('shark-alpha-1');
  expect(sharkTools).not.toContain('hive_context');
  expect(sharkTools).not.toContain('hive_remember');
});
```

### Test 2: Verify Kraken Has Hive Tools

```typescript
test('Kraken architect HAS kraken_hive_* tools', async () => {
  const krakenTools = getRegisteredTools('kraken-architect');
  expect(krakenTools).toContain('kraken_hive_search');
  expect(krakenTools).toContain('kraken_hive_remember');
  expect(krakenTools).toContain('kraken_hive_inject');
});
```

### Test 3: Verify Hive Data in Separate Namespace

```typescript
test('Kraken Hive data stored in kraken-hive namespace', async () => {
  await kraken.hive.rememberCluster('alpha', 'test', 'content');
  
  // Verify NOT in hive-mind namespace
  const hiveMindData = await ovClient.get('viking://resources/hive-mind/...');
  expect(hiveMindData).toBeNull();
  
  // Verify IN kraken-hive namespace  
  const krakenHiveData = await ovClient.get('viking://resources/kraken-hive/clusters/alpha/test.md');
  expect(krakenHiveData).toEqual('content');
});
```

### Test 4: Verify Context Injection Only Happens via Kraken

```typescript
test('Shark cannot inject context - only receives it', async () => {
  // Attempt to call kraken_hive_inject from shark agent
  const result = await callTool('shark-alpha-1', 'kraken_hive_inject', {...});
  
  expect(result.error).toContain('Access denied');
  expect(result.error).toContain('Kraken orchestrator only');
});
```

---

## 6. T2 Memory for Sharks (Phase 2 Enhancement)

### How T2 Access Works

```
┌─────────────────────────────────────────────────────────────────────┐
│  KRAKEN MANAGES WHAT SHARKS SEE VIA T2                             │
└─────────────────────────────────────────────────────────────────────┘

SHARK requests context:
  "read_kraken_context topic=patterns"

         ↓
  Kraken T2 tool (shark-t2-tools.ts)
  
         ↓
  Reads from kraken-context/T2_*.md (NOT from Hive)
  
         ↓
  Shark sees ONLY what's in T2 library
  (Kraken curated this, filtered sensitive data)

SHARK reports breakthrough:
  "report_to_kraken taskId=X status=complete details=Y"

         ↓
  Kraken receives report
  Kraken decides IF/WHAT to store to Hive
  
         ↓
  Shark never writes to Hive directly
```

### T2 Library Structure

```markdown
# kraken-context/T2_PATTERNS.md

# Discovered Patterns
## Built by: Kraken Hive Engine
## Last Updated: 2026-04-08

### Pattern: API Error Handling
When building APIs, use this error handling pattern:
- Check input validity before processing
- Return structured errors with codes
- Log errors for Kraken monitoring

### Pattern: File Organization  
Projects should follow this structure:
- /src for source code
- /tests for tests
- /docs for documentation

---

# kraken-context/T2_FAILURE_MODES.md

# Known Failure Modes
## Source: Kraken Hive - failures/

### Failure: Circular Dependencies
Cause: Modules importing each other
Solution: Use dependency injection

### Failure: Type Errors in Production
Cause: Not running type check before deploy
Solution: Always run tsc before ship
```

---

## 7. Summary: Zero Spillover Guarantee

| Guarantee | Mechanism |
|-----------|-----------|
| **No Hive tools for non-Kraken** | Tool registration only for `kraken-*` agents |
| **Separate namespace** | All data in `viking://resources/kraken-hive/` |
| **No direct agent communication** | Agents report to Kraken, Kraken coordinates |
| **Context injection only via Kraken** | `kraken_hive_inject` only accessible to architect |
| **Sharks read T2, not Hive** | T2 library is curated subset, not direct Hive access |
| **Cluster state isolated** | Each cluster only sees its own state |
| **Session isolation** | Shark/Manta sessions don't share context |

### The Coordination Pattern

```
Agents don't talk to each other:
  Shark-1: Does work → Reports to Kraken → Done
  Shark-2: Does work → Reports to Kraken → Done
  
Kraken sees ALL:
  Kraken: Receives reports → Stores to Hive → Assigns next task
  
Next tasks get context:
  Kraken: Searches Hive → Injects context → Assigns task
  
Agents only know their task:
  Shark-3: Receives task WITH context → Executes → Reports to Kraken
```

---

## 8. Files to Create/Modify

### New Files (Priority Order)

| File | Purpose | Phase |
|------|---------|-------|
| `src/kraken-hive/index.ts` | Core Hive engine | 1 |
| `src/kraken-hive/client.ts` | OV client wrapper | 1 |
| `src/kraken-hive/types.ts` | Memory types | 1 |
| `src/tools/kraken-hive-tools.ts` | Hive tools (kraken only) | 1 |
| `src/tools/shark-t2-tools.ts` | T2 tools (sharks) | 2 |
| `src/hooks/cluster-state-hook.ts` | Activity tracking | 1 |
| `src/hooks/kraken-only-hook.ts` | Namespace isolation | 1 |
| `src/hooks/context-injection-hook.ts` | Context injection | 2 |
| `src/orchestration/kraken-orchestration-loop.ts` | Main loop | 3 |
| `src/orchestration/task-assigner.ts` | Task assignment | 3 |
| `kraken-context/T2_*.md` | T2 reference library | 2 |
| `tests/kraken-hive-isolation.test.ts` | Isolation tests | 1 |

### Modified Files

| File | Change |
|------|--------|
| `src/index.ts` | Register kraken-hive-tools ONLY for kraken agents |
| `src/factory/types.ts` | Add KrakenHiveEngine type |
| `build-spec.md` | Add this plan as Section 8 |

---

*Plan v1.0 — Kraken-Hive Integration*
*For: Self-contained subconscious accessible only to Kraken orchestrator*
