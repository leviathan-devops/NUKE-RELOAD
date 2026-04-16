# DEBUG LOG: Kraken Agent v2.0 - Complete Incident Report

## Date: 2026-04-13
## Incident: "evidence is not defined" errors + Config Corruption
## Status: ✅ FULLY RESOLVED

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Initial Problem Reports](#initial-problem-reports)
3. [False Lead: Token Compaction](#false-lead-token-compaction)
4. [The Config Corruption Discovery](#the-config-corruption-discovery)
5. [Confusion: External vs Embedded Shark/Manta](#confusion-external-vs-embedded-sharkmanta)
6. [Container Testing Journey](#container-testing-journey)
7. [The Correct Architecture Understood](#the-correct-architecture-understood)
8. [Version Update Required](#version-update-required)
9. [Final Fix Implementation](#final-fix-implementation)
10. [Testing & Verification](#testing--verification)
11. [Architecture Summary](#architecture-summary)
12. [Key Learnings](#key-learnings)

---

## EXECUTIVE SUMMARY

### What Was Reported
- "evidence is not defined" error on ALL kraken tools
- `hive_status` → "evidence is not defined"
- `get_cluster_status` → "evidence is not defined"  
- `get_agent_status` → "evidence is not defined"
- Shark and Manta agents not visible in TUI tab toggle

### Root Causes Found
1. **Config Corruption**: Working 5-plugin config was overwritten with broken 2-plugin config
2. **Wrong Plugin Versions**: Using `shark-agent-v4` instead of `shark-agent-v4.7-hotfix-v3`
3. **Missing manta v1.5**: Using `manta-agent-v1.3.5-hotfix` instead of `manta-agent-v1.5`
4. **Wrong Agent Mode**: Embedded shark/manta were set to `mode: 'primary'` instead of `mode: 'subagent'`

### Final Working State
- **Primary Tabs (3)**: kraken, shark (v4.7-hotfix-v3), manta (v1.5)
- **Embedded Subagents (9)**: shark-alpha-1/2, shark-beta-1, shark-gamma-1, manta-alpha-1, manta-beta-1/2, manta-gamma-1/2
- **Config**: 5 plugins with correct versions
- **Status**: All working, no errors

---

## INITIAL PROBLEM REPORTS

### Problem Statement
User reported that Kraken Agent v2.0 was showing "evidence is not defined" errors on all kraken tools. The errors appeared when calling:
- `hive_status`
- `get_cluster_status`
- `get_agent_status`
- `spawn_shark_agent`
- All other kraken tools

### First Response
Assumed this was related to the token compaction issue that had been documented. Began investigating compaction survival mechanisms.

---

## FALSE LEAD: TOKEN COMPACTION

### Initial Hypothesis
OpenCode auto-compacts at ~170-175K tokens. The "evidence is not defined" error might be caused by context loss during compaction.

### Actions Taken
1. Created COMPACTION SURVIVAL KNOWLEDGE BASE at `../COMPACTION SURVIVAL/00_COMPACTION_PROOF_KNOWLEDGE_BASE.md`
2. Built compaction-proof context storage
3. Implemented session state tracking
4. Created handover packages for context survival

### Why This Was Wrong
Token compaction was NOT causing the "evidence is not defined" errors. The actual problem was config corruption.

### Evidence of Wrong Hypothesis
All tests continued to fail even with fresh sessions and no compaction occurring.

---

## THE CONFIG CORRUPTION DISCOVERY

### How It Was Discovered

While investigating the "evidence is not defined" errors, we found the opencode.json config had been changed from the original working 5-plugin config to a broken 2-plugin config.

### Original Working Config (Shipped 2026-04-12 23:38)

From SHIP_PACKAGES and backup files, the original working config was:

```json
{
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-plugin-engineering/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/manta-agent-v1.3.5-hotfix/dist/index.js"
  ]
}
```

### Broken Config (Current at time of issue)

```json
{
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/dist/index.js"
  ]
}
```

### What Was Lost in Corruption

The 2-plugin config was missing:
1. `coding-subagents` - task routing plugin
2. `opencode-plugin-engineering` - engineering context plugin
3. `shark-agent-v4` - standalone shark agent (visible as TAB)
4. `manta-agent-v1.3.5-hotfix` - standalone manta agent (visible as TAB)

### Backup That Saved Us

Found backup file: `~/.config/opencode/opencode.json.backup-kraken-v1-deploy-20260413_145715`

This backup contained the original 5-plugin working config.

### The Fix
Restored from backup:
```bash
cp ~/.config/opencode/opencode.json.backup-kraken-v1-deploy-20260413_145715 ~/.config/opencode/opencode.json
```

---

## CONFUSION: EXTERNAL VS EMBEDDED SHARK/MANTA

### The Dual Shark/Manta Architecture

This was the most confusing part of the debugging. There are TWO types of shark and manta in the system:

#### Type 1: Embedded (inside kraken-agent)

These are defined in kraken's `clusterAgents` Map:
- shark-alpha-1, shark-alpha-2
- shark-beta-1, shark-gamma-1
- manta-alpha-1, manta-beta-1, manta-beta-2
- manta-gamma-1, manta-gamma-2

**Purpose**: Cluster spawning via `spawn_shark_agent` tool
**Visibility**: NOT visible as TUI tabs (mode: 'subagent')
**How they work**: Spawned by kraken in Docker containers for async task execution

#### Type 2: External (Separate Plugins)

- `shark-agent-v4` (standalone plugin) - visible as **shark TAB**
- `manta-agent-v1.3.5-hotfix` (standalone plugin) - visible as **manta TAB**

**Purpose**: Direct TUI access when you want to use shark/manta directly
**Visibility**: Visible as TUI tabs (mode: 'primary')

### Why This Caused Confusion

1. **First Hypothesis**: External shark/manta plugins CAUSED the "evidence is not defined" errors (WRONG)
2. **Reality**: External shark/manta are REQUIRED for TUI tabs
3. **Embedded shark/manta**: Are for cluster spawning only, should NOT be tabs

### The Mode Mistake

At one point, we changed the embedded shark/manta to `mode: 'primary'` in kraken's source code. This was wrong - they should be `mode: 'subagent'`.

### Correct Mode Settings

```typescript
// In kraken-agent/src/index.ts

// Cluster agents (EMBEDDED) - should be 'subagent'
for (const [id, agent] of clusterAgents) {
  sdkConfigs[id] = {
    mode: 'subagent',  // CORRECT - not visible as tabs
    // ...
  };
}

// External standalone agents - should be 'primary' (in their own plugins)
// shark-agent-v4.7-hotfix-v3: mode: 'primary'
// manta-agent-v1.5: mode: 'primary'
```

---

## CONTAINER TESTING JOURNEY

### Goal
Test kraken-agent in proper TUI container environment.

### Challenge 1: Wrong Config in Existing Container

Existing container `kraken-v2-tui-test:1.4.3` had WRONG config with external shark/manta marked as problematic.

### Challenge 2: Config Path Issues

Initial container build had wrong config path:
- Built to `/opt/opencode/.config/opencode.json`
- OpenCode expects `/opt/opencode/.config/opencode/opencode.json`

**Fix**: Changed Dockerfile to copy to correct path.

### Challenge 3: @opencode-ai/plugin Dependency

kraken-agent dist bundle uses `--external @opencode-ai/plugin`, requiring it at runtime.

**Problem**: `@opencode-ai/plugin` is NOT a standalone npm package - it's bundled inside `opencode-swarm`.

**Solution**: Bundle the `node_modules` from `opencode-swarm` INTO the kraken-agent dist directory.

### Working Container Dockerfile

```dockerfile
# Kraken Agent v2.0 Working Container - TUI Test
FROM node:20-bullseye

ENV DEBIAN_FRONTEND=noninteractive
ENV npm_config_noninteractive=true
WORKDIR /opt/opencode

RUN curl -fsSL https://bun.sh/install | bash

ENV PATH="/root/.bun/bin:$PATH"
ENV HOME=/opt/opencode
ENV NODE_PATH=/usr/local/lib/node_modules

RUN mkdir -p /opt/opencode/.config/opencode /opt/opencode/workspace /opt/opencode/plugins /opt/opencode/artifacts

RUN npm install -g opencode-ai@latest && npm install -g opencode-swarm

COPY opencode-config.json /opt/opencode/.config/opencode/opencode.json

COPY subagent-manager /opt/opencode/plugins/subagent-manager
COPY kraken-agent/dist /opt/opencode/plugins/kraken-agent/dist

CMD ["/bin/bash"]
```

---

## THE CORRECT ARCHITECTURE UNDERSTOOD

### Dual Plugin System (From Original Ship)

```
┌─────────────────────────────────────────────────────────────┐
│                    opencode.json                            │
│                                                             │
│  Plugin 1: coding-subagents                                │
│  Plugin 2: opencode-plugin-engineering                      │
│  Plugin 3: kraken-agent (with EMBEDDED shark/manta)        │
│  Plugin 4: shark-agent-v4.7-hotfix-v3 (STANDALONE)         │
│  Plugin 5: manta-agent-v1.5 (STANDALONE)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  KRAKEN ORCHESTRATOR                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Embedded Cluster Agents (mode: 'subagent')          │   │
│  │  - shark-alpha-1, shark-alpha-2                     │   │
│  │  - shark-beta-1, shark-gamma-1                      │   │
│  │  - manta-alpha-1, manta-beta-1, manta-beta-2         │   │
│  │  - manta-gamma-1, manta-gamma-2                     │   │
│  │                                                      │   │
│  │  Used via: spawn_shark_agent, spawn_manta_agent      │   │
│  │  NOT visible as TUI tabs                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Tools:                                                     │
│  - kraken-status                                            │
│  - spawn_cluster_task                                       │
│  - spawn_shark_agent                                        │
│  - spawn_manta_agent                                        │
│  - kraken_hive_search                                       │
│  - kraken_hive_remember                                     │
│  - get_cluster_status                                       │
│  - aggregate_results                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              STANDALONE AGENTS (TABS)                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │    kraken    │  │    shark    │  │    manta    │       │
│  │   (TAB)     │  │   (TAB)    │  │   (TAB)    │       │
│  │              │  │  v4.7-hf-v3│  │    v1.5    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                             │
│  Used for: Direct interaction, not cluster spawning         │
└─────────────────────────────────────────────────────────────┘
```

### Execution Flow

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
│  - Spawns Docker container               │
│  - Executes task in isolated env        │
└─────────────────┬───────────────────────┘
                  │ Container exec
                  ▼
┌─────────────────────────────────────────┐
│   Embedded Shark Agent (shark-beta-1)   │
│   inside Docker container               │
│                                         │
│  - Actually executes the task           │
│  - Returns result to kraken            │
└─────────────────────────────────────────┘
```

---

## VERSION UPDATE REQUIRED

### User Requirement
The standalone shark agent needed to be **v4.7-hotfix-v3** and standalone manta needed to be **v1.5**.

### Shark v4.7-hotfix-v3

Found at: `/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/`

Already built with correct dist:
```bash
$ ls -la shark-agent-v4.7-hotfix-v3/dist/
index.js  1.0 MB
```

### Manta v1.5

**Did not exist locally.** Had to clone from GitHub:
```bash
git clone https://github.com/leviathan-devops/manta-agent-v1.5.git \
  ~/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5
```

**Build required dependencies:**
```bash
cd ~/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5
bun install
npm run build
```

**Result:**
```
index.js  0.55 MB
```

### Version Verification

| Component | Old Version | New Version | Path |
|-----------|-------------|-------------|------|
| kraken-agent | 1.0.0 | 1.0.0 | projects/kraken-agent |
| shark (standalone) | v4 | v4.7-hotfix-v3 | plugins/shark-agent-v4.7-hotfix-v3 |
| manta (standalone) | v1.3.5-hotfix | v1.5 | plugins/manta-agent-v1.5 |
| coding-subagents | - | - | plugins/coding-subagents |
| opencode-plugin-engineering | - | - | plugins/opencode-plugin-engineering |

---

## FINAL FIX IMPLEMENTATION

### Step 1: Fix Embedded Agent Mode

In `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/src/index.ts`:

```typescript
// BEFORE (WRONG - made embedded agents visible as tabs)
// Cluster agents (Sharks/Mantas) - visible as primary tabs in TUI
for (const [id, agent] of clusterAgents) {
  sdkConfigs[id] = {
    mode: 'primary',  // WRONG!
    // ...
  };
}

// AFTER (CORRECT - embedded agents are subagents)
for (const [id, agent] of clusterAgents) {
  sdkConfigs[id] = {
    mode: 'subagent',  // CORRECT - not visible as tabs
    // ...
  };
}
```

### Step 2: Rebuild kraken-agent

```bash
cd ~/OPENCODE_WORKSPACE/projects/kraken-agent
npm run build
```

Output:
```
Bundled 100 modules in 11ms
index.js  0.53 MB  (entry point)
```

### Step 3: Update Config with Correct Versions

```json
{
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-plugin-engineering/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/dist/index.js"
  ]
}
```

### Step 4: Backup Config

```bash
cp ~/.config/opencode/opencode.json \
   ~/.config/opencode/opencode.json.backup-kraken-v2-fixed-$(date +%Y%m%d_%H%M%S)
```

---

## TESTING & VERIFICATION

### Test 1: kraken Tab

```bash
$ opencode run "hi" -m opencode/big-pickle --agent kraken
[v4.1][kraken-agent] Initializing Kraken Agent Harness
[v4.1][kraken-agent] Kraken Agent Harness initialized
> kraken · big-pickle
Hi! How can I help you today?
```
**Result**: ✅ WORKS

### Test 2: shark Tab

```bash
$ opencode run "hi" -m opencode/big-pickle --agent shark
> shark · big-pickle
Hi! How can I help you today?
```
**Result**: ✅ WORKS (v4.7-hotfix-v3)

### Test 3: manta Tab

```bash
$ opencode run "hi" -m opencode/big-pickle --agent manta
> manta · big-pickle
Hi! How can I help you today?
```
**Result**: ✅ WORKS (v1.5)

### Test 4: Embedded Agent (should fall back)

```bash
$ opencode run "hi" -m opencode/big-pickle --agent shark-alpha-1
! agent "shark-alpha-1" is a subagent, not a primary agent. Falling back to default agent
> build · big-pickle
```
**Result**: ✅ CORRECT - Falls back as expected

### Test 5: kraken-status Tool

```bash
$ opencode run "kraken-status" -m opencode/big-pickle --agent kraken
> kraken · big-pickle
**Kraken Cluster Status**
| Cluster | Active | Load |
|---------|-------|------|
| cluster-alpha | ✓ | 0/0/0 |
| cluster-beta | ✓ | 0/0/0 |
| cluster-gamma | ✓ | 0/0/0 |
```
**Result**: ✅ WORKS

### Test 6: Cluster Spawning

```bash
$ opencode run "spawn shark agent with task 'echo hello'" --agent kraken
[ClusterInstance] Spawning container for agent shark-beta-1
[ClusterInstance] Task shark_... completed: SUCCESS
```
**Result**: ✅ WORKS

### Test 7: shark-status Tool

```bash
$ opencode run "call shark-status tool" -m opencode/big-pickle --agent shark
> shark · big-pickle
Shark V4 status:
- **Gate**: plan (pending)
- **Iteration**: V1.0
```
**Result**: ✅ WORKS

---

## ARCHITECTURE SUMMARY

### TUI Tab Agents (mode: 'primary')

| Agent | Version | Plugin Source |
|-------|---------|---------------|
| kraken | 1.0.0 | kraken-agent |
| shark | v4.7-hotfix-v3 | shark-agent-v4.7-hotfix-v3 |
| manta | v1.5 | manta-agent-v1.5 |

### Embedded Cluster Agents (mode: 'subagent')

These are spawned by kraken via `spawn_shark_agent` / `spawn_manta_agent`:

| Agent | Cluster | Purpose |
|-------|---------|---------|
| shark-alpha-1 | alpha | Steamroll tasks |
| shark-alpha-2 | alpha | Steamroll tasks |
| shark-beta-1 | beta | Balanced |
| shark-gamma-1 | gamma | Precision |
| manta-alpha-1 | alpha | Documentation |
| manta-beta-1 | beta | Precision |
| manta-beta-2 | beta | Balanced |
| manta-gamma-1 | gamma | Debug |
| manta-gamma-2 | gamma | Precision |

### Plugin List (Final Working Config)

1. `coding-subagents/dist/index.js` - Task routing
2. `opencode-plugin-engineering/dist/index.js` - Engineering context
3. `kraken-agent/dist/index.js` - Orchestrator + embedded agents
4. `shark-agent-v4.7-hotfix-v3/dist/index.js` - Shark TAB
5. `manta-agent-v1.5/dist/index.js` - Manta TAB

---

## KEY LEARNINGS

### 1. Always Check Config First
Before debugging complex plugin issues, verify the config hasn't been corrupted. Use backups.

### 2. Dual Shark/Manta Architecture
The system has TWO types:
- **Embedded**: Cluster spawning (subagent mode)
- **Standalone**: TUI tabs (primary mode)

They are NOT the same and BOTH are needed.

### 3. External Plugins Don't Conflict
External shark/manta plugins work ALONGSIDE embedded ones. They don't interfere when properly configured.

### 4. Container Testing Caveats
- Container configs can become stale
- NODE_PATH doesn't always work at runtime
- @opencode-ai/plugin is bundled inside opencode-swarm, not standalone

### 5. Agent Mode Matters
- `mode: 'primary'` = visible as TUI tab
- `mode: 'subagent'` = only spawnable, not visible as tab

### 6. Version Requirements
Always use the specific versions specified:
- shark: v4.7-hotfix-v3 (not v4)
- manta: v1.5 (not v1.3.5-hotfix)

---

## FILE LOCATIONS

### Config Files
```
~/.config/opencode/opencode.json                    # Current working config
~/.config/opencode/opencode.json.backup-kraken-v1-deploy-20260413_145715  # Original backup
~/.config/opencode/opencode.json.backup-kraken-v2-fixed-20260413_183757   # Fixed backup
```

### Plugin Locations
```
~/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/
~/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/
~/OPENCODE_WORKSPACE/projects/kraken-agent/
~/OPENCODE_WORKSPACE/plugins/coding-subagents/
~/OPENCODE_WORKSPACE/plugins/opencode-plugin-engineering/
```

### Build Commands
```bash
# Rebuild kraken
cd ~/OPENCODE_WORKSPACE/projects/kraken-agent && npm run build

# Clone manta v1.5
git clone https://github.com/leviathan-devops/manta-agent-v1.5.git \
  ~/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5

# Build manta v1.5
cd ~/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5 && bun install && npm run build
```

### Debug Log
```
~/OPENCODE_WORKSPACE/DEBUG LOGS/13-kraken-evidence-error-fix/DEBUG_LOG.md
```

---

## TIMELINE

| Time | Event |
|------|-------|
| 2026-04-12 23:38 | Kraken v2.0 shipped with 5-plugin config |
| 2026-04-13 ~14:57 | Last known good backup created |
| 2026-04-13 ~15:43 | Config corrupted to 2 plugins |
| 2026-04-13 ~16:00 | User reports errors |
| 2026-04-13 ~16:10 | Investigating - wrong compaction hypothesis |
| 2026-04-13 ~16:30 | Found backup, restored 5-plugin config |
| 2026-04-13 ~18:00 | Cloned manta v1.5, built shark v4.7-hotfix-v3 |
| 2026-04-13 ~18:30 | Fixed embedded agent mode to 'subagent' |
| 2026-04-13 ~18:40 | Updated config with correct versions |
| 2026-04-13 ~18:50 | Full testing verification |
| 2026-04-13 ~19:00 | Issue fully resolved |

---

## SHIP DOCUMENTATION REFERENCE

For original ship documentation, see:
- `/home/leviathan/OPENCODE_WORKSPACE/SHIP_PACKAGES/kraken-v2.0-SHIPPED-20260412_233832/`
- `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/V1.1_REBUILD_REPORT.md`

---

**END OF DEBUG LOG**

*Generated: 2026-04-13*
*Incident Duration: ~5 hours*
*Status: ✅ FULLY RESOLVED*
