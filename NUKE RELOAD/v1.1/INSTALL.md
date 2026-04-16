# INSTALL — KRAKEN AGENT v1.1
## Complete Self-Contained Deployment

> **Version:** 1.1  
> **Updated:** 2026-04-14  
> **Verified:** All tests pass in opencode-test:1.4.3 container

---

## ⚠️ BEFORE YOU START — PATH SUBSTITUTION

This install script contains paths for a specific deployment environment. **Before running any command, replace all path placeholders:**

| Placeholder | Replace with |
|-------------|--------------|
| `/home/leviathan` | Your actual `$HOME` |
| `/home/leviathan/OPENCODE_WORKSPACE` | Your actual `OPENCODE_WORKSPACE` path |

**Quick substitution (run before starting):**
```bash
# Set your paths as variables:
MY_HOME="$HOME"
MY_WORKSPACE="$OPENCODE_WORKSPACE"  # or your actual workspace path

# Replace all occurrences in this file:
sed -i "s|/home/leviathan|${MY_HOME}|g; s|SHIP_KRAKEN_V1.1|${MY_WORKSPACE}/SHIP_KRAKEN_V1.1|g" INSTALL.md
```

---

## WHAT IS IN THIS PACKAGE

```
SHIP_KRAKEN_V1.1/
├── build/index.js                        ← KRASKEN v1.1 primary bundle (527KB, all fixes)
├── subagent-manager/                    ← SUBAGENT-MANAGER (self-contained, with wrappers/)
│   ├── src/tools/index.ts               ← spawn fix applied
│   ├── dist/index.js                    ← rebuilt 967KB, spawn fix
│   └── wrappers/                         ← Python 3.9 compat wrappers (self-contained)
│       ├── container_pool.py
│       ├── opencode_agent.py
│       └── __init__.py
├── kraken-agent-source/                 ← Full kraken source tree
├── kraken-agent-source/wrappers/       ← Python 3.9 compat wrappers
└── INSTALL.md                           ← This file
```

**Everything needed is inside this folder.** No need to chase down external subagent-manager or wrappers.

---

## DEPENDENCY MAP

```
opencode.json
  └── subagent-manager/        ← From SHIP: subagent-manager/dist/index.js
        └── wrappers/           ← From SHIP: subagent-manager/wrappers/  (self-contained ✅)
  └── kraken-agent-v1.1/       ← From SHIP: build/index.js → ~/.config/opencode/plugins/kraken-agent-v1.1/
        └── wrappers/           ← From SHIP: kraken-agent-source/wrappers/  (self-contained ✅)
```

---

## PREREQUISITES (system-level)

- OpenCode 1.4.x
- Docker running on host
- Bun runtime ≥1.0 (only needed if building from source)
- `opencode-test:1.4.3` Docker image (for container verification only)

---

## STEP 1 — Prerequisites

- Docker running on host (required for container spawning)
- OpenCode 1.4.x installed
- Bun runtime ≥1.0 (only needed if building from source)

---

## STEP 2 — Deploy subagent-manager to OPENCODE_WORKSPACE/plugins/

```bash
WORKSPACE="${OPENCODE_WORKSPACE:-/home/USER/OPENCODE_WORKSPACE}"
SHIP="/path/to/SHIP_KRAKEN_V1.1"  # adjust to where you extracted the SHIP package

# Copy the self-contained subagent-manager (with its own wrappers/):
cp -r "$SHIP/subagent-manager" "$WORKSPACE/plugins/opencode-subagent-manager"

# Verify:
ls "$WORKSPACE/plugins/opencode-subagent-manager/"
# Expected: bun.lock  dist/  node_modules/  package.json  src/  tsconfig.json  wrappers/

ls "$WORKSPACE/plugins/opencode-subagent-manager/wrappers/"
# Expected: container_pool.py  __init__.py  opencode_agent.py

# Verify wrappers have Python 3.9 fix:
grep "from __future__ import annotations" \
  "$WORKSPACE/plugins/opencode-subagent-manager/wrappers/container_pool.py"
# Expected: from __future__ import annotations

# Verify HOME-based wrapper path (no hardcoded paths):
grep "process.env.HOME" \
  "$WORKSPACE/plugins/opencode-subagent-manager/dist/index.js"
# Expected: var HOME = process.env.HOME || ...
```

---

## STEP 3 — Deploy kraken-agent-v1.1

### Option A — Deploy to existing directory (RECOMMENDED)

Use when `~/.config/opencode/plugins/kraken-agent-v1.1/` already exists.

```bash
WORKSPACE="${OPENCODE_WORKSPACE:-/home/USER/OPENCODE_WORKSPACE}"
SHIP="/path/to/SHIP_KRAKEN_V1.1"  # adjust to where you extracted the SHIP package

# Step 3a: Replace the dist with the SHIP build
cp "$SHIP/build/index.js" \
   ~/.config/opencode/plugins/kraken-agent-v1.1/dist/index.js

# Verify:
ls -lh ~/.config/opencode/plugins/kraken-agent-v1.1/dist/index.js
# Expected: ~527KB

# Step 3b: Copy the self-contained wrappers into kraken-agent-v1.1
cp "$SHIP/kraken-agent-source/wrappers/container_pool.py" \
   ~/.config/opencode/plugins/kraken-agent-v1.1/wrappers/

cp "$SHIP/kraken-agent-source/wrappers/opencode_agent.py" \
   ~/.config/opencode/plugins/kraken-agent-v1.1/wrappers/

# Step 3c: Verify node_modules present (REQUIRED — do not skip):
ls ~/.config/opencode/plugins/kraken-agent-v1.1/node_modules/@opencode-ai/
# Expected: plugin/ directory exists

# Step 3d: Install if needed:
cd ~/.config/opencode/plugins/kraken-agent-v1.1
bun install 2>&1 | tail -3
```

### Option B — Fresh deploy from source

Use when `~/.config/opencode/plugins/kraken-agent-v1.1/` does not exist.

```bash
SHIP="/path/to/SHIP_KRAKEN_V1.1"  # adjust to where you extracted the SHIP package

# Create and populate directory:
mkdir -p ~/.config/opencode/plugins/kraken-agent-v1.1
cp -r "$SHIP/kraken-agent-source/." \
      ~/.config/opencode/plugins/kraken-agent-v1.1/

# Install dependencies:
cd ~/.config/opencode/plugins/kraken-agent-v1.1
bun install

# Build:
bun run build

# Verify:
ls -lh dist/index.js  # expect ~527KB

# Copy wrappers:
cp SHIP_KRAKEN_V1.1/kraken-agent-source/wrappers/container_pool.py \
   ~/.config/opencode/plugins/kraken-agent-v1.1/wrappers/
cp SHIP_KRAKEN_V1.1/kraken-agent-source/wrappers/opencode_agent.py \
   ~/.config/opencode/plugins/kraken-agent-v1.1/wrappers/
```

---

## STEP 4 — Update opencode.json

> **IMPORTANT:** Before running, replace all instances of `/home/leviathan` with your actual `$HOME` directory path, and `/home/leviathan/OPENCODE_WORKSPACE` with your actual `OPENCODE_WORKSPACE` path.

```bash
# Verify your paths:
echo "HOME=$HOME"
echo "OPENCODE_WORKSPACE=$(printenv OPENCODE_WORKSPACE || echo '/home/USER/OPENCODE_WORKSPACE')"

# Backup first:
cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.backup-$(date +%Y%m%d)

# Update using python3 (avoids shell quoting issues):
# REPLACE /home/leviathan with your $HOME and /home/leviathan/OPENCODE_WORKSPACE with your workspace:
python3 << 'PYEOF'
import json
import os

HOME = os.environ.get('HOME', '/root')
# REPLACE the next line if your OPENCODE_WORKSPACE is different
WORKSPACE = os.environ.get('OPENCODE_WORKSPACE', os.path.join(HOME, 'OPENCODE_WORKSPACE'))

cfg_path = os.path.join(HOME, '.config', 'opencode', 'opencode.json')
with open(cfg_path) as f:
    cfg = json.load(f)

cfg['plugin'] = [
    f"file://{WORKSPACE}/plugins/opencode-subagent-manager/dist/index.js",
    f"file://{WORKSPACE}/plugins/coding-subagents/dist/index.js",
    f"file://{WORKSPACE}/plugins/opencode-plugin-engineering/dist/index.js",
    f"file://{HOME}/.config/opencode/plugins/kraken-agent-v1.1/dist/index.js",
    f"file://{WORKSPACE}/plugins/shark-agent-v4.7-hotfix-v3/dist/index.js",
    f"file://{WORKSPACE}/plugins/manta-agent-v1.5/dist/index.js",
]

with open(cfg_path, 'w') as f:
    json.dump(cfg, f, indent=4)

print("opencode.json updated")
PYEOF

# Verify:
python3 -m json.tool ~/.config/opencode/opencode.json | grep -E 'subagent|kraken'
# Expected: both plugin paths shown
```

---

## STEP 5 — Verify Deployment

### 5a: Plugin load check (always do this first)

```bash
opencode debug config --print-logs --log-level DEBUG 2>&1 | grep -E 'kraken|subagent' -i | grep -v 'Auth'
```

**Expected output:**
```
INFO  service=plugin path=...opencode-subagent-manager... loading plugin
INFO  service=plugin path=...kraken-agent-v1.1... loading plugin
[SubAgentManager][INFO] OpenCodeSubagentManager initialized { tools: [ "run_subagent_task", "run_parallel_tasks", "cleanup_subagents" ], }
[v4.1][kraken-agent] Kraken Agent Harness initialized {
  clusterCount: 3,
  totalAgents: 11,
  krakenHiveReady: true,
}
```

**Failure signatures:**
```
ERROR service=plugin ... error=Cannot find module '@opencode-ai/plugin'
→ node_modules missing. Run: cd ~/.config/opencode/plugins/kraken-agent-v1.1 && bun install

[SubAgentManager] not in output
→ subagent-manager failed to load. Check that it was copied to OPENCODE_WORKSPACE/plugins/

[v4.1][kraken-agent] not in output
→ kraken failed to load. Check dist/index.js is >= 527KB.
```

### 5b: Cluster status

```bash
opencode run 'call get_cluster_status' -m minimax/MiniMax-M2.7 2>&1 | grep -E 'cluster-alpha|cluster-beta|cluster-gamma|total'
```

**Expected:**
```
| cluster-alpha | shark-alpha-1, shark-alpha-2, manta-alpha-1 |
| cluster-beta  | shark-beta-1, manta-beta-1, manta-beta-2    |
| cluster-gamma | manta-gamma-1, manta-gamma-2, shark-gamma-1 |
All 9 agents are **idle**
```

### 5c: Shark routing (v1.1 core fix)

```bash
opencode run 'call spawn_shark_agent task="routing check" priority="high"' -m minimax/MiniMax-M2.7 2>&1 | grep 'agentType'
```

**Expected:** `agentType: "shark"` — if `"manta"` is returned, v1.1 build is not loaded.

### 5d: Manta routing

```bash
opencode run 'call spawn_manta_agent task="routing check" priority="normal"' -m minimax/MiniMax-M2.7 2>&1 | grep 'agentType'
```

**Expected:** `agentType: "manta"`

### 5e: Parallel tasks spawn fix

```bash
WORKSPACE="${OPENCODE_WORKSPACE:-/home/USER/OPENCODE_WORKSPACE}"
opencode run 'call run_parallel_tasks tasks=[{task:"Return: ptest",model:"minimax/MiniMax-M2.7",timeout:15}] workspace="$WORKSPACE" poolSize=1' -m minimax/MiniMax-M2.7 2>&1 | grep -E 'SyntaxError|docker|Error'
```

**Expected:** Docker error (not `SyntaxError`). `SyntaxError` = spawn fix missing.

---

## CONTAINER VERIFICATION (Exact Runtime Replica)

Test command verified working on `opencode-test:1.4.3`:

> **NOTE:** Replace `/home/leviathan` with your actual `$HOME` before running.

```bash
MY_HOME="$HOME"  # or replace manually
MY_WORKSPACE="$OPENCODE_WORKSPACE"  # or replace manually

# Create test config:
mkdir -p /tmp/kraken-v1.1-test/config
python3 << PYEOF
import json
cfg = json.load(open('$MY_HOME/.config/opencode/opencode.json'))
cfg['plugin'] = [
    "file:///workspace/plugins/opencode-subagent-manager/dist/index.js",
    "file:///workspace/plugins/coding-subagents/dist/index.js",
    "file:///workspace/plugins/opencode-plugin-engineering/dist/index.js",
    "file://$MY_HOME/.config/opencode/plugins/kraken-agent-v1.1/dist/index.js",
    "file:///workspace/plugins/shark-agent-v4.7-hotfix-v3/dist/index.js",
    "file:///workspace/plugins/manta-agent-v1.5/dist/index.js",
]
json.dump(cfg, open('/tmp/kraken-v1.1-test/config/opencode.json','w'), indent=4)
PYEOF

# Run tests:
docker run --rm \
  --entrypoint /bin/bash \
  -v "$MY_WORKSPACE:/workspace" \
  -v /tmp/kraken-v1.1-test/config:/root/.config/opencode \
  -v "$MY_HOME/.config/opencode/plugins/kraken-agent-v1.1:$MY_HOME/.config/opencode/plugins/kraken-agent-v1.1:ro" \
  -e MINIMAX_API_KEY="$MINIMAX_API_KEY" \
  opencode-test:1.4.3 \
  -c "opencode debug config --print-logs --log-level DEBUG 2>&1 | grep -E 'kraken|subagent' -i | grep -v Auth && echo '---' && opencode run 'call get_cluster_status' -m minimax/MiniMax-M2.7 2>&1 | tail -15"
```

**Required mounts:**
| Mount | Purpose |
|-------|---------|
| `OPENCODE_WORKSPACE:/workspace` | All workspace plugins at `/workspace/plugins/` |
| `kraken-agent-v1.1:ro` | Kraken plugin with wrappers at exact host path |
| `test-config:/root/.config/opencode` | Test opencode.json |

---

## COMPLETE FILE LISTING

### Inside SHIP_KRAKEN_V1.1/

| File/Dir | Purpose |
|----------|---------|
| `build/index.js` | Kraken v1.1 primary bundle (527KB) |
| `subagent-manager/` | **Self-contained subagent-manager** with spawn fix + wrappers/ |
| `subagent-manager/dist/index.js` | 967KB, spawn fix present |
| `subagent-manager/wrappers/` | Python 3.9 compat wrappers (container_pool.py, opencode_agent.py) |
| `kraken-agent-source/wrappers/` | Same wrappers (Python 3.9 compat) for reference |

### Live deployed structure:

```
~/.config/opencode/plugins/kraken-agent-v1.1/
├── dist/index.js          ← SHIP build/index.js (527KB)
├── wrappers/               ← From kraken-agent-source/wrappers/ (self-contained)
└── node_modules/          ← @opencode-ai/plugin

$OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/
├── dist/index.js          ← From SHIP subagent-manager/dist/ (967KB, spawn fix)
├── wrappers/              ← From SHIP subagent-manager/wrappers/ (self-contained)
└── node_modules/          ← dependencies
```

---

## TROUBLESHOOTING

### Kraken not in tab toggle
1. `opencode debug config --print-logs --log-level DEBUG 2>&1 | grep kraken`
2. If nothing → check `ls -lh ~/.config/opencode/plugins/kraken-agent-v1.1/dist/index.js` (must be ≥527KB)
3. If error → `cd ~/.config/opencode/plugins/kraken-agent-v1.1 && bun install`

### SubagentManager tools missing
1. Check `ls "$OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/dist/"`
2. If missing → `cp -r SHIP_KRAKEN_V1.1/subagent-manager "$OPENCODE_WORKSPACE/plugins/"`
3. Verify spawn fix: `grep -c "spawn.*python3.*-c" "$OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/dist/index.js"` (should be 1)

### `run_parallel_tasks` gives `SyntaxError: null bytes`
→ Spawn fix not applied. Verify: `grep "spawn('python3', \['-c', shim\])" "$OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/dist/index.js"`

### `run_parallel_tasks` gives `TypeError: unsupported operand type(s) for |`
→ Python 3.9 fix not applied. Verify: `grep "from __future__ import annotations" "$OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/wrappers/container_pool.py"`

### Wrappers not found (spawn_shark_agent / spawn_manta_agent)
The wrapper path uses `process.env.HOME` to locate `~/.config/opencode/plugins/kraken-agent-v1.1/wrappers/opencode_agent.py` at **runtime**, not build time. This avoids the Bun `__dirname` hardcoding issue.
- Verify `HOME` is set: `echo $HOME`
- Verify wrappers exist: `ls ~/.config/opencode/plugins/kraken-agent-v1.1/wrappers/`

### Wrappers not found (run_parallel_tasks)
The subagent-manager resolves its wrapper path via `process.cwd()` at runtime. If opencode's working directory is not the workspace, set `OPENCODE_WORKSPACE` env var before starting opencode.
- Verify wrappers exist: `ls "$OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/wrappers/"`

---

## UNINSTALL

```bash
rm -rf ~/.config/opencode/plugins/kraken-agent-v1.1
rm -rf "$OPENCODE_WORKSPACE/plugins/opencode-subagent-manager"
# Then remove kraken entries from opencode.json
```
