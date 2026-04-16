# KRAKEN V1.2 — ARCHITECTURE

**Version:** 1.2.0
**Classification:** Architecture Documentation

---

## OVERVIEW

Kraken v1.2 is a multi-brain orchestrator built on top of the NUKE RELOAD v1.1 execution layer. It implements a three-brain architecture for task planning, execution, and system management.

---

## THREE-BRAIN ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                      KRAKEN ORCHESTRATOR                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     │
│   │  PLANNING   │────▶│  EXECUTION  │◀────│   SYSTEM    │     │
│   │   BRAIN     │     │   BRAIN     │     │   BRAIN     │     │
│   │             │     │             │     │             │     │
│   │ owns:       │     │ owns:       │     │ owns:       │     │
│   │ planning-   │     │ execution-  │     │ workflow-   │     │
│   │ state       │     │ state       │     │ state       │     │
│   │ context-    │     │ quality-    │     │ security-   │     │
│   │ bridge      │     │ state       │     │ state       │     │
│   └─────────────┘     └─────────────┘     └─────────────┘     │
│                                                                 │
│                         ┌───────────────┐                       │
│                         │    BRAIN      │                       │
│                         │   MESSENGER   │                       │
│                         │ (Priority Msg)│                       │
│                         └───────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXECUTION LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              SUBAGENT MANAGER                            │   │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐                │   │
│   │  │ ALPHA   │  │  BETA   │  │ GAMMA   │                │   │
│   │  │(steamroll)│ │(precision)│ │(testing) │                │   │
│   │  └─────────┘  └─────────┘  └─────────┘                │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                 │
│                              ▼                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │         PYTHON WRAPPERS (executeOnAgent)                │   │
│   │   opencode_agent.py  │  container_pool.py               │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                 │
│                              ▼                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    DOCKER                               │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## BRAIN DETAILS

### PLANNING BRAIN

**File:** `src/brains/planning/planning-brain.ts`

**Responsibilities:**
- Load T2 patterns
- Generate T1 tasks
- Decompose complex tasks
- Manage planning state

**State Ownership:**
- `planning-state`
- `context-bridge`

**Key Functions:**
- `loadT2Master()`
- `generateT1Tasks()`
- `decomposeTask()`

---

### EXECUTION BRAIN

**File:** `src/brains/execution/execution-brain.ts`

**Responsibilities:**
- Task supervision
- Output verification
- Override commands
- Quality assurance

**State Ownership:**
- `execution-state`
- `quality-state`

**Key Functions:**
- `superviseTask()`
- `verifyOutput()`
- `issueOverride()`

---

### SYSTEM BRAIN

**File:** `src/brains/system/system-brain.ts`

**Responsibilities:**
- Workflow tracking
- Security enforcement
- Gate management
- State coordination

**State Ownership:**
- `workflow-state`
- `security-state`

**Key Functions:**
- `trackWorkflow()`
- `enforceSecurity()`
- `evaluateGate()`

---

## BRAIN MESSENGER

**File:** `src/shared/brain-messenger.ts`

**Purpose:** Priority-based messaging between brains

**Message Types:**
- `context-inject` - Context injection to brain
- `gate-failure` - Gate evaluation failed
- `checkpoint` - Checkpoint reached
- `override` - Override command
- `sync` - State synchronization

**Override Actions:**
- `ABORT` - Abort current task
- `CLAIM_COMPLETE` - Claim task complete
- `REASSIGN` - Reassign to another brain
- `RETRIEVE_OUTPUTS` - Get task outputs
- `RETRY` - Retry failed task
- `SUSPEND` - Suspend task
- `RESUME` - Resume suspended task

---

## DOMAIN OWNERSHIP

**File:** `src/shared/domain-ownership.ts`

**Purpose:** Prevent brain cross-contamination

| Domain | Allowed Writers |
|--------|-----------------|
| `planning-state` | Planning, System |
| `execution-state` | Execution, System |
| `workflow-state` | System, Execution |
| `security-state` | System only |
| `quality-state` | Execution, System |
| `thinking-state` | Reasoning |
| `context-bridge` | Planning, System |

---

## STATE STORE

**File:** `src/shared/state-store.ts`

**Purpose:** Session-scoped state management

**Key Methods:**
- `get(domain, key)` - Read state
- `set(domain, key, value, ownedBy)` - Write with ownership
- `canModify(domain, brain)` - Check permissions
- `cleanup()` - Clear all state

---

## EXECUTION LAYER

### Subagent Manager

Manages cluster instances (Alpha, Beta, Gamma) and delegates tasks.

### Python Wrappers

**opencode_agent.py** - Main entry point for agent execution
**container_pool.py** - Container lifecycle management

### executeOnAgent vs simulateTaskExecution

**CRITICAL:** This build uses `executeOnAgent` for REAL Docker spawning.

`sanitizeTaskDelegate()` internally calls `executeOnAgent()` which:
1. Spawns Docker container via Python wrapper
2. Runs agent in isolated environment
3. Returns real results

---

## CLUSTERS

### Alpha Cluster
- Type: Steamroll
- Purpose: Aggressive, high-throughput tasks
- Brain affinity: Execution

### Beta Cluster
- Type: Precision
- Purpose: Careful, methodical tasks
- Brain affinity: Planning

### Gamma Cluster
- Type: Testing
- Purpose: Verification and validation
- Brain affinity: System

---

## TOOLS

### V1.2 Monitoring Tools

**kraken_brain_status**
- Shows initialization state of all 3 brains
- Shows owned domains for each brain

**kraken_message_status**
- Shows inter-brain message queue
- Recent messages with timestamps

---

## ALIGNMENT BIBLE RULES

This build follows strict rules to prevent failures:

1. **executeOnAgent NOT simulateTaskExecution** - Real Docker spawning
2. **Hooks are async functions NOT arrays** - Proper async handling
3. **State cleanup on session.ended** - No memory leaks
4. **Container testing MANDATORY** - Verify before deploy
5. **Domain ownership enforced** - No cross-contamination

---

**END ARCHITECTURE**