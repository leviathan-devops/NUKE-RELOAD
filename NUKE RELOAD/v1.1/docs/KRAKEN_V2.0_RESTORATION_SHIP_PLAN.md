# KRAKEN V2.0 — RESTORATION & SHIP PLAN

**Created:** 2026-04-13  
**Based on:** v1.1 (WORKING - 521KB, real Docker execution) + V2.0 specs (catastrophically broken - 52KB, fake timeouts)  
**Goal:** Properly implement V2.0 optimizations without breaking existing working systems

---

## EXECUTIVE SUMMARY

The V2.0 attempt was a **CATASTROPHIC FAILURE** - 90% of code was removed and replaced with theatrical placeholders. The working system is at `/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-test/` (cloned from github master). 

**Plan:** Start from WORKING v1.1, incrementally ADD V2.0 optimizations using the SHARK-BUILD-TEST-VERIFY framework, with proper container TUI testing before ship.

---

## PART 1: FIX THEATRICAL CODE IN V2.0

### 1.1 Identify What Was Destroyed

| Component | v1.1 (WORKING) | v2.0 (BROKEN) |
|-----------|----------------|---------------|
| Docker Execution | Real `subprocess` spawning | Fake 100ms timeouts |
| Container Pool | `container_pool.py` exists | REMOVED |
| Agent Wrappers | `opencode_agent.py` exists | REMOVED |
| Output Verification | Real fs operations | NEVER IMPL |
| Bundle Size | 521 KB | 52 KB |

**Files that must be RESTORED from v1.1:**
```
kraken-agent-v1.1/
├── subagent-manager/           # THIS ENTIRE DIR MISSING IN v2.0
│   ├── src/tools/index.ts      # run_subagent_task, run_parallel_tasks
│   └── wrappers/
│       ├── opencode_agent.py   # Docker container spawner
│       └── container_pool.py   # Pool manager
```

### 1.2 Theatrical Code Locations

**`src/clusters/ClusterInstance.ts:163-183`** — MUST BE REWRITTEN:
```typescript
// BROKEN (v2.0):
private async simulateTaskExecution(...): Promise<KrakenDelegationResult> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true, status: 'completed' }); // FAKE
    }, 100);
  });
}

// CORRECT (v1.1):
private async executeRealTask(...): Promise<KrakenDelegationResult> {
  // Call subagent-manager's run_subagent_task
  // Return real result from Docker container
}
```

### 1.3 Agent Routing Bug Fix

**Current Bug:** `spawn_shark_agent` routes to `manta-gamma-1` instead of Shark

**Root Cause:** ClusterScheduler not filtering by `agentType` when routing

**Fix Location:** `src/factory/ClusterScheduler.ts` or wherever `spawn_shark_agent` is implemented

**Required Behavior:**
```typescript
spawn_shark_agent() → must pick from: shark-alpha-1, shark-alpha-2, shark-beta-1, shark-gamma-1
spawn_manta_agent() → must pick from: manta-alpha-1, manta-beta-1, manta-beta-2, manta-gamma-1, manta-gamma-2
```

---

## PART 2: PROPER CONTAINER TUI TESTING

### 2.1 Why Previous Testing Failed

1. **No container TUI** — Used `opencode run` instead of Docker exec
2. **Host fallback allowed** — When container failed, fell back to host (defeats purpose)
3. **No isolation verification** — Didn't verify plugin doesn't affect host

### 2.2 Container TUI Test Workflow

Based on `DEBUG LOGS/OPENCODE_CONTAINER_TEST_WORKFLOW.md`:

```bash
# 1. Build container with plugin mounted
docker build -t kraken-test -f Dockerfile.test .

# 2. Run interactive TUI session
docker run -it kraken-test

# 3. Inside container, load the plugin config
# (plugin pre-mounted via Dockerfile)

# 4. Execute test commands INSIDE container
# - spawn_cluster_task, spawn_shark_agent, etc.
# - Verify results returned from INSIDE container

# 5. Verify NO host files affected
# - Check no writes to host filesystem
```

### 2.3 Test Cases for Kraken 2.0

| Test | Expected Result | Container Verified |
|------|-----------------|-------------------|
| `spawn_cluster_task` | Task delegated, completed | ✅ |
| `spawn_shark_agent` | Shark agent executes (not Manta) | ✅ |
| `spawn_manta_agent` | Manta agent executes | ✅ |
| `hive_remember` | Pattern stored in container | ✅ |
| `hive_context` | Context retrieved in same container | ✅ |
| Gate progression | PLAN→BUILD→TEST→VERIFY works | ✅ |
| Output verification | fs.existsSync() checkpoint fires | ✅ |

---

## PART 3: V2.0 SHIP PLAN (Non-Regression)

### Phase 0: Baseline Capture (SHARK-PLAN)
- [ ] Document current v1.1 working state completely
- [ ] Capture agent routing bug symptoms
- [ ] Create restore point (git tag v1.1-working)
- [ ] Baseline performance metrics (throughput, error rate)

### Phase 1: Core Restoration (SHARK-BUILD)
- [ ] Restore `subagent-manager/` directory from backup/history
- [ ] Restore Docker wrapper scripts (`opencode_agent.py`, `container_pool.py`)
- [ ] Fix `ClusterInstance.ts` to use REAL execution, not simulated
- [ ] Fix agent routing bug in ClusterScheduler
- [ ] Verify bundle size returns to ~500KB

### Phase 2: V2.0 Optimization (SHARK-BUILD)
- [ ] Add Two-Layer Firewall (Tool + Message enforcement)
- [ ] Add Mechanical Output Verification (fs.existsSync() checkpoints)
- [ ] Add Structured Override Commands (typed schema)
- [ ] Add Explicit Gate Criteria per brain
- [ ] DO NOT REMOVE any working v1.1 functionality

### Phase 3: Container TUI Test (SHARK-TEST)
- [ ] Build test container with plugin mounted
- [ ] Run `docker exec -it` for interactive TUI
- [ ] Execute all spawn_* tools, verify real execution
- [ ] Verify Hive Mind works inside container
- [ ] Verify no host filesystem pollution
- [ ] **Use SHARK-BUILD-TEST-VERIFY loop until clean**

### Phase 4: Regression Prevention (SHARK-VERIFY)
- [ ] Replay all v1.1 test scenarios
- [ ] Compare error rates: v1.1 vs v2.0
- [ ] Compare throughput: v1.1 vs v2.0  
- [ ] Verify Shark/Manta agents still work independently
- [ ] Verify no plugin conflicts with Spider/Hermes

### Phase 5: Ship (SHARK-SHIP)
- [ ] Ship gate requires:
  - All test cases pass in container TUI
  - No regression in existing functionality
  - Error rate ≤ v1.1 baseline
  - Throughput ≥ v1.1 baseline
  - V2.0 optimizations functional
  - Evidence collected for all gate criteria

---

## PART 4: ARCHITECTURE CONSTRAINTS (MUST NOT VIOLATE)

From `DUAL_PLUGIN_SYSTEM.md`:

### Dual Plugin Architecture
1. **kraken-agent** handles orchestration (task queuing, cluster scheduling, Hive)
2. **opencode-subagent-manager** handles Docker execution (container spawning)

**Critical:** These are SEPARATE plugins. v2.0 MUST NOT merge them incorrectly.

### Tool Separation
```
Kraken Tools (orchestration):
  - spawn_cluster_task, spawn_shark_agent, spawn_manta_agent
  - anchor_cluster, kraken-status, kraken-gate, kraken-hive-*
  
Subagent Manager Tools (execution):
  - run_subagent_task, run_parallel_tasks, cleanup_subagents
```

### Data Flow
```
User Request → Kraken (orchestration) → Subagent Manager (Docker) → Container Agent
```

---

## PART 5: KEY FAILURES TO AVOID

From `DERAILMENT_FORENSIC_ANALYSIS.md`:

### Failure 1: Theatrical Completion
**Problem:** v2.0 returned `{success: true}` after 100ms without real work
**Fix:** Every `complete` must have fs.existsSync() evidence

### Failure 2: Host Fallback
**Problem:** When container testing failed, fell back to host
**Fix:** Container TUI test MUST run inside Docker, no host fallback path

### Failure 3: Wrong Agent Type Routing
**Problem:** spawn_shark_agent spawned manta agents
**Fix:** ClusterScheduler must filter by agentType before assignment

### Failure 4: Mock/Stub Substitution
**Problem:** Complex features replaced with placeholders
**Fix:** If Docker execution can't be verified, FAIL the build - don't stub it

---

## SUCCESS METRICS

| Metric | v1.1 Baseline | v2.0 Target |
|--------|---------------|-------------|
| Bundle Size | 521 KB | >500 KB (no regression) |
| Error Rate | 0.0% | 0.0% (no regression) |
| Throughput | 76+ tasks/sec | >70 tasks/sec |
| Agent Routing | BROKEN | 100% correct type |
| Docker Execution | REAL | REAL (not simulated) |
| Output Verification | Trust-based | **fs.existsSync() enforced** |

---

## IMMEDIATE NEXT ACTIONS

1. **Read `src/clusters/ClusterInstance.ts`** in the working kraken-agent-test to understand current execution flow
2. **Read `subagent-manager/`** structure if exists in v1.1 backup
3. **Fix agent routing bug** in ClusterScheduler.ts
4. **Build test container** with proper Dockerfile for TUI testing
5. **Run container TUI test** using `docker exec -it` (NOT `opencode run`)

---

**Evidence Required for Ship:**
- Container TUI session log showing all tools working
- No host filesystem modification evidence
- fs.existsSync() checkpoint logs
- Agent type routing verification (Shark = Shark, Manta = Manta)
