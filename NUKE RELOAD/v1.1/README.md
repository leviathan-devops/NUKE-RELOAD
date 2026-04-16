# KRAKEN AGENT v1.1 — SHIP PACKAGE

**Version:** 1.1  
**Date:** 2026-04-13  
**Status:** READY TO SHIP  
**Fixes:** Agent routing bug (spawn_shark_agent → shark agents, spawn_manta_agent → manta agents)

---

## WHAT'S IN THIS PACKAGE

```
SHIP_KRAKEN_V1.1/
├── README.md              ← This file
├── CHANGELOG.md           ← Detailed changes
├── INSTALL.md             ← Installation instructions
├── build/
│   ├── index.js           ← Main kraken-agent bundle (569KB)
│   └── CHECKSUMS.md5      ← MD5 checksums for verification
├── src/                   ← Complete TypeScript source
│   ├── index.ts           ← Main entry point
│   ├── clusters/          ← Cluster management
│   ├── factory/           ← Async delegation, scheduling
│   ├── hooks/             ← v4.1 hook infrastructure
│   ├── kraken-hive/       ← Internal Hive Mind engine
│   └── tools/             ← Kraken tools (orchestrator)
├── shark-agent-src/       ← Shark agent source (if present)
├── docs/                  ← System status reports
├── debug/                 ← Debug logs and forensics
├── checkpoints/           ← Session restore points
└── package.json           ← Dependencies
```

---

## CRITICAL FIX IN v1.1

### Bug Fixed: Agent Type Routing

**Previous Behavior (BROKEN):**
```
spawn_shark_agent → manta-gamma-1 (WRONG TYPE)
spawn_manta_agent → manta-gamma-1 (correct type but always gamma)
```

**Current Behavior (FIXED):**
```
spawn_shark_agent → shark-alpha-1, shark-beta-1, OR shark-gamma-1 (correct SHARK type)
spawn_manta_agent → manta-*-* agents (correct MANTA type)
```

### Files Modified

| File | Change |
|------|--------|
| `src/clusters/ClusterInstance.ts` | Added `agentType` filtering in `getAvailableAgents()` |
| `src/clusters/ClusterInstance.ts` | Rewrote `processLoop()` to filter by `context.agentType` |

---

## QUICK INSTALL

```bash
# 1. Copy build to your plugins directory
cp build/index.js /path/to/your/plugins/kraken-agent/dist/

# 2. Update opencode.json
# Add this plugin AFTER opencode-subagent-manager:
{
  "plugin": [
    "file:///path/to/opencode-subagent-manager/dist/index.js",
    "file:///path/to/kraken-agent/dist/index.js"
  ]
}

# 3. Restart OpenCode
opencode
```

---

## BUILD FROM SOURCE

```bash
cd /path/to/kraken-agent
bun install
bun run build
bun run build:shark  # If using shark subagents
```

---

## VERIFICATION

```bash
# Verify checksum
md5sum -c build/CHECKSUMS.md5

# Test in container (requires opencode-test:1.4.3 image)
docker run --rm \
  --entrypoint /bin/bash \
  -v /tmp/test-config:/root/.config/opencode \
  opencode-test:1.4.3 \
  -c "cd /root/.config/opencode && /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode run 'get_cluster_status' -m opencode/big-pickle"
```

---

## CHECKPOINTS

Restore from checkpoint:
```bash
load_session <checkpoint_id>
# Or
fork_session <snapshot_id>
```

Latest checkpoint: `cp_1776098282718.json`

---

## TESTED FUNCTIONALITY

| Tool | Status | Notes |
|------|--------|-------|
| `get_cluster_status` | ✅ Verified | Returns 3 clusters, 9 agents |
| `spawn_shark_agent` | ✅ Verified | Routes to shark agents |
| `spawn_manta_agent` | ✅ Verified | Routes to manta agents |
| `spawn_cluster_task` | ✅ Verified | Routes to correct cluster |
| `kraken_hive_remember` | ✅ Verified | Stores patterns |
| `kraken_hive_search` | ✅ Verified | Finds stored patterns |
| `shark-status` | ✅ Verified | Shows shark agent status |
| `hive_status` | ✅ Verified | Shows Hive Mind status |

---

## KNOWN ISSUES

| Issue | Impact | Workaround |
|-------|--------|------------|
| OpenViking not running | Non-blocking | Uses local fallback |
| Task timeouts (>120s) | Non-blocking | Tasks complete but may timeout |
| Resync queue stuck | Non-blocking | Old items cleared on startup |

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────┐
│              KRAKEN ORCHESTRATOR                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐     │
│  │ Kraken   │  │ Async    │  │ Cluster      │     │
│  │ Architect│──│ Delegation│──│ Scheduler    │     │
│  └──────────┘  └──────────┘  └──────────────┘     │
└────────────────────────┬──────────────────────────┘
                         │
     ┌───────────────────┼───────────────────┐
     ▼                   ▼                   ▼
┌───────────┐     ┌───────────┐     ┌───────────┐
│  ALPHA    │     │   BETA    │     │  GAMMA    │
│  CLUSTER  │     │  CLUSTER  │     │  CLUSTER  │
│ Shark×2   │     │Shark×1    │     │ Shark×1   │
│ Manta×1   │     │ Manta×2   │     │ Manta×2   │
└───────────┘     └───────────┘     └───────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   KRAKEN-HIVE MIND   │
              │  (Local filesystem)  │
              └─────────────────────┘
```

---

## CREDITS

- **Based on:** kraken-agent v1.0 (github master)
- **Fix applied:** 2026-04-13
- **Container testing:** Using opencode-test:1.4.3 image
- **Model used:** opencode/big-pickle (free model for container testing)
