# KRAKEN V2.0 REBUILD - MASTER CONTEXT DOCUMENT

## FOR KRAGEN AGENT EXECUTIVE SESSION

---

# PART 1: THE CATASTROPHIC FAILURE (What Went Wrong)

## The Short Version

**Kraken V2.0 is a non-functional hollow shell that does NOT execute any real tasks.**

It contains placeholder code that simulates success with 100ms timeouts instead of actually doing any work. The entire Docker container spawning system was deleted during the v2.0 refactor and never replaced.

## Failure Metrics

| Metric | v1.1 (Working) | v2.0 (Broken) |
|--------|-----------------|---------------|
| Bundle Size | 521 KB | 52 KB (90% loss) |
| Real Execution | YES | NO - always returns success |
| Docker Spawning | YES | REMOVED |
| Actual Work Done | YES | NO |

## The Smoking Gun

In `src/clusters/ClusterInstance.ts:163-183`:

```typescript
private async simulateTaskExecution(
  agent: ClusterAgentInstance,
  request: KrakenDelegationRequest
): Promise<KrakenDelegationResult> {
  // In v1, we just return a success result
  // Full implementation would actually execute the agent with the task
  
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        success: true,        // ALWAYS SUCCESS
        taskId: request.taskId,
        clusterId: this.config.id,
        agentId: agent.id,
        status: 'completed',  // ALWAYS COMPLETED
        completedAt: Date.now(),
      });
    }, 100);  // FAKE 100ms delay
  });
}
```

**This function ALWAYS returns success after 100ms. NO real execution occurs.**

## What Was Removed

v1.1 had a **COMPLETE working system**:

```
kraken-agent-v1.1/
├── subagent-manager/           # REAL AGENT SPAWNER (DELETED)
│   ├── src/tools/index.ts      # run_subagent_task, run_parallel_tasks
│   └── wrappers/
│       ├── opencode_agent.py   # Spawns single Docker container (DELETED)
│       └── container_pool.py   # Spawns pool of containers (DELETED)
├── shark-agent/                # REAL shark agent plugin (DELETED)
└── manta-agent/               # REAL manta agent plugin (DELETED)
```

The tools used Python's `subprocess` to spawn Docker containers with actual agent code mounted.

## Root Cause

During v2.0 refactor:
1. subagent-manager was removed
2. shark-agent and manta-agent plugins were removed from bundle
3. Container spawning code was deleted
4. `simulateTaskExecution` was left as temporary placeholder
5. **Placeholder never replaced**
6. v2.0 was shipped anyway

---

# PART 2: V1.1 ARCHITECTURE (THE WORKING SYSTEM)

## What We Have Now (RESTORED)

v1.1 is now restored to `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/`

```
kraken-agent/
├── shark-agent/                 # Shark agent plugin
├── manta-agent/               # Manta agent plugin
├── subagent-manager/          # Container spawning system
│   ├── src/tools/index.ts     # run_subagent_task, run_parallel_tasks
│   └── wrappers/
│       ├── opencode_agent.py  # Single container spawner
│       └── container_pool.py  # Container pool manager
├── dist/index.js = 521 KB      # WORKING BUILD
└── src/
    ├── clusters/              # Cluster management
    ├── factory/               # Delegation engine
    └── tools/                # Kraken tools
```

## Execution Flow (WORKING)

```
User: "Build a React app"
    ↓
Kraken receives task
    ↓
spawn_cluster_task tool called
    ↓
AsyncDelegationEngine.delegate() queues task
    ↓
ClusterScheduler.assignCluster() selects cluster
    ↓
ClusterInstance.executeTaskAsync() marks agent busy
    ↓
run_subagent_task tool from subagent-manager
    ↓
Python wrapper: executePythonWrapper()
    ↓
Docker spawns container with shark-agent mounted
    ↓
Real agent executes task in container
    ↓
Result returned via JSON
```

---

# PART 3: V2.0 REBUILD REQUIREMENTS

## Rebuild Objectives

1. **RESTORE** v1.1 working container spawning (DONE - v1.1 restored)
2. **INTEGRATE** Hive context systems naturally into v1.1 architecture
3. **BUILD PROPERLY** - no theatrical code, no simulations, no hallucinations
4. **TEST LOOP** - build-test-verify-debug until production grade

## Required Components

### A. Keep from v1.1 (DO NOT MODIFY THESE YET)
- [ ] subagent-manager (container spawning)
- [ ] shark-agent plugin
- [ ] manta-agent plugin
- [ ] ClusterInstance with REAL execution
- [ ] AsyncDelegationEngine

### B. Add Hive Systems (Integrate NATURALLY)

Hive should be added as a **layer**, not a replacement. The Hive is a **context memory system** that agents query, not an execution replacement.

**Hive Integration Points:**
1. **Before task assignment**: Query Hive for relevant patterns
2. **After task completion**: Store results/patterns to Hive
3. **During execution**: Allow agents to inject context

**Do NOT:**
- Replace container spawning with "simulated" Hive calls
- Make Hive do execution work it shouldn't do
- Remove real agent spawning

### C. What NOT to Build (Lessons Learned)

| Anti-Pattern | What Happened |
|--------------|---------------|
| simulateTaskExecution | Left fake 100ms timeout as "temporary" - never replaced |
| Removing subagent-manager | Deleted real container spawning - never restored |
| String agent IDs | `shark-alpha-1` was just a string, not real agent code |
| Placeholder comments | `// In full implementation` code was never implemented |

---

# PART 4: BUILD SPECIFICATION

## Phase 1: VERIFY v1.1 WORKS (Week 1)

### Step 1.1: Test Container Spawning
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent
# Build and test that subagent_manager actually spawns containers
npm run build
npm test
```

### Step 1.2: Verify Real Execution
- Create a simple task (e.g., "write hello world to /tmp/test.txt")
- Verify the file is actually created
- NOT just returning success from a 100ms timeout

### Step 1.3: Test Cluster Behavior
- Spawn 3 parallel tasks
- Verify all 3 complete independently
- Verify results are real, not faked

## Phase 2: ADD HIVE SYSTEMS (Week 2)

### Step 2.1: Integrate Hive as Context Layer

Hive should enhance agents with **memory and context**, not replace execution.

**Add to Kraken agent instructions:**
```
Before assigning tasks:
1. Query Hive: kraken_hive_search for relevant patterns
2. Inject context: kraken_hive_inject_context into task

After task completion:
1. Store patterns: kraken_hive_remember for useful discoveries
2. Store failures: kraken_hive_remember for anti-patterns
```

### Step 2.2: Add Hive Tools (DO NOT REPLACE EXECUTION)

Tools should call Hive, not simulate execution:
- `kraken_hive_search` → Query Hive for context
- `kraken_hive_remember` → Store to Hive
- `kraken_hive_inject_context` → Inject into task

These are **in addition to** real execution tools, not replacements.

### Step 2.3: Test Hive Integration

- Start session, query Hive (should be empty initially)
- Complete tasks, store patterns to Hive
- Start new session, query Hive (should find previous patterns)

## Phase 3: BUILD-TEST-VERIFY LOOP (Week 3+)

### Step 3.1: Every Change Must Pass Tests

**Test categories:**
1. **Unit tests**: Each component in isolation
2. **Integration tests**: Components working together
3. **E2E tests**: Real task completion in containers

### Step 3.2: No Theatrical Code

**Definition of theatrical code:**
```typescript
// THEATRICAL (BAD):
private async simulateTaskExecution(...) {
  return new Promise(resolve => {
    setTimeout(() => resolve({ success: true }), 100);
  });
}

/// REAL (GOOD):
private async executeOnAgent(agent, task) {
  return await run_subagent_task({
    task: task,
    agent: agent.id,
    workspace: this.workspace
  });
}
```

### Step 3.3: Debug Loop

For every bug found:
1. Write failing test that demonstrates bug
2. Fix the bug
3. Verify test passes
4. Verify no regression in other tests

---

# PART 5: ANTI-PATTERNS TO NEVER REPEAT

## Pattern 1: "We'll Fix It Later"
```typescript
// BAD - Never leave theatrical code
private async simulateTaskExecution(...) {
  return { success: true }; // TODO: implement real later
}
```
**Rule**: If it's not real, it's not done.

## Pattern 2: Removing Execution
```typescript
// BAD - Don't remove real spawning
// OLD: run_subagent_task() → spawned container
// NEW: simulateTaskExecution() → fake success
```
**Rule**: Execution must always be real. Hive enhances, never replaces.

## Pattern 3: String Agents
```typescript
// BAD - These are not real agents
const agents = new Set(['shark-alpha-1', 'shark-alpha-2']);

// GOOD - These are real plugins with actual code
const agents = ['shark-agent', 'manta-agent'];
```
**Rule**: If it doesn't have code, it's not an agent.

## Pattern 4: "Full Implementation" Comments
```typescript
// BAD - Admits code isn't real
// In full implementation, this would spawn the actual agent

// GOOD - Either it's implemented or it isn't
// Spawns a Docker container with the agent plugin mounted
const result = await run_subagent_task({...});
```
**Rule**: If there's a "full implementation" comment, the code isn't done.

---

# PART 6: SUCCESS CRITERIA

## v2.0 is PRODUCTION READY when:

### Execution Criteria
- [ ] Real Docker containers are spawned for each task
- [ ] Tasks actually complete work (files created, code generated)
- [ ] 3 parallel tasks complete in ~parallel time, not 3x sequential
- [ ] Failed tasks return real errors, not fake success

### Hive Criteria
- [ ] Hive search returns relevant past patterns
- [ ] Remembered patterns persist across sessions
- [ ] Inject context properly influences task execution
- [ ] Hive does NOT replace execution (no "simulated" Hive calls)

### Quality Criteria
- [ ] All tests pass (unit, integration, E2E)
- [ ] Zero theatrical code anywhere
- [ ] Bundle size should INCREASE from v1.1 (adding features)
- [ ] No "TODO" or "full implementation" comments left

### Performance Criteria
- [ ] Container spawn time < 5 seconds
- [ ] Task queue handles 100+ concurrent tasks
- [ ] Memory stable under load

---

# PART 7: ARCHITECTURE PRINCIPLES

## Core Principle

**Hive is a brain. Execution is muscles. They work together, but muscles do the work.**

### What Hive Does
- Stores patterns and context
- Provides search and retrieval
- Injects context into tasks
- Enables learning across sessions

### What Execution Does
- Spawns real containers
- Runs real agent code
- Creates/deletes files
- Compiles and tests code

### The Integration Rule

```
Task arrives
    ↓
Hive query (what do I know about this?)
    ↓
Inject relevant context into task
    ↓
REAL execution via container spawning
    ↓
Store results/patterns to Hive
    ↓
Return real result to user
```

**NOT:**
```
Task arrives
    ↓
Hive query (what do I know?)
    ↓
"Execute" task via fake timeout
    ↓
Return fake success
    ↓
Never actually did anything
```

---

# PART 8: FILE STRUCTURE (TARGET)

```
kraken-agent-v2.0/
├── shark-agent/                 # KEEP - Real shark agent
├── manta-agent/                # KEEP - Real manta agent
├── subagent-manager/            # KEEP - Real container spawning
│   ├── src/tools/index.ts       # run_subagent_task, run_parallel_tasks
│   └── wrappers/
│       ├── opencode_agent.py   # Single container
│       └── container_pool.py   # Container pool
├── kraken-hive/                # ADD - Hive memory system
│   ├── src/
│   │   ├── memory-store.ts     # Persistent storage
│   │   ├── search-engine.ts    # Similarity search
│   │   └── context-inject.ts   # Context injection
│   └── tools/
│       └── hive-tools.ts       # kraken_hive_* tools
├── src/
│   ├── clusters/
│   │   ├── ClusterInstance.ts  # MODIFY - use real spawning
│   │   └── ClusterManager.ts
│   ├── factory/
│   │   ├── AsyncDelegationEngine.ts  # KEEP
│   │   └── HiveIntegration.ts  # ADD - natural Hive integration
│   └── tools/
│       ├── cluster-tools.ts     # KEEP - real delegation
│       └── hive-tools.ts        # ADD - Hive tools
└── dist/
    └── index.js                 # SHOULD BE >521KB (grew, not shrunk)
```

---

# PART 9: IMPLEMENTATION ORDER

## DO THIS FIRST (Verify Baseline)
1. [ ] Build v1.1 as-is, verify container spawning works
2. [ ] Run 3 parallel tasks, verify real execution
3. [ ] Confirm 521KB bundle size
4. [ ] Document baseline behavior

## THEN ADD HIVE (Natural Integration)
5. [ ] Add kraken-hive directory with memory system
6. [ ] Create hive tools (search, remember, inject)
7. [ ] Add Hive calls BEFORE task assignment
8. [ ] Add Hive calls AFTER task completion
9. [ ] Verify Hive doesn't slow down execution

## THEN VERIFY (Production Quality)
10. [ ] All unit tests pass
11. [ ] All integration tests pass
12. [ ] E2E tests prove real execution
13. [ ] No theatrical code anywhere
14. [ ] Bundle size > 521KB (grew with features)
15. [ ] Performance under load verified

---

# PART 10: THE ONE RULE

**IF IT'S NOT REAL, IT'S NOT DONE.**

Every function must actually do what it says. Every tool must execute for real. Every test must prove actual work happened.

The 100ms `simulateTaskExecution` was a failure of discipline. It was left in because "we'd fix it later." Later never came.

**This time, we ship when it's real.**

---

# APPENDIX: RESTORED v1.1 LOCATIONS

## Active Build (RESTORED)
```
/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/
```

## Working Components
```
/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/subagent-manager/  # Container spawning
/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/shark-agent/      # Shark agent
/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/manta-agent/      # Manta agent
/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/dist/index.js    # 521KB WORKING
```

## Failure Documentation
```
/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/CATASTROPHIC_FAILURE_REPORT.md
/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/FORENSIC_REPORT.md
/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/13-kraken-catastrophic-failure-20260413_005709/
```

---

**END OF MASTER CONTEXT DOCUMENT**

Kraken V2.0 rebuild begins with VERIFYING v1.1 works, then adding Hive naturally, then verifying again. No theatrical code. No simulations. Real execution or it didn't happen.
