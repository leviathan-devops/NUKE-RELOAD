# KRAKEN AGENT HARNESS — BUILD SPEC
## OpenCode Plugin v1.0 using v4.1 Boilerplate

**Version:** 1.0  
**Date:** 2026-04-08  
**Target:** 3 Concurrent Async Clusters with Centralized Macro Orchestration

---

## 1. Overview

### 1.1 What We Are Building

**Kraken** is a self-contained orchestrator agent swarm plugin for OpenCode. It uses the **triple-brain architecture** (from Shark Macro) but reconfigured as an **orchestrator** that operates through "hands" — sub-agents (Sharks and Mantas) called **as tools**.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          KRAKEN ORCHESTRATOR                             │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    TRIPLE-BRAIN ORCHESTRATOR                         │ │
│  │                                                                     │ │
│  │  ┌──────────────┐  Planning Brain (DeepSeek R1)                     │ │
│  │  │              │  - Analyzes requirements                           │ │
│  │  │              │  - Creates execution plan                          │ │
│  │  │              │  - Assigns tasks to clusters                      │ │
│  │  └──────┬───────┘                                                    │ │
│  │         ↓                                                             │ │
│  │  ┌──────────────┐  Execution Brain (GLM-flash)                      │ │
│  │  │              │  - Coordinates cluster activity                    │ │
│  │  │              │  - Monitors async progress                        │ │
│  │  │              │  - Aggregates results                             │ │
│  │  └──────┬───────┘                                                    │ │
│  │         ↓                                                             │ │
│  │  ┌──────────────┐  "Hands" = Sub-agents AS TOOLS                    │ │
│  │  │              │  - spawn_cluster_task()                           │ │
│  │  │              │  - spawn_shark_agent()                            │ │
│  │  │              │  - spawn_manta_agent()                            │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│                          ↓ ↓ ↓                                           │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │   CLUSTER 1     │  │   CLUSTER 2     │  │   CLUSTER 3     │          │
│  │                 │  │                 │  │                 │          │
│  │  Shark-1        │  │  Shark-2        │  │  Manta-1        │          │
│  │  Manta-1        │  │  Manta-2        │  │  Manta-2        │          │
│  │  (async work)   │  │  (async work)   │  │  (async work)   │          │
│  │         ↓       │  │         ↓       │  │         ↓       │          │
│  │  [mini-project] │  │  [mini-project] │  │  [mini-project] │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                          │
│  CENTRALIZED MACRO ORCHESTRATION ← Kraken Orchestrator assigns tasks    │
│  ASYNC PARALLEL EXECUTION ← Clusters work independently in parallel     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Distinctions from Spider

| Aspect | Spider Agent | Kraken |
|--------|--------------|--------|
| **Execution Model** | Linear step-by-step | Async parallel clusters |
| **Cluster Behavior** | Has clusters (exec/qa/research) | Multiple async clusters, each self-contained mini-project |
| **Orchestrator** | Sequential phases | Centralized task assignment |
| **Agent Types** | Architect, coder, reviewer | Shark (steamroll) + Manta (precise) |
| **Sub-agents** | Delegated via status updates | Called AS TOOLS (not spawned processes) |

### 1.3 Performance Target

```
5 Shark terminals working on different tasks
         ↓
Becomes a self-contained parallel execution harness
         ↓
Massively increased throughput WITHOUT changing Shark/Manta architecture
```

---

## 2. Architecture

### 2.1 Agent Types

#### Shark Agent
- **Character:** Ferrari V12 turbo vibecoding engineer
- **Behavior:** Aggressive, figures shit out, builds from scratch
- **Best For:** Juggernaut steamroll approaches, bigger projects, build-from-scratch at solid level

#### Manta Agent
- **Character:** Tesla Model S - fast, reliable, linear, precise, mechanically oriented
- **Behavior:** Precise, follows specs exactly, debugging expert
- **Best For:** Debugging, linear tasks, precision work

### 2.2 Kraken Orchestrator Agents

| Agent | Role | Brain |
|-------|------|-------|
| `kraken-architect` | Strategic planner - analyzes requirements, creates plans | Planning Brain |
| `kraken-executor` | Execution coordinator - assigns tasks, monitors progress | Execution Brain |
| `kraken-hands` | Tool interface for spawning sub-agents | "Hands" |

### 2.3 Cluster Configuration (v1.0 - 3 Clusters)

```typescript
const KRAKEN_CLUSTERS = [
  {
    id: 'cluster-alpha',
    name: 'Alpha Cluster',
    description: 'Primary build cluster - Shark agents for steamroll tasks',
    agents: ['shark-alpha-1', 'shark-alpha-2', 'manta-alpha-1'],
    subOrchestrator: 'cluster-alpha-orch',
    intraClusterDelegation: true,
    interClusterDelegation: true,
    sharedContext: true,
  },
  {
    id: 'cluster-beta',
    name: 'Beta Cluster', 
    description: 'Secondary build cluster - balanced Shark/Manta',
    agents: ['shark-beta-1', 'manta-beta-1', 'manta-beta-2'],
    subOrchestrator: 'cluster-beta-orch',
    intraClusterDelegation: true,
    interClusterDelegation: true,
    sharedContext: true,
  },
  {
    id: 'cluster-gamma',
    name: 'Gamma Cluster',
    description: 'Precision cluster - Manta agents for debugging/linear tasks',
    agents: ['manta-gamma-1', 'manta-gamma-2', 'shark-gamma-1'],
    subOrchestrator: 'cluster-gamma-orch',
    intraClusterDelegation: true,
    interClusterDelegation: true,
    sharedContext: true,
  },
];
```

### 2.4 State Domains

```typescript
const KRAKEN_DOMAIN_OWNERSHIP = {
  'plan-state': ['kraken-architect'],
  'execution-state': ['kraken-executor'],
  'cluster-state': ['kraken-executor', 'cluster-*'], // All clusters can write
  'quality-state': ['kraken-executor', 'cluster-*-orch'],
  'security-state': ['kraken-executor'],
};
```

---

## 3. Directory Structure

```
kraken-agent/
├── src/
│   ├── index.ts                      # Plugin entry point
│   ├── v4.1/                         # Guardrail layer (from boilerplate)
│   │   ├── hooks/
│   │   │   ├── safe-hook.ts
│   │   │   └── compose-handlers.ts
│   │   ├── context/
│   │   │   ├── agent-awareness.ts
│   │   │   └── hook-context.ts
│   │   ├── state/
│   │   │   ├── session-state.ts
│   │   │   └── global-state.ts
│   │   └── config/
│   │       ├── identity.ts
│   │       └── constants.ts
│   ├── factory/                      # Extended from boilerplate
│   │   ├── types.ts                 # Extended with Kraken-specific types
│   │   ├── ClusterFactory.ts        # Enhanced for async clusters
│   │   ├── AsyncDelegationEngine.ts  # NEW: Async delegation engine
│   │   └── ClusterScheduler.ts       # NEW: Cluster task scheduler
│   ├── clusters/                     # NEW: Cluster management
│   │   ├── ClusterManager.ts         # Manages 3 concurrent clusters
│   │   ├── ClusterInstance.ts        # Individual cluster runtime
│   │   └── AsyncAgentPool.ts         # Agent task queue per cluster
│   ├── agents/                       # Kraken agent definitions
│   │   ├── kraken-architect.ts
│   │   ├── kraken-executor.ts
│   │   ├── sharks/
│   │   │   └── shark-agent.ts        # Shark template
│   │   └── mantas/
│   │       └── manta-agent.ts        # Manta template
│   ├── tools/                        # Kraken-specific tools
│   │   ├── spawn-cluster-task.ts     # Spawn task in cluster
│   │   ├── spawn-shark-agent.ts      # Spawn Shark as tool
│   │   ├── spawn-manta-agent.ts      # Spawn Manta as tool
│   │   ├── get-cluster-status.ts     # Check cluster state
│   │   └── aggregate-results.ts      # Aggregate async results
│   └── hooks/                        # Kraken hooks
│       ├── cluster-state-hook.ts
│       ├── async-delegation-hook.ts
│       └── macro-orchestration-hook.ts
├── tests/
│   ├── cluster-async.test.ts
│   ├── delegation.test.ts
│   └── integration.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## 4. Core Components

### 4.1 AsyncDelegationEngine

```typescript
// src/factory/AsyncDelegationEngine.ts

interface DelegationRequest {
  taskId: string;
  task: string;
  targetCluster: string;
  targetAgent?: string;  // Optional - let cluster scheduler decide
  context?: Record<string, unknown>;
  acceptanceCriteria: string[];
  priority: 'low' | 'normal' | 'high' | 'critical';
}

interface DelegationResult {
  success: boolean;
  taskId: string;
  clusterId: string;
  agentId?: string;
  error?: string;
}

export class AsyncDelegationEngine {
  private pendingTasks: Map<string, DelegationRequest>;
  private activeTasks: Map<string, DelegationResult>;
  private taskQueue: PriorityQueue<DelegationRequest>;
  
  constructor(private clusterManager: ClusterManager) {
    this.pendingTasks = new Map();
    this.activeTasks = new Map();
    this.taskQueue = new PriorityQueue();
  }
  
  async delegate(request: DelegationRequest): Promise<DelegationResult> {
    // Add to pending
    this.pendingTasks.set(request.taskId, request);
    
    // Get cluster assignment from scheduler
    const clusterId = await this.clusterManager.assignCluster(request);
    
    // Queue for async execution
    const result = await this.clusterManager.queueTask(clusterId, request);
    
    // Move to active
    this.pendingTasks.delete(request.taskId);
    this.activeTasks.set(request.taskId, result);
    
    return result;
  }
  
  async waitForCompletion(taskId: string, timeoutMs: number): Promise<DelegationResult | null> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const result = this.activeTasks.get(taskId);
      if (result && result.status === 'completed') {
        return result;
      }
      await this.sleep(100);
    }
    return null;
  }
  
  async waitForAll(taskIds: string[], timeoutMs: number): Promise<DelegationResult[]> {
    const results: DelegationResult[] = [];
    const promises = taskIds.map(id => this.waitForCompletion(id, timeoutMs));
    return Promise.all(promises).then(resolved => resolved.filter(Boolean) as DelegationResult[]);
  }
}
```

### 4.2 ClusterScheduler

```typescript
// src/factory/ClusterScheduler.ts

export class ClusterScheduler {
  private clusterLoad: Map<string, number>;  // clusterId -> active task count
  
  constructor(private clusters: ClusterConfig[]) {
    this.clusterLoad = new Map(clusters.map(c => [c.id, 0]));
  }
  
  async assignCluster(request: DelegationRequest): Promise<string> {
    // Strategy: Least loaded cluster gets the task
    let bestCluster = this.clusters[0].id;
    let minLoad = Infinity;
    
    for (const cluster of this.clusters) {
      const load = this.clusterLoad.get(cluster.id) || 0;
      if (load < minLoad) {
        minLoad = load;
        bestCluster = cluster.id;
      }
    }
    
    return bestCluster;
  }
  
  incrementLoad(clusterId: string): void {
    const current = this.clusterLoad.get(clusterId) || 0;
    this.clusterLoad.set(clusterId, current + 1);
  }
  
  decrementLoad(clusterId: string): void {
    const current = this.clusterLoad.get(clusterId) || 0;
    this.clusterLoad.set(clusterId, Math.max(0, current - 1));
  }
}
```

### 4.3 ClusterManager

```typescript
// src/clusters/ClusterManager.ts

export class ClusterManager {
  private clusters: Map<string, ClusterInstance>;
  private scheduler: ClusterScheduler;
  
  constructor(clusters: ClusterConfig[]) {
    this.clusters = new Map();
    this.scheduler = new ClusterScheduler(clusters);
    
    // Initialize all 3 clusters
    for (const config of clusters) {
      this.clusters.set(config.id, new ClusterInstance(config));
    }
  }
  
  async assignCluster(request: DelegationRequest): Promise<string> {
    return this.scheduler.assignCluster(request);
  }
  
  async queueTask(clusterId: string, request: DelegationRequest): Promise<DelegationResult> {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) {
      return { success: false, taskId: request.taskId, clusterId, error: 'Cluster not found' };
    }
    
    this.scheduler.incrementLoad(clusterId);
    
    // Queue task for async execution
    return cluster.enqueue(request);
  }
  
  getClusterStatus(clusterId: string): ClusterStatus {
    const cluster = this.clusters.get(clusterId);
    return cluster?.getStatus() ?? { active: false, taskCount: 0 };
  }
  
  getAllClusterStatuses(): Map<string, ClusterStatus> {
    const statuses = new Map();
    for (const [id, cluster] of this.clusters) {
      statuses.set(id, cluster.getStatus());
    }
    return statuses;
  }
}
```

### 4.4 ClusterInstance

```typescript
// src/clusters/ClusterInstance.ts

interface ClusterStatus {
  active: boolean;
  taskCount: number;
  pendingTasks: number;
  completedTasks: number;
  failedTasks: number;
}

export class ClusterInstance {
  private taskQueue: AsyncQueue<DelegationRequest>;
  private activeAgents: Map<string, AgentInstance>;
  private completedTasks: DelegationResult[];
  private failedTasks: DelegationResult[];
  
  constructor(private config: ClusterConfig) {
    this.taskQueue = new AsyncQueue();
    this.activeAgents = new Map();
    this.completedTasks = [];
    this.failedTasks = [];
    
    // Initialize agents from config
    this.initializeAgents();
    
    // Start async processing loop
    this.startProcessingLoop();
  }
  
  private initializeAgents(): void {
    for (const agentId of this.config.agents) {
      this.activeAgents.set(agentId, {
        id: agentId,
        busy: false,
        currentTask: null,
      });
    }
  }
  
  private async startProcessingLoop(): Promise<void> {
    // Process up to N tasks in parallel where N = number of agents
    const parallelLimit = this.config.agents.length;
    
    while (true) {
      const tasks = await this.taskQueue.dequeueMany(parallelLimit);
      if (tasks.length === 0) {
        await this.sleep(100);  // Wait for new tasks
        continue;
      }
      
      // Execute tasks in parallel
      await Promise.allSettled(tasks.map(task => this.executeTask(task)));
    }
  }
  
  async enqueue(request: DelegationRequest): Promise<DelegationResult> {
    return new Promise((resolve) => {
      this.taskQueue.enqueue({ request, resolve });
    });
  }
  
  private async executeTask(task: { request: DelegationRequest; resolve: Function }): Promise<void> {
    const { request } = task;
    
    try {
      // Find available agent
      const agent = this.findAvailableAgent();
      if (!agent) {
        // Re-queue with backoff
        await this.sleep(100);
        return this.enqueue(request);
      }
      
      // Mark agent as busy
      agent.busy = true;
      agent.currentTask = request.taskId;
      
      // Execute task
      const result = await this.executeOnAgent(agent, request);
      
      // Mark complete
      agent.busy = false;
      agent.currentTask = null;
      
      if (result.success) {
        this.completedTasks.push(result);
      } else {
        this.failedTasks.push(result);
      }
      
      task.resolve(result);
    } catch (error) {
      const result: DelegationResult = {
        success: false,
        taskId: request.taskId,
        clusterId: this.config.id,
        error: String(error),
      };
      this.failedTasks.push(result);
      task.resolve(result);
    }
  }
  
  private findAvailableAgent(): AgentInstance | null {
    for (const agent of this.activeAgents.values()) {
      if (!agent.busy) {
        return agent;
      }
    }
    return null;
  }
  
  private async executeOnAgent(agent: AgentInstance, request: DelegationRequest): Promise<DelegationResult> {
    // Get agent type from config (shark or manta)
    const isShark = agent.id.startsWith('shark-');
    const isManta = agent.id.startsWith('manta-');
    
    // Execute via the appropriate tool
    // The actual execution happens in the sub-agent tool
    return {
      success: true,
      taskId: request.taskId,
      clusterId: this.config.id,
      agentId: agent.id,
    };
  }
  
  getStatus(): ClusterStatus {
    return {
      active: true,
      taskCount: this.activeAgents.size,
      pendingTasks: this.taskQueue.size(),
      completedTasks: this.completedTasks.length,
      failedTasks: this.failedTasks.length,
    };
  }
}
```

---

## 5. Tools (Sub-agents as Tools)

### 5.1 spawn_cluster_task

Spawns a task in a specific cluster for async execution.

```typescript
// src/tools/spawn-cluster-task.ts

export async function executeSpawnClusterTask(
  args: {
    task: string;
    clusterId?: string;  // Optional - scheduler picks if not specified
    targetAgent?: string;
    context?: Record<string, unknown>;
    acceptanceCriteria: string[];
    priority?: 'low' | 'normal' | 'high' | 'critical';
  },
  directory: string,
  context: KrakenContext
): Promise<ToolResult> {
  const request: DelegationRequest = {
    taskId: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    task: args.task,
    targetCluster: args.clusterId || '',
    targetAgent: args.targetAgent,
    context: args.context,
    acceptanceCriteria: args.acceptanceCriteria,
    priority: args.priority || 'normal',
  };
  
  const result = await context.delegationEngine.delegate(request);
  
  return {
    success: result.success,
    result: JSON.stringify(result),
  };
}
```

### 5.2 spawn_shark_agent

Spawns a Shark agent (called as tool, not as separate process).

```typescript
// src/tools/spawn-shark-agent.ts

export async function executeSpawnSharkAgent(
  args: {
    task: string;
    clusterId: string;
    instructions?: string;
    context?: Record<string, unknown>;
  },
  directory: string,
  context: KrakenContext
): Promise<ToolResult> {
  // Shark = Ferrari V12 turbo - aggressive, figures shit out
  const sharkPrompt = `You are SHARK - Ferrari V12 turbo vibecoding engineer.
  
You:
- Steamroll through problems
- Figure shit out and build it
- Build from scratch at a solid level
- Aggressive, autonomous, full speed ahead

Task: ${args.task}

${args.instructions || ''}
`;

  return executeSpawnClusterTask({
    task: sharkPrompt,
    clusterId: args.clusterId,
    context: args.context,
    acceptanceCriteria: [],
    priority: 'high',
  }, directory, context);
}
```

### 5.3 spawn_manta_agent

Spawns a Manta agent (called as tool, not as separate process).

```typescript
// src/tools/spawn-manta-agent.ts

export async function executeSpawnMantaAgent(
  args: {
    task: string;
    clusterId: string;
    instructions?: string;
    context?: Record<string, unknown>;
  },
  directory: string,
  context: KrakenContext
): Promise<ToolResult> {
  // Manta = Tesla Model S - fast, reliable, linear, precise
  const mantaPrompt = `You are MANTA - Tesla Model S agent.

You:
- Fast and reliable
- Linear and precise
- Mechanically oriented
- Perfect for debugging and linear tasks

Task: ${args.task}

${args.instructions || ''}
`;

  return executeSpawnClusterTask({
    task: mantaPrompt,
    clusterId: args.clusterId,
    context: args.context,
    acceptanceCriteria: [],
    priority: 'normal',
  }, directory, context);
}
```

### 5.4 get_cluster_status

```typescript
// src/tools/get-cluster-status.ts

export async function executeGetClusterStatus(
  args: { clusterId?: string },
  directory: string,
  context: KrakenContext
): Promise<ToolResult> {
  if (args.clusterId) {
    const status = context.clusterManager.getClusterStatus(args.clusterId);
    return { success: true, result: JSON.stringify(status) };
  }
  
  const allStatuses = context.clusterManager.getAllClusterStatuses();
  return { 
    success: true, 
    result: JSON.stringify(Object.fromEntries(allStatuses)) 
  };
}
```

### 5.5 aggregate_results

```typescript
// src/tools/aggregate-results.ts

export async function executeAggregateResults(
  args: { taskIds: string[] },
  directory: string,
  context: KrakenContext
): Promise<ToolResult> {
  const results = await context.delegationEngine.waitForAll(
    args.taskIds,
    60000  // 60 second timeout
  );
  
  const summary = {
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  };
  
  return { success: true, result: JSON.stringify(summary) };
}
```

---

## 6. Hooks

### 6.1 cluster_state_hook

Tracks cluster activity and updates session state.

```typescript
// src/hooks/cluster-state-hook.ts

export const clusterStateHook = safeHook(
  async (input, output, ctx) => {
    if (!ctx.isMyAgent()) return;
    
    const sessionState = ctx.getSessionState();
    
    // Track active clusters
    if (!sessionState.clusterStates) {
      sessionState.clusterStates = new Map();
    }
    
    // Update cluster state on task events
    if (input.tool === 'spawn_cluster_task') {
      const args = JSON.parse(input.args);
      sessionState.clusterStates.set(args.clusterId, {
        lastTask: args.taskId,
        timestamp: Date.now(),
      });
    }
  },
  {
    agentFilter: ['kraken-architect', 'kraken-executor'],
    pluginName: 'kraken-agent',
    managedAgents: KRAKEN_AGENTS,
    agentPrefix: 'kraken-',
    orchestratorName: 'kraken-architect',
  }
);
```

### 6.2 async_delegation_hook

Handles async delegation with proper error handling and retry.

```typescript
// src/hooks/async-delegation-hook.ts

export const asyncDelegationHook = safeHook(
  async (input, output, ctx) => {
    if (!ctx.isMyAgent()) return;
    
    // Handle delegation envelope parsing
    if (input.tool === 'spawn_cluster_task') {
      const result = output.result;
      
      // Check if delegation was successful
      if (result.success) {
        const parsed = JSON.parse(result.result);
        
        // Store in session for tracking
        const sessionState = ctx.getSessionState();
        if (!sessionState.pendingTasks) {
          sessionState.pendingTasks = [];
        }
        sessionState.pendingTasks.push(parsed.taskId);
      }
    }
  },
  {
    agentFilter: ['kraken-executor'],
    pluginName: 'kraken-agent',
    managedAgents: KRAKEN_AGENTS,
    agentPrefix: 'kraken-',
    orchestratorName: 'kraken-architect',
  }
);
```

---

## 7. File Changes Summary

### 7.1 New Files

| File | Purpose | Priority |
|------|---------|----------|
| `src/factory/AsyncDelegationEngine.ts` | Async task delegation with Promise-based results | CRITICAL |
| `src/factory/ClusterScheduler.ts` | Least-load cluster scheduling | CRITICAL |
| `src/clusters/ClusterManager.ts` | Manages 3 concurrent clusters | CRITICAL |
| `src/clusters/ClusterInstance.ts` | Individual cluster runtime with async queue | CRITICAL |
| `src/clusters/AsyncAgentPool.ts` | Agent task pool per cluster | HIGH |
| `src/tools/spawn-cluster-task.ts` | Tool for spawning tasks | CRITICAL |
| `src/tools/spawn-shark-agent.ts` | Tool for spawning Sharks | CRITICAL |
| `src/tools/spawn-manta-agent.ts` | Tool for spawning Mantas | CRITICAL |
| `src/tools/get-cluster-status.ts` | Tool for checking cluster state | HIGH |
| `src/tools/aggregate-results.ts` | Tool for aggregating async results | HIGH |
| `src/hooks/cluster-state-hook.ts` | Track cluster activity | MEDIUM |
| `src/hooks/async-delegation-hook.ts` | Handle async delegation | MEDIUM |
| `src/hooks/macro-orchestration-hook.ts` | Centralized orchestration | HIGH |

### 7.2 Modified Files

| File | Change | Priority |
|------|--------|----------|
| `src/factory/types.ts` | Add Kraken-specific types | CRITICAL |
| `src/index.ts` | Register Kraken agents and hooks | CRITICAL |

---

## 8. Implementation Phases

### Phase 1: Core Infrastructure (Days 1-2)
1. Copy v4.1 boilerplate to `kraken-agent/`
2. Set up plugin identity (`kraken-`, `kraken-agent`)
3. Implement `AsyncDelegationEngine`
4. Implement `ClusterScheduler`
5. Implement `ClusterManager`

### Phase 2: Cluster Runtime (Days 3-4)
1. Implement `ClusterInstance` with async queue
2. Implement `AsyncAgentPool`
3. Wire clusters to delegation engine
4. Test 3-cluster concurrent operation

### Phase 3: Tools (Days 5-6)
1. Implement `spawn_cluster_task`
2. Implement `spawn_shark_agent`
3. Implement `spawn_manta_agent`
4. Implement `get_cluster_status`
5. Implement `aggregate_results`

### Phase 4: Integration (Day 7)
1. Wire hooks to cluster state
2. Test full async flow
3. Verify parallel execution
4. Document and ship

---

## 9. Testing Plan

### Test 1: 3 Concurrent Clusters
```bash
opencode --agent kraken-architect "Create 3 tasks and execute them in parallel"
# Expected: 3 clusters each execute 1 task concurrently
```

### Test 2: Async Within Cluster
```bash
opencode --agent kraken-executor "Queue 5 tasks in cluster-alpha"
# Expected: Tasks execute async, agents don't idle
```

### Test 3: Centralized Orchestration
```bash
opencode --agent kraken-architect "Build a todo app with: API (cluster-alpha), Frontend (cluster-beta), Tests (cluster-gamma)"
# Expected: Central planner assigns tasks to appropriate clusters
```

### Test 4: Shark/Manta Behavior
```bash
opencode --agent kraken-architect "Use shark to build a feature, then manta to debug it"
# Expected: Shark steamrolls, manta fixes precisely
```

---

## 10. Acceptance Criteria

1. **3 clusters run concurrently** - All three clusters can execute tasks simultaneously
2. **Full async at cluster level** - Clusters work independently without blocking each other
3. **Full async at agent level** - Multiple tasks queue and execute in parallel within a cluster
4. **Centralized macro orchestration** - Kraken-architect assigns tasks, doesn't execute directly
5. **Sub-agents called as tools** - Shark/Manta spawned via tools, not as separate processes
6. **No idle time** - When one agent finishes, another task starts immediately
7. **5 Shark terminals = 5 parallel workers** - Target use case works as designed

---

## 11. References

- **Boilerplate:** `/home/leviathan/OPENCODE_WORKSPACE/projects/v4-boilerplate-plugin-factory/`
- **ClusterFactory:** `src/factory/ClusterFactory.ts` (existing)
- **Types:** `src/factory/types.ts` (extend for Kraken)
- **Spider delegation:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Opencode Macro-Architecture/spider-source/src/hooks/delegation-gate.ts`
- **Shark Context:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/03_OPENCODE_PLUGIN/shark-agent-boilerplate-template/shark-context/`

---

*Build Spec v1.0 — Kraken Agent Harness*
