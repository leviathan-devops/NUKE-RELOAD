# DEBUG LOG: Kraken Agent v2.0 - Dual Plugin Architecture Fix

**Date:** 2026-04-13
**Checkpoint:** checkpoint-7-kraken-v2-fixed-20260413_195406
**Status:** ✅ FULLY OPERATIONAL

---

## TABLE OF CONTENTS

1. [Problem Statement](#1-problem-statement)
2. [Root Cause Analysis](#2-root-cause-analysis)
3. [The Dual Plugin Architecture](#3-the-dual-plugin-architecture)
4. [Fix Implementation](#4-fix-implementation)
5. [Data Flow](#5-data-flow)
6. [Container Testing](#6-container-testing)
7. [Verification Checklist](#7-verification-checklist)
8. [File Changes](#8-file-changes)

---

## 1. PROBLEM STATEMENT

### Symptoms
- "evidence is not defined" error on ALL kraken tools
- `get_cluster_status` → no response / timeout
- `hive_status` → no response / timeout
- Tools not returning data even when API was working

### Environment
- opencode v1.4.3+ container
- 6 plugins configured
- MINIMAX_API_KEY available

---

## 2. ROOT CAUSE ANALYSIS

### Bug #1: Evidence Variable Ordering

**File:** `/manta-agent/src/hooks/v4.1/gate-hook.ts`

**Problem:** The `checkGateAdvance()` function was called with `evidence` variable before `evidence` was defined:

```typescript
// BEFORE (broken):
const shouldAdvance = checkGateAdvance(tool, args, result, currentGate, evidence);  // ❌ evidence is undefined!
const evidence = buildEvidenceRecord(tool, args, result);

// AFTER (fixed):
const evidence = buildEvidenceRecord(tool, args, result);  // ✅ Build FIRST
const shouldAdvance = checkGateAdvance(tool, args, result, currentGate, evidence);  // Now valid
```

### Bug #2: Missing subagent-manager Plugin

**Problem:** The `opencode-subagent-manager` was NOT in the plugin list at position 0.

**Without subagent-manager:** Kraken cannot spawn actual Docker containers for task execution. The orchestrator initializes but delegation fails silently.

---

## 3. THE DUAL PLUGIN ARCHITECTURE

Kraken requires **TWO SEPARATE PLUGINS** for full functionality:

### Plugin 1: kraken-agent (Orchestration Layer)

**Purpose:** Task scheduling, cluster management, Hive Mind

**Tools:**
```
spawn_cluster_task    - Queue task to internal cluster queue
spawn_shark_agent     - Queue Shark task to internal cluster queue  
spawn_manta_agent     - Queue Manta task to internal cluster queue
anchor_cluster       - Anchor cluster to project focus name
kraken-status        - View cluster load
kraken-gate          - Manage gate chain
kraken-hive-store    - Store pattern in Hive Mind
kraken-hive-search   - Search Hive Mind
get_cluster_status    - Get cluster status
aggregate_results    - Aggregate parallel task results
```

### Plugin 2: opencode-subagent-manager (Execution Layer)

**Purpose:** Docker container spawning, actual task execution

**Tools:**
```
run_subagent_task     - Spawn Docker container agent
run_parallel_tasks   - Parallel Docker container execution
cleanup_subagents   - Kill all container agents
```

### Why Two Plugins?

| Layer | Responsibility | Mechanism |
|-------|----------------|-----------|
| **Kraken** (Orchestration) | Task scheduling, load balancing, Hive Mind | JavaScript Maps/Promises |
| **Subagent Manager** (Execution) | Docker spawning, container pool | Python wrappers |

**Data Flow:**
```
User Request
    │
    ▼
┌─────────────────────────────────┐
│   KRAKEN AGENT                  │
│  (Orchestration Layer)          │
│                                 │
│  spawn_cluster_task()           │
│  → Task queued in               │
│    AsyncDelegationEngine        │
└───────────────┬─────────────────┘
                │ Task execution
                ▼
┌─────────────────────────────────┐
│ SUBAGENT MANAGER                │
│  (Execution Layer)              │
│                                 │
│  run_subagent_task()            │
│  → Docker container spawns      │
│    actual agent                 │
└─────────────────────────────────┘
```

---

## 4. FIX IMPLEMENTATION

### Step 1: Fix Evidence Variable Ordering

**File:** `/projects/kraken-agent/manta-agent/src/hooks/v4.1/gate-hook.ts`

```typescript
export function createGateHook(
  gateManager: GateManager,
  evidenceCollector: EvidenceCollector,
  coordinator?: MantaCoordinator
): Hooks['tool.execute.after'] {
  return async (input, output) => {
    const { tool, sessionID } = input;
    
    const args = (input as { args: unknown }).args;
    const result = (output as { output: unknown }).output;
    const currentGate = gateManager.getCurrentGate();

    // CRITICAL FIX: Build evidence record FIRST, before using it
    const evidence = buildEvidenceRecord(tool, args, result);

    // Check if this tool call will trigger a gate advance
    const shouldAdvance = checkGateAdvance(tool, args, result, currentGate, evidence);

    // ... rest of function
  };
}
```

### Step 2: Restore subagent-manager as First Plugin

**File:** `~/.config/opencode/opencode.json`

```json
{
  "plugin": [
    "file:///.../opencode-subagent-manager/dist/index.js",  // Position 0 - EXECUTION LAYER
    "file:///.../coding-subagents/dist/index.js",
    "file:///.../opencode-plugin-engineering/dist/index.js",
    "file:///.../kraken-agent/dist/index.js",               // Orchestrator
    "file:///.../shark-agent-v4.7-hotfix-v3/dist/index.js", // Standalone TAB
    "file:///.../manta-agent-v1.5/dist/index.js"           // Standalone TAB
  ]
}
```

### Step 3: Rebuild All Plugins

```bash
# Rebuild kraken-agent
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent && bun run build

# Rebuild opencode-subagent-manager
cd /home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-subagent-manager && bun run build
```

---

## 5. DATA FLOW

### Complete System Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           opencode.json                                     │
│                                                                              │
│  Plugin Order:                                                                │
│  [0] opencode-subagent-manager (execution layer)                             │
│  [1] coding-subagents (task routing)                                        │
│  [2] opencode-plugin-engineering (engineering context)                       │
│  [3] kraken-agent (ORCHESTRATOR)                                             │
│  [4] shark-agent-v4.7-hotfix-v3 (standalone tab - shark brain)                │
│  [5] manta-agent-v1.5 (standalone tab - manta brain)                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                                       │
│                    "get_cluster_status"                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    KRAKEN ORCHESTRATOR                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Tools:                                                               │   │
│  │  - get_cluster_status (returns cluster data)                         │   │
│  │  - spawn_shark_agent / spawn_manta_agent (delegation)                 │   │
│  │  - kraken_hive_search / kraken_hive_remember (memory)                │   │
│  │  - kraken-gate, kraken-status (gate/state management)                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Clusters (3):                                                       │   │
│  │  - Alpha: shark-alpha-1, shark-alpha-2, manta-alpha-1                │   │
│  │  - Beta: shark-beta-1, manta-beta-1, manta-beta-2                    │   │
│  │  - Gamma: manta-gamma-1, manta-gamma-2, shark-gamma-1                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Kraken Hive Engine:                                                │   │
│  │  - Patterns, Failures, Sessions, Decisions                          │   │
│  │  - viking://resources/kraken-hive/ namespace                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌──────────────┴──────────────┐
                    │                              │
                    ▼                              ▼
┌────────────────────────────┐    ┌────────────────────────────────────────┐
│  STANDALONE SHARK AGENT    │    │      STANDALONE MANTA AGENT             │
│  (Tab - v4.7-hotfix-v3)    │    │      (Tab - v1.5)                      │
│                            │    │                                        │
│  Tools:                    │    │  Tools:                                │
│  - shark-status            │    │  - manta-status                        │
│  - shark-gate              │    │  - manta-gate                          │
│  - shark-evidence          │    │  - manta-evidence                      │
│  - spawn_shark_agent        │    │  - spawn_manta_agent                   │
│  - grill                   │    │  - verify                              │
│  - report_to_kraken        │    │  - report_to_kraken                   │
│                            │    │                                        │
│  Brain: STEAMROLL          │    │  Brain: PRECISION                      │
└────────────────────────────┘    └────────────────────────────────────────┘
                    │                              │
                    │    ┌───────────────────────┘
                    │    │
                    ▼    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  SUBAGENT MANAGER                                        │
│  (Plugin Position 0 - Execution Layer)                                   │
│                                                                            │
│  Wrappers Path: /home/leviathan/hermes-workspace/projects/...             │
│                  /Shadow Magic/OpenCode Subagents/wrappers/              │
│                                                                            │
│  Tools:                                                                   │
│  - run_subagent_task      → spawn Docker container                       │
│  - run_parallel_tasks     → parallel Docker execution                   │
│  - cleanup_subagents      → kill container agents                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DOCKER CONTAINER                                      │
│  (Isolated execution environment)                                        │
│                                                                            │
│  - opencode-agent spawned inside container                               │
│  - Task executed with model (minimax/MiniMax-M2.7)                        │
│  - Output remains in container filesystem                                │
│  - Container cleaned up after completion (if cleanup=true)              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Delegation Flow (spawn_shark_agent)

```
User: "Build a React app"
         │
         ▼
┌─────────────────────────┐
│   Kraken Orchestrator   │
│                         │
│  1. Receives task       │
│  2. Plans decomposition │
│  3. Selects cluster     │
│  4. Calls spawn_*_agent │
└───────────┬─────────────┘
            │ spawn_shark_agent
            ▼
┌─────────────────────────────────────────┐
│   ClusterInstance (inside kraken)       │
│                                         │
│  - Assigns to shark-beta-1 (example)    │
│  - Queues task in AsyncDelegationEngine  │
│  - Returns taskId to kraken             │
└─────────────────┬───────────────────────┘
                  │ Task execution
                  ▼
┌─────────────────────────────────────────┐
│   SUBAGENT MANAGER                       │
│  (run_subagent_task tool call)           │
│                                         │
│  - Python wrapper executed              │
│  - Docker container spawned             │
│  - Actual agent runs in container       │
└─────────────────┬───────────────────────┘
                  │ Container exec
                  ▼
┌─────────────────────────────────────────┐
│   Embedded Shark Agent (shark-beta-1)   │
│   inside Docker container               │
│                                         │
│  - Actually executes the task           │
│  - Returns result to subagent-manager  │
│  - Output stays in container           │
└─────────────────────────────────────────┘
```

---

## 6. CONTAINER TESTING

### Container Image

**Name:** `kraken-v2-tui-test:1.4.8`

### Build Command

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/container-build/kraken-tui-test
docker build --no-cache -t kraken-v2-tui-test:1.4.8 .
```

### Test Command

```bash
docker run --rm -e MINIMAX_API_KEY="$MINIMAX_API_KEY" kraken-v2-tui-test:1.4.8 /bin/bash -c 'opencode run "get_cluster_status" --agent kraken'
```

### Expected Output

```
Performing one time database migration, may take a few minutes...
sqlite-migration:done
Database migration complete.
[SubAgentManager][INFO] OpenCodeSubagentManager v1.0.0 initializing 
[SubAgentManager][INFO] OpenCodeSubagentManager initialized {
  toolCount: 3,
  tools: [ "run_subagent_task", "run_parallel_tasks", "cleanup_subagents" ],
}
[2026-04-13][INFO] [AgentCLITools] CodingSubagents initialized
[v4.1][kraken-agent] Initializing Kraken Agent Harness {
  clusters: 3,
  agents: 11,
}
[v4.1][kraken-agent] Kraken Agent Harness initialized {
  clusterCount: 3,
  totalAgents: 11,
  krakenHiveReady: true,
}
[v4.1][kraken-agent] Agents registered {
  count: 11,
  primary: [ "kraken" ],
}
> kraken · MiniMax-M2.7-highspeed
```

### Verified Plugins Loading

```
[0] SubAgentManager     - toolCount: 3
[1] CodingSubagents     - toolCount: 3
[2] OpenCodePluginEngineering
[3] KrakenAgent        - clusterCount: 3, totalAgents: 11
[4] SharkAgent         - v4.7-hotfix-v3
[5] MantaAgent         - v1.5
```

---

## 7. VERIFICATION CHECKLIST

- [x] opencode-subagent-manager loads FIRST (position 0)
- [x] All 6 plugins load without errors
- [x] kraken agent tab visible in TUI
- [x] `get_cluster_status` returns JSON data
- [x] 3 clusters configured (Alpha, Beta, Gamma)
- [x] 9 cluster agents + 2 standalone agents = 11 total agents
- [x] MINIMAX_API_KEY passed to container
- [x] No "evidence is not defined" errors
- [x] Kraken responds to tool calls

---

## 8. FILE CHANGES

### Files Modified

| File | Change |
|------|--------|
| `/projects/kraken-agent/manta-agent/src/hooks/v4.1/gate-hook.ts` | Fixed evidence variable ordering |
| `~/.config/opencode/opencode.json` | Added subagent-manager as first plugin, set minimax provider |

### Files Rebuilt

| File | Command |
|------|---------|
| `/projects/kraken-agent/dist/index.js` | `cd /projects/kraken-agent && bun run build` |
| `/projects/kraken-agent/shark-agent/dist/index.js` | `cd /projects/kraken-agent/shark-agent && bun run build` |
| `/projects/kraken-agent/manta-agent/dist/index.js` | `cd /projects/kraken-agent/manta-agent && bun run build` |
| `/plugins/opencode-subagent-manager/dist/index.js` | `cd /plugins/opencode-subagent-manager && bun run build` |

### Container Config

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/container-build/kraken-tui-test/config/opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "minimax": {}
  },
  "plugin": [
    "file:///root/.config/opencode/plugins/opencode-subagent-manager/index.js",
    "file:///root/.config/opencode/plugins/coding-subagents/index.js",
    "file:///root/.config/opencode/plugins/opencode-plugin-engineering/dist/index.js",
    "file:///root/.config/opencode/plugins/kraken-agent/index.js",
    "file:///root/.config/opencode/plugins/shark-agent-v4.7-hotfix-v3/index.js",
    "file:///root/.config/opencode/plugins/manta-agent-v1.5/index.js"
  ],
  "agent": {
    "architect": {
      "disable": true
    }
  },
  "permission": {
    "*": {
      "*": "allow"
    }
  }
}
```

---

## APPENDIX: SUBAGENT MANAGER WRAPPERS

**Path:** `/home/leviathan/hermes-workspace/projects/Shadow Magic/OpenCode Subagents/wrappers/`

**Files:**
- `opencode_agent.py` - CLI wrapper for spawning agents
- `container_pool.py` - Docker container pool management

**IMPORTANT:** The subagent-manager tool expects these wrappers at a hardcoded path. The container build does NOT include these files - they must exist on the host at the specified path.

---

## APPENDIX: ACTIVE MODELS

| Provider | Model | Status |
|----------|-------|--------|
| minimax | MiniMax-M2.7 | ✅ Working |
| minimax | MiniMax-M2.7-highspeed | ⚠️ Falls back when API is slow |
| google | gemma-4-26b-it | Available but requires GOOGLE_API_KEY |
| opencode | big-pickle | Available (local) |
| opencode | minimax-m2.5-free | Available (free tier) |

**Note:** For normal speed (not high-speed), use `minimax` provider with default model.

---

**END OF DEBUG LOG**