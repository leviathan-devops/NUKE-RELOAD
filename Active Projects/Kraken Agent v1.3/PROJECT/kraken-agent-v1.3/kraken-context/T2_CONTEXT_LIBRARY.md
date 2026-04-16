# KRAKEN V2.0 PROPER BUILD - COMPLETE CONTEXT LIBRARY
## For Building a Real Multi-Agent Orchestrator (Not Theatrical)

**Version:** 2.0.0-PROPER  
**Built:** 2026-04-13  
**Purpose:** Guide the building of Kraken v2.0 that actually executes real Docker containers  
**Image:** `opencode-python3:latest` (Python 3.12.13 enabled)

---

# LAYER 1: INITIAL PLAN

## Surface Understanding

**What is Kraken v2.0?**

Kraken is a **multi-agent orchestrator** for OpenCode that:
1. Receives complex tasks from users
2. Breaks them into sub-tasks
3. Spawns **real Docker containers** with sub-agents (Shark, Manta)
4. Executes **real work** in isolated containers
5. Returns **real results** to users

**What went catastrophically wrong with the shipped v2.0?**

The v2.0 shipped on 2026-04-12 was **100% theatrical**. It:
- Returned `success: true` after 100ms without doing anything
- Never spawned Docker containers
- Deleted the real execution code during "refactor"
- Had a 90% size reduction (521KB → 52KB) indicating massive code deletion
- Appeared to work but produced zero actual output

**What do we need to build?**

A Kraken v2.0 that:
- Actually spawns Docker containers via Python wrappers
- Uses `opencode-python3:latest` image (Python 3.12.13 built-in)
- Has ZERO theatrical code (no simulateTaskExecution, no fake delays)
- Verifies real execution via `docker ps`
- Bundle sizes reflect real code (~199KB kraken + ~569KB shark + ~158KB manta)

---

## First Principles

### Principle 1: Real Execution or It Doesn't Count

**Any function named `execute`, `spawn`, `run`, or `delegate` MUST spawn a real process.**

If you write `executeTask()` and it doesn't spawn a process, it's THEATRICAL CODE. Flag it immediately.

**Verification:**
```bash
grep -n "simulateTaskExecution\|setTimeout.*success" src/
# If found = THEATRICAL, must be replaced
```

### Principle 2: Bundle Size Tells the Truth

**Adding real features increases bundle size. Decreasing size means code was deleted.**

| Version | Bundle Size | Status |
|---------|------------|--------|
| v1.1 (working) | 521 KB | Real (had execution code, even if fake) |
| v2.0-broken (shipped) | 52 KB | HOLLOW - 90% deleted |
| v2.0-proper | 199+ KB | Real (direct spawn, no HTTP overhead) |

**Rule:** If v2.0 bundle is smaller than v1.1, something is wrong.

### Principle 3: Tests That Don't Verify Real Execution Are Theater

**A test that checks `success === true` after 100ms is NOT a test - it's theater.**

Real verification requires:
- `docker ps` shows containers running during task
- Actual file creation/modification in workspace
- Real subprocess exit codes from actual work

### Principle 4: Python3 Changes Architecture

**The `opencode-python3:latest` image enables direct spawn instead of HTTP daemon.**

**Before (v2.0-broken):**
```typescript
// Required daemon on host at port 18086
const req = http.request({ hostname: '127.0.0.1', port: 18086, ... });
```

**After (v2.0-proper):**
```typescript
// Direct spawn - Python3 available in opencode-python3:latest
const proc = spawn('python3', [wrapperPath, '--task', task, ...]);
```

### Principle 5: No "Full Implementation Would" Comments

**Code with comments like `// Full implementation would spawn...` is a WARNING SIGN.**

Either:
1. Complete the implementation, OR
2. Delete the placeholder entirely

Never ship incomplete code that appears to work.

---

## Constraints

### Must Have

1. **Python3 in container** - Use `opencode-python3:latest` image
2. **Direct spawn pattern** - `spawn('python3', [wrapperScript, ...])` not HTTP
3. **Proper bundle sizes** - kraken ~199KB, shark ~569KB, manta ~158KB
4. **No theatrical functions** - Zero `simulateTaskExecution` remnants
5. **Real Docker verification** - `docker ps` shows containers during execution

### Must Not Have

1. **HTTP daemon dependency** - No port 18086, no kraken-agent-wrapper.py daemon
2. **Fake delays** - No `setTimeout(() => resolve({success: true}), 100)`
3. **Placeholder comments** - No `// Full implementation would...`
4. **String agent IDs** - Agents must be actual plugin bundles, not Set strings
5. **Bundle size reduction** - v2.0 must not be smaller than v1.1

---

## Success Criteria

| Criteria | How to Verify |
|----------|---------------|
| Python3 works in container | `docker run opencode-python3 python3 --version` → 3.12.13 |
| ClusterInstance uses direct spawn | `grep -n "spawn.*python3" ClusterInstance.ts` finds real spawn |
| No theatrical code | `grep -r "simulateTaskExecution" src/` → 0 results |
| Bundle sizes proper | `ls -la kraken-agent/dist/` → ~199KB+ |
| Real Docker spawns | During task: `docker ps` shows opencode-python3 containers |

---

## Open Questions (Acknowledged)

1. ✅ **Resolved:** Python3 can be installed in OpenCode containers (Alpine apk)
2. ✅ **Resolved:** Image `opencode-python3:latest` built with Python 3.12.13
3. ❓ **Pending:** Does ClusterInstance.ts need update from HTTP to direct spawn?
4. ❓ **Pending:** Are wrapper scripts ready for direct spawn pattern?

---

# LAYER 2: DETAILED WORKFLOW

## Component Decomposition

### The 7 Components of Kraken v2.0 Proper

| # | Component | Responsibility | Real? |
|---|-----------|---------------|-------|
| 1 | **opencode-python3** | Container image with Python 3.12 | ✅ REAL |
| 2 | **subagent-manager** | Spawns Docker containers via Python | ✅ REAL |
| 3 | **opencode_agent.py** | Wrapper script for single container | ✅ REAL |
| 4 | **container_pool.py** | Manages pool of containers | ✅ REAL |
| 5 | **ClusterInstance** | Orchestrates task execution | ⚠️ NEEDS UPDATE |
| 6 | **shark-agent** | Shark execution brain bundle | ✅ REAL |
| 7 | **manta-agent** | Manta execution brain bundle | ✅ REAL |

### Component 1: opencode-python3 (NEW - ENABLEING TECHNOLOGY)

**What:** Custom OpenCode image with Python 3.12.13 pre-installed

**Why:** Enables direct `spawn('python3', [...])` instead of HTTP daemon workaround

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/opencode-python3/`

**Tags:**
- `opencode-python3:latest`
- `opencode:python3-enabled-1.4.3`
- `leviathan/opencode:python3-enabled-1.4.3`

**Verification:**
```bash
docker run --rm opencode-python3:latest python3 --version
# Expected: Python 3.12.13

docker run --rm opencode-python3:latest opencode --version
# Expected: 1.4.3
```

---

### Component 2: subagent-manager (Execution Layer)

**What:** TypeScript plugin that provides `run_subagent_task` and `run_parallel_tasks` tools

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/subagent-manager/`

**Structure:**
```
subagent-manager/
├── src/
│   └── tools/
│       └── index.ts          # Provides run_subagent_task, run_parallel_tasks
├── wrappers/
│   ├── opencode_agent.py     # Spawns single container (Python)
│   └── container_pool.py     # Manages container pool (Python)
├── dist/
│   └── index.js              # Built plugin (~50KB)
└── package.json
```

**Tool API:**
```typescript
run_subagent_task({
    task: string,           // Task description
    model: string,          // Model to use
    workspace: string,      // Host directory to mount
    timeout: number,        // Seconds before timeout
    cleanup: boolean        // Kill container after
}): Promise<JSONResult>

run_parallel_tasks({
    tasks: Array<{
        task: string,
        model: string,
        timeout: number
    }>,
    workspace: string,
    poolSize: number
}): Promise<JSONResult[]>
```

---

### Component 3: opencode_agent.py (Critical - The Real Executor)

**What:** Python script that actually spawns Docker containers

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/subagent-manager/wrappers/opencode_agent.py`

**THIS IS THE REAL EXECUTION POINT.**

**What it must do:**
```python
# Pseudocode
def main():
    args = parse_args()
    # Spawn real Docker container
    proc = subprocess.run([
        'docker', 'run',
        '--rm',                    # Remove after exit
        '-v', f'{args.workspace}:/workspace',  # Mount workspace
        'opencode-python3:latest', # Use Python3 image
        'opencode',                # Run opencode
        '--agent', args.agent,     # Target agent
        '--prompt', args.task      # Task description
    ])
    print(json.dumps({
        'success': proc.returncode == 0,
        'output': proc.stdout,
        'error': proc.stderr
    }))
```

**Anti-theatrical check:**
```bash
grep -n "subprocess\|docker.*run\|spawn" opencode_agent.py
# Must show real subprocess/docker calls, NOT just comments
```

---

### Component 4: container_pool.py (Parallel Execution)

**What:** Python script managing a pool of Docker containers for parallel tasks

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/subagent-manager/wrappers/container_pool.py`

**What it must do:**
```python
class ContainerPool:
    def __init__(self, size=3):
        self.containers = []
        for i in range(size):
            # Start containers in background
            c = subprocess.Popen(['docker', 'run', '-d', 'opencode-python3:latest', 'sleep', 'infinity'])
            self.containers.append(c)
    
    def run_all(self, tasks):
        # Execute tasks in parallel across pool
        # Return results
```

---

### Component 5: ClusterInstance.ts (Critical - Needs Update)

**What:** Coordinates task execution on cluster agents

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/src/clusters/ClusterInstance.ts`

**THIS IS WHERE v2.0-BROKEN FAILED.**

**v2.0-broken code (THEATRICAL):**
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

**v2.0-proper code (REAL):**
```typescript
private async executeOnAgent(
  agent: ClusterAgentInstance,
  request: KrakenDelegationRequest
): Promise<KrakenDelegationResult> {
  const wrapperPath = path.join(
    __dirname, '..', '..', 'subagent-manager', 'wrappers', 'opencode_agent.py'
  );
  
  return new Promise((resolve) => {
    const proc = spawn('python3', [
      wrapperPath,
      '--task', request.task,
      '--model', request.model || 'minimax/MiniMax-M2.7',
      '--workspace', process.cwd(),
      '--timeout', '120'
    ]);
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    
    proc.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          resolve({ success: false, error: `Parse error: ${e.message}` });
        }
      } else {
        resolve({ success: false, error: stderr || `Exit code: ${code}` });
      }
    });
  });
}
```

**Key difference:**
- v2.0-broken: `setTimeout` → fake success after 100ms
- v2.0-proper: `spawn('python3', [wrapperScript])` → real Docker container

---

### Component 6: shark-agent (Shark Brain Bundle)

**What:** Shark agent plugin bundle (~569KB of real code)

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/shark-agent/`

**Verification:**
```bash
ls -la shark-agent/dist/index.js
# Should be ~569KB (NOT string IDs, REAL plugin code)
```

---

### Component 7: manta-agent (Manta Brain Bundle)

**What:** Manta agent plugin bundle (~158KB of real code)

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/manta-agent/`

**Verification:**
```bash
ls -la manta-agent/dist/index.js
# Should be ~158KB (NOT string IDs, REAL plugin code)
```

---

## Critical Path

```
User: "Build a React app"
    ↓
Kraken Orchestrator (spawn_cluster_task)
    ↓
AsyncDelegationEngine.delegate() - queues task
    ↓
ClusterScheduler.assignCluster() - selects cluster
    ↓
ClusterInstance.executeTaskAsync() - marks agent busy
    ↓
ClusterInstance.executeOnAgent() - REAL EXECUTION STARTS HERE
    ↓
spawn('python3', ['opencode_agent.py', '--task', 'Build React app', ...])
    ↓
Python wrapper calls: docker run opencode-python3:latest opencode --agent shark-alpha-1
    ↓
Real Docker container spawns with opencode-python3 image
    ↓
Real agent executes real task in isolated container
    ↓
Real JSON result returned (success/error/output)
    ↓
Kraken stores patterns in Hive
    ↓
Real result to user
```

**If any step in this chain is missing, execution is THEATRICAL.**

---

## Failure Modes and Prevention

### Failure 1: Simulated Task Execution

**How v2.0 failed:** `simulateTaskExecution()` with 100ms timeout returning success

**Prevention:**
```bash
# NEVER ship this:
grep -r "simulateTaskExecution\|setTimeout.*success.*true" src/
# Must be 0 results
```

### Failure 2: Missing Python Integration

**How v2.0 failed:** OpenCode base image had no Python, so used HTTP daemon workaround

**Prevention:**
- Use `opencode-python3:latest` image (has Python 3.12.13)
- Direct `spawn('python3', [...])` calls work

### Failure 3: Bundle Size Reduction

**How v2.0 failed:** 521KB → 52KB (90% deleted during refactor)

**Prevention:**
```bash
# Check sizes before ship
ls -la kraken-agent/dist/index.js   # Must be >190KB
ls -la shark-agent/dist/index.js    # Must be >550KB
ls -la manta-agent/dist/index.js    # Must be >150KB
```

### Failure 4: Placeholder Comments

**How v2.0 failed:** Code shipped with `// Full implementation would...` comments

**Prevention:**
```bash
# NEVER ship incomplete code
grep -r "Full implementation would\|FIXME\|TODO.*implement" src/
# Must be 0 results
```

### Failure 5: String Agent IDs

**How v2.0 failed:** Agents defined as `new Set(['shark-alpha-1', ...])` strings

**Prevention:**
```bash
# Agents must be actual plugin bundles
grep -r "new Set\(\[" src/index.ts
# If found = agents are strings, not real plugins
```

---

# LAYER 3: SELF-CONTAINED CONTEXT LIBRARY

## 00_INDEX.md - What Is This Project?

### Project Name
**Kraken v2.0 Proper** - Multi-Agent Orchestrator with Real Docker Execution

### What It Does
1. Receives complex user tasks
2. Breaks into sub-tasks for specialized agents
3. Spawns **real Docker containers** with Python3-enabled OpenCode
4. Executes **real work** via Shark (steamroll) and Manta (precision) agents
5. Returns **real results** with actual file changes

### What It Is NOT
- NOT theatrical code that simulates success
- NOT a hollow shell returning `success: true` without work
- NOT dependent on HTTP daemons or workarounds

### How to Use This Library

**Read these files in order:**
1. `00_INDEX.md` - This file (overview)
2. `01_SURFACE_ANALYSIS.md` - Problem statement and scope
3. `02_ARCHITECTURE.md` - How components fit together
4. `03_COMPONENTS.md` - Parts and their jobs
5. `04_DATA_FLOW.md` - How data moves through system
6. `05_INTERFACES.md` - API contracts
7. `06_STATE_MANAGEMENT.md` - What persists
8. `07_ERROR_HANDLING.md` - Failure recovery
9. `08_TESTING.md` - Verification approach
10. `09_DEPLOYMENT.md` - How to ship
11. `10_MENTAL_MODEL.md` - Simplest explanation

---

## 01_SURFACE_ANALYSIS.md

### Problem Statement

**The shipped Kraken v2.0 (2026-04-12) was a catastrophic failure.** It returned success without executing any real tasks. This was not a bug - it was shipping incomplete theatrical code that appeared to work but did nothing.

### Root Cause Analysis

| Version | What Happened |
|---------|--------------|
| v1.0 | Python wrappers existed but `simulateTaskExecution()` was never connected |
| v1.1 | Same issue - wrappers existed but fake execution remained |
| v2.0 | Deleted wrapper integration, left theatrical placeholder |
| v2.0-broken | 52KB bundle, 100ms fake delays, appears to work, does nothing |

### What Was Lost During v2.0 Refactor

```
v1.1 (521KB) → v2.0-broken (52KB)
         ↓ 90% size loss
subagent-manager/ deleted
shark-agent/ deleted (but not really - just not integrated)
manta-agent/ deleted (but not really - just not integrated)
ClusterInstance.executeOnAgent() → ClusterInstance.simulateTaskExecution()
Real Docker spawning → Fake 100ms timeout
```

### Scope

**In Scope for v2.0 Proper:**
- Real Docker container spawning via `opencode-python3:latest`
- Direct `spawn('python3', [...])` execution
- Proper plugin architecture with real agent bundles
- Full bundle integration (kraken + shark + manta)
- Real verification via `docker ps`

**Out of Scope:**
- HTTP daemon workaround (port 18086)
- Theatrical code / fake success
- String agent IDs without real plugin bundles

---

## 02_ARCHITECTURE.md

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOST MACHINE                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Docker Daemon (docker.sock)                   │   │
│  │                                                               │   │
│  │   Container 1          Container 2          Container 3    │   │
│  │   (shark-alpha-1)      (manta-beta-1)       (manta-gamma-1)  │   │
│  │   opencode-python3     opencode-python3     opencode-python3│   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↑                                   │
│                    docker run --rm ...                           │
│                              │                                   │
└──────────────────────────────│───────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │   Kraken Orchestrator  │
                    │   (spawns containers   │
                    │    via Python wrapper) │
                    └──────────┬────────────┘
                               │
                    spawn('python3', ['opencode_agent.py', ...])
                               │
                    ┌──────────┴──────────┐
                    │  opencode-python3    │
                    │  (Python 3.12.13     │
                    │   ENABLED IMAGE)     │
                    └─────────────────────┘
```

### Key Architectural Decisions

**Decision 1: Use Custom Python3 Image Instead of HTTP Daemon**

**Why:** The HTTP daemon approach (v2.0-broken) required:
- Daemon process running on host at port 18086
- Complex error handling for HTTP failures
- Separate maintenance burden

**Alternative:** Use `opencode-python3:latest` which has Python 3.12.13 built-in:
- Direct `spawn('python3', [wrapper])` works
- No daemon to maintain
- Simpler error handling

**Decision 2: Keep subagent-manager as Separate Plugin**

**Why:** Separation of concerns:
- `subagent-manager` = execution layer (spawns containers)
- `kraken-agent` = orchestration layer (routes tasks)
- Allows independent updates

**Decision 3: Bundle shark-agent and manta-agent in kraken-agent-v2.0**

**Why:** Single plugin deployment:
- All-in-one bundle for easier shipping
- Shared context between orchestrator and executors
- Reduces plugin configuration complexity

---

## 03_COMPONENTS.md

### Component: opencode-python3 (Container Image)

| Property | Value |
|----------|-------|
| **Name** | opencode-python3:latest |
| **Base** | ghcr.io/anomalyco/opencode:latest (Alpine 3.23) |
| **Python** | 3.12.13 |
| **pip** | 25.1.1 |
| **Size** | 782 MB |
| **Tags** | opencode-python3:latest, opencode:python3-enabled-1.4.3 |

**Purpose:** Enables direct Python wrapper execution inside containers

**API (Docker spawn):**
```bash
docker run --rm \
  -v /workspace:/workspace \
  opencode-python3:latest \
  opencode --agent shark-alpha-1 --prompt "Build React app"
```

---

### Component: subagent-manager (Execution Plugin)

| Property | Value |
|----------|-------|
| **Type** | OpenCode Plugin |
| **Provides** | run_subagent_task, run_parallel_tasks |
| **Size** | ~50 KB |

**Purpose:** Provides tools for spawning sub-agents

**API:**
```typescript
// Single task
run_subagent_task({
  task: string,
  model: string,
  workspace: string,
  timeout: number,
  cleanup: boolean
}): Promise<{ success: boolean, output?: string, error?: string }>

// Parallel tasks
run_parallel_tasks({
  tasks: Array<{ task, model, timeout }>,
  workspace: string,
  poolSize: number
}): Promise<Array<{ success: boolean, output?: string, error?: string }>>
```

---

### Component: opencode_agent.py (Wrapper Script)

| Property | Value |
|----------|-------|
| **Language** | Python 3 |
| **Purpose** | Spawns single Docker container |

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/subagent-manager/wrappers/opencode_agent.py`

**What it MUST do:**
```python
#!/usr/bin/env python3
import subprocess
import json
import sys

def main():
    # Parse arguments
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--task', required=True)
    parser.add_argument('--model', default='minimax/MiniMax-M2.7')
    parser.add_argument('--workspace', required=True)
    parser.add_argument('--timeout', default='60')
    parser.add_argument('--agent', default='shark-alpha-1')
    args = parser.parse_args()
    
    # Spawn REAL Docker container
    result = subprocess.run([
        'docker', 'run',
        '--rm',
        '-v', f'{args.workspace}:/workspace',
        '-w', '/workspace',
        'opencode-python3:latest',
        'opencode',
        '--agent', args.agent,
        '--prompt', args.task
    ], capture_output=True, text=True, timeout=int(args.timeout))
    
    # Return REAL result
    print(json.dumps({
        'success': result.returncode == 0,
        'output': result.stdout,
        'error': result.stderr
    }))

if __name__ == '__main__':
    main()
```

**Critical:** This MUST call `subprocess.run(['docker', 'run', ...])` - not just print fake success.

---

### Component: container_pool.py (Pool Manager)

| Property | Value |
|----------|-------|
| **Language** | Python 3 |
| **Purpose** | Manages pool of pre-started containers |

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/subagent-manager/wrappers/container_pool.py`

**What it MUST do:**
```python
import subprocess
import json
import time

class ContainerPool:
    def __init__(self, size=3):
        self.containers = []
        for i in range(size):
            # Start containers in background
            cid = subprocess.run([
                'docker', 'run', '-d',
                '-v', '/workspace:/workspace',
                'opencode-python3:latest',
                'sleep', 'infinity'
            ], capture_output=True, text=True).stdout.strip()
            self.containers.append(cid)
    
    def run_all(self, tasks):
        # Execute tasks in parallel
        # Return results
```

---

### Component: ClusterInstance.ts (Orchestrator)

| Property | Value |
|----------|-------|
| **Language** | TypeScript |
| **Purpose** | Coordinates task execution |
| **Critical Method** | executeOnAgent() |

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/src/clusters/ClusterInstance.ts`

**executeOnAgent() MUST:**
1. Get wrapper script path
2. Spawn Python process with `spawn('python3', [...])`
3. Return real result from wrapper

**Anti-theatrical check:**
```bash
grep -A 50 "executeOnAgent" ClusterInstance.ts
# Must show: spawn('python3', [wrapperPath, ...
# Must NOT show: setTimeout(() => resolve({success: true}), 100)
```

---

## 04_DATA_FLOW.md

### Entry Points

**User Task Entry:**
```
User → spawn_cluster_task tool → AsyncDelegationEngine
```

**Agent Definition Entry:**
```
Plugin Load → Agent Registration → config: async function
```

### Processing Pipeline

```
1. USER SUBMITS TASK
   └─ "Build a React app with authentication"

2. KRAKEN RECEIVES
   └─ spawn_cluster_task tool validates
   └─ Creates KrakenDelegationRequest

3. DELEGATION ENGINE
   └─ AsyncDelegationEngine.delegate() queues task
   └─ Returns Promise<KrakenDelegationResult>

4. CLUSTER ROUTING
   └─ ClusterScheduler.assignCluster() selects cluster
   └─ ClusterInstance receives task

5. AGENT SELECTION
   └─ getAvailableAgents() finds idle agent
   └─ Marks agent as busy

6. REAL EXECUTION ←━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   │                                      │
   │  ClusterInstance.executeOnAgent()    │
   │         │                            │
   │         ↓                            │
   │  spawn('python3', [                 │
   │    'opencode_agent.py',              │
   │    '--task', task,                   │
   │    '--agent', 'shark-alpha-1',       │
   │    '--workspace', '/path/to/ws'      │
   │  ])                                  │
   │         │                            │
   │         ↓                            │
   │  Python wrapper receives call        │
   │         │                            │
   │         ↓                            │
   │  subprocess.run(['docker', 'run',    │
   │    '--rm',                           │
   │    '-v', '/ws:/workspace',           │
   │    'opencode-python3:latest',        │
   │    'opencode', '--agent', 'shark',   │
   │    '--prompt', task                  │
   │  ])                                  │
   │         │                            │
   │         ↓                            │
   │  REAL CONTAINER STARTS               │
   │         │                            │
   └─────────│ (real result flows back)   │
              │                            │

7. RESULT COLLECTION
   └─ subprocess completes
   └─ stdout parsed as JSON
   └─ KrakenDelegationResult constructed

8. HIVE STORAGE (if success)
   └─ kraken_hive_remember patterns
   └─ Store successful execution patterns

9. RESULT TO USER
   └─ Promise resolves
   └─ User receives real output
```

### Data Shapes

**KrakenDelegationRequest:**
```typescript
interface KrakenDelegationRequest {
  taskId: string;           // Unique task ID
  task: string;             // Task description
  targetAgent: string;      // 'shark-alpha-1', 'manta-beta-1', etc.
  context?: {
    files?: string[];       // Relevant files
    workspace?: string;     // Working directory
  };
  acceptanceCriteria?: string[];
  model?: string;
  timeout?: number;
}
```

**KrakenDelegationResult:**
```typescript
interface KrakenDelegationResult {
  success: boolean;
  taskId: string;
  clusterId: string;
  agentId: string;
  status: 'completed' | 'failed' | 'timeout';
  error?: string;
  output?: string;          // Agent's actual output
  completedAt: number;
}
```

---

## 05_INTERFACES.md

### Plugin Export Interface

```typescript
// kraken-agent-v2.0/dist/index.ts
export default async function KrakenPlugin(input: PluginInput): Promise<Plugin> {
  const kraken = new KrakenOrchestrator();
  
  return {
    name: 'kraken-agent-v2.0',
    version: '2.0.0',
    
    tools: {
      'kraken-status': tool({ ... }),
      'kraken-gate-status': tool({ ... }),
      'spawn_cluster_task': tool({ ... }),
      'spawn_shark_agent': tool({ ... }),
      'spawn_manta_agent': tool({ ... }),
      'kraken_hive_search': tool({ ... }),
      'kraken_hive_remember': tool({ ... }),
      // subagent-manager tools
      'run_subagent_task': tool({ ... }),
      'run_parallel_tasks': tool({ ... }),
    },
    
    hooks: {
      'event:session.created': async () => { kraken.initialize(); },
      'tool.execute.before': toolGuardian,
      'tool.execute.after': gateEvaluator,
    },
    
    config: async (opencodeConfig) => {
      // Register agents
      opencodeConfig.registerAgent(KRAKEN_AGENT_CONFIG);
    }
  };
}
```

### Cluster Interface

```typescript
interface ClusterConfig {
  id: string;
  agents: string[];  // ['shark-alpha-1', 'shark-alpha-2', 'manta-beta-1', ...]
  maxParallel: number;
}

interface ClusterAgentInstance {
  id: string;
  agentType: 'shark' | 'manta';
  busy: boolean;
  clusterId: string;
  currentTaskId?: string;
}

interface ClusterLoad {
  clusterId: string;
  activeTasks: number;
  pendingTasks: number;
  completedTasks: number;
  failedTasks: number;
  lastActivity: number;
}
```

---

## 06_STATE_MANAGEMENT.md

### Ephemeral State (In-Memory)

**Task Queue:**
```typescript
// Per-cluster in-memory queue
private taskQueue: Array<{
  request: KrakenDelegationRequest;
  resolve: (result: KrakenDelegationResult) => void;
  reject: (error: Error) => void;
}>;
```

**Agent State:**
```typescript
// Per-agent state
private agents: Map<string, {
  id: string;
  agentType: 'shark' | 'manta';
  busy: boolean;
  currentTaskId?: string;
}>;
```

**Load Tracking:**
```typescript
// Per-cluster load metrics
private load: ClusterLoad = {
  clusterId: string;
  activeTasks: number;
  pendingTasks: number;
  completedTasks: number;
  failedTasks: number;
  lastActivity: number;
};
```

### Persistent State (Hive)

**Patterns Storage:**
```typescript
// Via kraken_hive_remember tool
interface StoredPattern {
  key: string;
  content: string;
  category: 'cluster' | 'session' | 'pattern' | 'decision' | 'failure' | 'breakthrough';
  timestamp: number;
}
```

---

## 07_ERROR_HANDLING.md

### Error Types and Handling

| Error | Detection | Recovery |
|-------|-----------|----------|
| **Python not found** | `spawn` fails with ENOENT | Use `opencode-python3:latest` image |
| **Wrapper script missing** | `spawn` fails with ENOENT | Verify wrappers/ directory exists |
| **Docker socket unavailable** | `docker run` fails | Host configuration error |
| **Container timeout** | Exit code 124 | Return `{ success: false, status: 'timeout' }` |
| **Container OOMKilled** | Exit code 137 | Return `{ success: false, error: 'Out of memory' }` |
| **JSON parse error** | `JSON.parse` throws | Return `{ success: false, error: 'Parse error' }` |
| **Workspace mount error** | Docker volume error | Return `{ success: false, error: 'Volume error' }` |

### Timeout Handling

```typescript
const proc = spawn('python3', [wrapper, ...args]);

// 120 second timeout
const timeout = setTimeout(() => {
  proc.kill('SIGTERM');
  resolve({ success: false, status: 'timeout' });
}, 120000);
```

### Error Result Shape

```typescript
{
  success: false,
  taskId: string,
  clusterId: string,
  agentId: string,
  status: 'failed' | 'timeout',
  error: string,  // Human-readable error
  completedAt: number
}
```

---

## 08_TESTING.md

### Verification Hierarchy

**Level 1: Bundle Size Check (Smoke Test)**
```bash
# These MUST pass or bundle is theatrical
ls -la kraken-agent/dist/index.js   # Must be >190KB
ls -la shark-agent/dist/index.js    # Must be >550KB
ls -la manta-agent/dist/index.js    # Must be >150KB
```

**Level 2: Code Inspection (Anti-Theatrical)**
```bash
# These MUST return 0 results or code is theatrical
grep -r "simulateTaskExecution" src/    # MUST be 0
grep -r "setTimeout.*success.*true" src/  # MUST be 0
grep -r "Full implementation would" src/  # MUST be 0
grep -r "return.*success.*true.*100" src/  # MUST be 0
```

**Level 3: Image Verification**
```bash
# Python3 MUST be available
docker run --rm opencode-python3:latest python3 --version
# Expected: Python 3.12.13

# OpenCode MUST still work
docker run --rm opencode-python3:latest opencode --version
# Expected: 1.4.3
```

**Level 4: Execution Verification (Real Test)**
```bash
# During actual task execution:
docker ps
# MUST show opencode-python3 containers running

# After task:
docker ps -a | grep opencode-python3
# Containers should be removed (--rm flag)
```

**Level 5: Integration Test**
```bash
# Run kraken-self-test.sh
# Should verify:
# - Plugin loads without error
# - Agent appears in agent tab
# - Real Docker spawns occur
# - Actual work is done
```

### Anti-Theatrical Test Checklist

```bash
#!/bin/bash
# ANTI-THEATRICAL TEST SUITE

echo "=== Level 1: Bundle Sizes ==="
KSIZE=$(stat -f%z kraken-agent/dist/index.js 2>/dev/null || stat -c%s kraken-agent/dist/index.js)
SSIZE=$(stat -f%z shark-agent/dist/index.js 2>/dev/null || stat -c%s shark-agent/dist/index.js)
MSIZE=$(stat -f%z manta-agent/dist/index.js 2>/dev/null || stat -c%s manta-agent/dist/index.js)

if [ "$KSIZE" -lt 190000 ]; then echo "FAIL: kraken bundle $KSIZE < 190KB"; exit 1; fi
if [ "$SSIZE" -lt 550000 ]; then echo "FAIL: shark bundle $SSIZE < 550KB"; exit 1; fi
if [ "$MSIZE" -lt 150000 ]; then echo "FAIL: manta bundle $MSIZE < 150KB"; exit 1; fi

echo "=== Level 2: Anti-Theatrical ==="
if grep -rq "simulateTaskExecution" src/; then echo "FAIL: theatrical code found"; exit 1; fi
if grep -rq "Full implementation would" src/; then echo "FAIL: incomplete code found"; exit 1; fi
if grep -rq "setTimeout.*resolve.*success.*true" src/; then echo "FAIL: fake success found"; exit 1; fi

echo "=== Level 3: Image ==="
PYVER=$(docker run --rm opencode-python3:latest python3 --version)
if [ $? -ne 0 ]; then echo "FAIL: Python3 not in image"; exit 1; fi

echo "=== ALL CHECKS PASSED ==="
```

---

## 09_DEPLOYMENT.md

### Build Steps

**1. Build subagent-manager:**
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/subagent-manager
npm install
npm run build
```

**2. Build kraken-agent (with shark + manta):**
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0
npm install
npm run build
```

**3. Verify bundles:**
```bash
ls -la kraken-agent/dist/index.js   # ~199KB
ls -la shark-agent/dist/index.js   # ~569KB
ls -la manta-agent/dist/index.js    # ~158KB
```

**4. Build opencode-python3 image (if needed):**
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/opencode-python3
docker build -t opencode-python3:latest \
              -t opencode:python3-enabled-1.4.3 \
              -t leviathan/opencode:python3-enabled-1.4.3 .
```

### OpenCode Configuration

**~/.config/opencode/opencode.json:**
```json
{
  "plugins": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/subagent-manager/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/shark-agent/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/manta-agent/dist/index.js"
  ]
}
```

**Container configuration:**
```json
{
  "container": {
    "image": "opencode-python3:latest"
  }
}
```

### Ship Package Structure

```
kraken-v2.0-SHIP/
├── dist/
│   ├── kraken-agent/          # ~199KB
│   ├── shark-agent/           # ~569KB
│   ├── manta-agent/          # ~158KB
│   └── subagent-manager/      # ~50KB
├── wrappers/
│   ├── opencode_agent.py      # Python wrapper
│   └── container_pool.py      # Pool manager
├── opencode-python3/
│   └── Dockerfile             # Custom image spec
└── SHIP_REPORT.md
```

---

## 10_MENTAL_MODEL.md

### The Simplest Explanation

**Think of Kraken v2.0 as a restaurant kitchen:**

1. **Customer orders** (user submits task)
2. **Head chef receives** (Kraken orchestrator)
3. **Assigns to specialized cooks** (Shark for heavy tasks, Manta for precision)
4. **Cooks work in separate kitchens** (Docker containers with opencode-python3)
5. **Real food is made** (actual code/files created)
6. **Dish is returned** (real result to customer)

**v2.0-broken was a fake kitchen:**
- Took orders, smiled, said "cooking"
- Waited 100ms
- Said "here's your food"
- But no actual cooking happened

**v2.0-proper is a real kitchen:**
- Takes orders
- Assigns to real cooks
- Real cooking happens
- Real food is served

### The Technical Mental Model

```
User → Kraken → Cluster → Agent → spawn('python3', [wrapper])
                                            ↓
                                   Python wrapper calls
                                            ↓
                                   docker run opencode-python3
                                            ↓
                                   Real container runs
                                            ↓
                                   Real agent works
                                            ↓
                                   Real result returned
```

**No HTTP daemon. No fake delays. No theatrical code.**

### Key Principle to Remember

**If you cannot verify it with `docker ps`, it's not real.**

Real execution = containers running.
Fake execution = no containers, just promises.

---

# ANTI-THEATRICAL CHECKLIST

**Run this before shipping ANY version:**

- [ ] Bundle sizes: kraken >190KB, shark >550KB, manta >150KB
- [ ] `grep -r "simulateTaskExecution" src/` → 0 results
- [ ] `grep -r "setTimeout.*success.*true" src/` → 0 results
- [ ] `grep -r "Full implementation would" src/` → 0 results
- [ ] `grep -r "return.*success.*true.*100" src/` → 0 results
- [ ] Python 3.12 in `opencode-python3` image verified
- [ ] ClusterInstance.executeOnAgent uses `spawn('python3', [...])`
- [ ] No HTTP requests to 127.0.0.1:18086

**Any check failing = THEATRICAL CODE, DO NOT SHIP.**

---

# FILES REFERENCE

| File | Purpose |
|------|---------|
| `/home/leviathan/OPENCODE_WORKSPACE/opencode-python3/Dockerfile` | Custom image build spec |
| `/home/leviathan/OPENCODE_WORKSPACE/opencode-python3/README.md` | Image documentation |
| `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/src/clusters/ClusterInstance.ts` | Must use direct spawn |
| `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/subagent-manager/wrappers/opencode_agent.py` | Real Docker spawn script |
| `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/subagent-manager/wrappers/container_pool.py` | Pool manager |
| `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/KRAKEN_DEBUG_LOGS/13-kraken-catastrophic-failure-20260413_005709/CATASTROPHIC_FAILURE_REPORT.md` | What NOT to repeat |

---

**END OF CONTEXT LIBRARY**

This library contains everything needed to build Kraken v2.0 properly. Any deviation from this architecture risks repeating the v2.0-broken catastrophic failure.
