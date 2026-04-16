# SMK (Shark-Manta-Kraken) Reload Script

**Purpose:** Fully restore the Shark-Manta-Kraken architecture to working state
**Date:** 2026-04-13
**Time to Execute:** ~5 minutes

---

## PREFLIGHT CHECK

Before running, verify these paths exist:

```bash
ls /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/dist/index.js
ls /home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/dist/index.js
ls /home/leviathan/OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js
ls /home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-plugin-engineering/dist/index.js
ls /home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/dist/index.js
ls /home/leviathan/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/dist/index.js
```

If any `dist/index.js` is missing, rebuild with:
```bash
cd /path/to/project && bun run build
```

---

## STEP 1: WRITE OPENCODE CONFIG

**Target:** `~/.config/opencode/opencode.json`

```bash
cat > /home/leviathan/.config/opencode/opencode.json << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "minimax": {}
  },
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-plugin-engineering/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/dist/index.js"
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
EOF
```

**Critical:** Plugin order matters! subagent-manager MUST be position 0.

---

## STEP 2: REBUILD KRAKEN (if needed)

If kraken-agent dist is stale or missing:

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent
bun run build
```

---

## STEP 3: VERIFY CONFIG

```bash
cat /home/leviathan/.config/opencode/opencode.json
```

Expected output:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "minimax": {}
  },
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-plugin-engineering/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/dist/index.js"
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

## STEP 4: TEST IN CONTAINER

Build fresh container:

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/container-build/kraken-tui-test

# Update container config first
cat > config/opencode.json << 'EOF'
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
EOF

# Copy plugins to container build
mkdir -p config/plugins/opencode-subagent-manager
mkdir -p config/plugins/coding-subagents
mkdir -p config/plugins/opencode-plugin-engineering
mkdir -p config/plugins/kraken-agent
mkdir -p config/plugins/shark-agent-v4.7-hotfix-v3
mkdir -p config/plugins/manta-agent-v1.5

cp /home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/dist/index.js config/plugins/opencode-subagent-manager/index.js
cp /home/leviathan/OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js config/plugins/coding-subagents/index.js
cp /home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-plugin-engineering/dist/index.js config/plugins/opencode-plugin-engineering/dist/index.js
cp /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/dist/index.js config/plugins/kraken-agent/index.js
cp /home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/dist/index.js config/plugins/shark-agent-v4.7-hotfix-v3/index.js
cp /home/leviathan/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/dist/index.js config/plugins/manta-agent-v1.5/index.js

# Build container
docker build --no-cache -t kraken-v2-tui-test:1.4.9 .

# Test
docker run --rm -e MINIMAX_API_KEY="$MINIMAX_API_KEY" kraken-v2-tui-test:1.4.9 /bin/bash -c 'opencode run "get_cluster_status" --agent kraken'
```

**Expected success output:**
```
[SubAgentManager][INFO] OpenCodeSubagentManager v1.0.0 initializing 
[SubAgentManager][INFO] OpenCodeSubagentManager initialized {
  toolCount: 3,
  tools: [ "run_subagent_task", "run_parallel_tasks", "cleanup_subagents" ],
}
[v4.1][kraken-agent] Initializing Kraken Agent Harness {
  clusters: 3,
  agents: 11,
}
> kraken · MiniMax-M2.7-highspeed
```

---

## ARCHITECTURE REFERENCE

### 6 Plugins (in order)

| # | Plugin | Purpose | Tools |
|---|--------|---------|-------|
| 0 | opencode-subagent-manager | Docker container execution | run_subagent_task, run_parallel_tasks, cleanup_subagents |
| 1 | coding-subagents | Task routing | route, gemma, qwen |
| 2 | opencode-plugin-engineering | Engineering context | - |
| 3 | kraken-agent | Orchestrator (3 clusters, 11 agents) | spawn_cluster_task, spawn_shark_agent, spawn_manta_agent, get_cluster_status, kraken_hive_search, kraken_hive_remember, aggregate_results |
| 4 | shark-agent-v4.7-hotfix-v3 | Shark TAB (steamroll brain) | shark-status, shark-gate, shark-evidence, grill, report_to_kraken |
| 5 | manta-agent-v1.5 | Manta TAB (precision brain) | manta-status, manta-gate, manta-evidence, verify, report_to_kraken |

### Kraken Clusters

| Cluster | Agents |
|---------|--------|
| Alpha | shark-alpha-1, shark-alpha-2, manta-alpha-1 |
| Beta | shark-beta-1, manta-beta-1, manta-beta-2 |
| Gamma | manta-gamma-1, manta-gamma-2, shark-gamma-1 |

**Total:** 9 cluster agents + 2 standalone (shark, manta as TABS) = 11 agents

### Dual Plugin System

Kraken uses TWO plugins for task execution:

1. **kraken-agent** - Orchestration layer (JavaScript)
   - Task scheduling, cluster management, Hive Mind
   - Delegates to subagent-manager for actual Docker spawning

2. **opencode-subagent-manager** - Execution layer (Python wrappers)
   - spawns Docker containers
   - Runs actual agent in isolated environment

### Evidence Bug Fix

**File:** `/projects/kraken-agent/manta-agent/src/hooks/v4.1/gate-hook.ts`

The `checkGateAdvance()` function was called BEFORE `evidence` was defined:

```typescript
// BROKEN:
const shouldAdvance = checkGateAdvance(tool, args, result, currentGate, evidence);  // evidence = undefined!
const evidence = buildEvidenceRecord(tool, args, result);

// FIXED:
const evidence = buildEvidenceRecord(tool, args, result);  // Build FIRST
const shouldAdvance = checkGateAdvance(tool, args, result, currentGate, evidence);
```

After fixing, rebuild:
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/manta-agent && bun run build
```

---

## VERIFICATION COMMANDS

```bash
# Check all plugins load
opencode debug config

# Check kraken agent
opencode debug agent kraken

# Test get_cluster_status tool
opencode run "get_cluster_status" --agent kraken

# Test kraken-hive
opencode run "kraken_hive_search query:build pattern limit:3" --agent kraken
```

---

## QUICK FIX (single command)

To fix everything in one shot:

```bash
cat > /home/leviathan/.config/opencode/opencode.json << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "minimax": {}
  },
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-plugin-engineering/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/dist/index.js"
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
EOF
```

---

**END OF SMK RELOAD SCRIPT**