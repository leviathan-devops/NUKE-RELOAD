# CHANGELOG — KRAKEN AGENT v1.1

## v1.1.1-deploy — 2026-04-13 (Deployment Incident + Resolution)

### DEPLOYMENT INCIDENT: Plugin Silent Load Failure

Two separate deployment attempts both failed before final resolution. Documented here as permanent record.

**Attempt 1 (incomplete):** v1.1 build copied to `~/.config/opencode/plugins/kraken-agent-v1.1/dist/` but `opencode.json` never updated. Plugin was not loaded at all.

**Attempt 2 (session crash):** `opencode.json` updated to point at SHIP package build dir using a path with spaces:
```
Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v1.1/...
```
`file://` URIs with unencoded spaces cause silent plugin skip. Kraken disappeared from tab toggle. Session crashed.

**Root causes discovered via `opencode debug config --log-level DEBUG`:**
1. `file://` URI spaces → silent skip (no error logged at default log level)
2. Bare dist dir without `node_modules` → `Cannot find module '@opencode-ai/plugin'`

**Resolution:** Deploy to `~/.config/opencode/plugins/kraken-agent-v1.1/` (full package with `node_modules`), reference that path in `opencode.json`. Container-verified before local apply.

See `debug/DEBUG_LOG_v1.1_DEPLOYMENT.md` and `INSTALL.md` for full mechanical steps.

---

## v1.1 — 2026-04-13

### CRITICAL FIX: Agent Type Routing

**Problem:** `spawn_shark_agent` and `spawn_manta_agent` were not routing to the correct agent types.

**Root Cause:** `ClusterInstance.getAvailableAgents()` returned all available agents without filtering by `agentType`. When a shark task was queued, any available agent (including mantas) could be assigned.

**Fix Applied:**

#### File: `src/clusters/ClusterInstance.ts`

**Change 1:** Added `agentType` parameter to `getAvailableAgents()`:
```typescript
// BEFORE:
private getAvailableAgents(): ClusterAgentInstance[] {
  const available: ClusterAgentInstance[] = [];
  for (const agent of this.agents.values()) {
    if (!agent.busy) {
      available.push(agent);
    }
  }
  return available;
}

// AFTER:
private getAvailableAgents(agentType?: string): ClusterAgentInstance[] {
  const available: ClusterAgentInstance[] = [];
  for (const agent of this.agents.values()) {
    if (!agent.busy) {
      if (agentType === undefined || agent.agentType === agentType) {
        available.push(agent);
      }
    }
  }
  return available;
}
```

**Change 2:** Rewrote `processLoop()` to extract `agentType` from task context:
```typescript
// BEFORE: Assigned any available agent
const availableAgents = this.getAvailableAgents();

// AFTER: Filters by required agent type from task context
const requiredAgentType = task.request.context?.agentType as string | undefined;
const availableAgents = this.getAvailableAgents(requiredAgentType);
```

### Build Artifacts

| File | Size | Description |
|------|------|-------------|
| `dist/index.js` | 569KB | Main kraken-agent bundle |
| `shark-agent/dist/index.js` | 584KB | Shark subagent bundle |

### Verification Results

| Test | Before Fix | After Fix |
|------|-----------|-----------|
| `spawn_shark_agent` → Shark agent | ❌ manta-gamma-1 | ✅ shark-alpha-1 |
| `spawn_shark_agent` → Shark agent | ❌ manta-gamma-1 | ✅ shark-alpha-1 |
| `spawn_manta_agent` → Manta agent | ⚠️ manta only (no filter) | ✅ manta-gamma-1 |

---

## v1.0 — 2026-04-12 (Initial Release)

### Features

- **3 Async Clusters**: Alpha (build), Beta (balanced), Gamma (debug)
- **9 Agents**: 4 Sharks, 5 Mantas
- **AsyncDelegationEngine**: Priority-based task queuing
- **ClusterScheduler**: Focus anchoring and load balancing
- **Kraken-Hive Mind**: Local filesystem-based persistent memory
- **Tool Separation**: Kraken tools (orchestrator) vs Subagent Manager (execution)

### Known Issues (v1.0)

- ❌ Agent routing bug (FIXED in v1.1)
- ⚠️ OpenViking not connected (uses local fallback)
- ⚠️ Resync queue stuck (auto-clears on startup)

---

## Test Commands Used

```bash
# Container test workflow
docker run --rm \
  --entrypoint /bin/bash \
  -v /tmp/test-config:/root/.config/opencode \
  opencode-test:1.4.3 \
  -c "cd /root/.config/opencode && /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode run 'COMMAND' -m opencode/big-pickle"

# Spawn tests
spawn_shark_agent task="Test" → Expected: shark-*-1, Result: shark-alpha-1 ✅
spawn_manta_agent task="Test" → Expected: manta-*-*, Result: manta-gamma-1 ✅
```

---

## Checkpoints

| ID | Date | Description |
|----|------|-------------|
| `cp_1776098282718` | 2026-04-13 | After Hive verification |
| `cp_1776097783497` | 2026-04-13 | After file consolidation |
| `cp_1776095588913` | 2026-04-13 | After initial tests |

---

## Files Changed Summary

```
src/clusters/ClusterInstance.ts | +20/-15 lines
```

**Total changes:** ~35 lines modified
