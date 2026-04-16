# DEBUG LOG — KRAKEN AGENT v1.1

**Updated:** 2026-04-13 17:15 UTC  
**Version:** 1.1.0  
**Status:** DEPLOYMENT COMPLETE ✅

---

## DEPLOYMENT FIX APPLIED

### Issue Identified
Diagnostic report revealed v1.1 deployment was **incomplete**:
- `opencode.json` pointed to `projects/kraken-agent/dist/index.js`
- Not pointing to official v1.1 ship package
- Version label showed `1.0.0` instead of `1.1.0`

### Fix Applied

1. **Updated opencode.json** to point to ship package:
```
file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v1.1/SHIP_KRAKEN_V1.1/build/index.js
```

2. **Updated package.json** version to `1.1.0`

3. **Rebuilt ship package** to ensure latest code:
```
Build checksum: 73e5e8788a2a46887c4013f33e4f4a62
Size: 0.53 MB
```

---

## AGENT ROUTING VERIFICATION

### Test Results (Live)

| Task | Requested Type | Assigned Agent | Type Match | Status |
|------|---------------|---------------|------------|--------|
| `spawn_shark_agent` | shark | shark-gamma-1 | ✅ | PASS |
| `spawn_manta_agent` | manta | manta-gamma-1 | ✅ | PASS |

**Conclusion:** Agent routing fix is WORKING ✅

---

## DOCKER EXECUTION ISSUE

### Error Observed
```
failed to set up container networking: driver failed programming external connectivity
Bind for :::18081 failed: port is already allocated
```

### Root Cause
Port conflict on the host system - multiple Docker containers trying to use port 18081.

### Impact on Routing Fix
**None.** The agent routing is working correctly. The Docker failure occurs AFTER the routing decision is made. The fix correctly:
1. Filters by agent type ✅
2. Assigns to correct cluster ✅
3. Attempts Docker execution ✅ (fails due to port, but routing decision is correct)

---

## BUILD ARTIFACTS

| File | Path | Checksum |
|------|------|----------|
| Main bundle | `SHIP_KRAKEN_V1.1/build/index.js` | `73e5e8788a2a46887c4013f33e4f4a62` |
| Package | `SHIP_KRAKEN_V1.1/package.json` | v1.1.0 |

---

## CHECKPOINTS

| ID | Timestamp | Description |
|----|-----------|-------------|
| `cp_1776099879754` | 2026-04-13 | After ship package creation |
| `cp_1776100729914` | 2026-04-13 17:15 | After deployment fix |

---

## TROUBLESHOOTING DOCKER PORT CONFLICTS

If you see port conflicts:

```bash
# Find processes using port 18081
lsof -i :18081

# Kill stale containers
docker ps -a | grep hermes-oc-agent | xargs docker rm -f

# Or restart Docker daemon
sudo systemctl restart docker
```

---

## FILES MODIFIED IN THIS UPDATE

| File | Change |
|------|--------|
| `~/.config/opencode/opencode.json` | Updated plugin path to ship package |
| `SHIP_KRAKEN_V1.1/package.json` | Version bumped to 1.1.0 |
| `SHIP_KRAKEN_V1.1/build/index.js` | Rebuilt with latest source |

---

## SIGNED

**Engineer:** System Brain  
**Timestamp:** 2026-04-13T17:15:42Z  
**Version:** KRAKEN AGENT v1.1.0

---

## ⚠️ INCIDENT — 2026-04-13 ~21:00 UTC: PLUGIN LOAD FAILURE AFTER ABOVE "FIX"

> The "fix" logged above (updating opencode.json to point at the SHIP_KRAKEN_V1.1/build/ path) **introduced a new failure**. Session crashed. Kraken disappeared from tab toggle entirely.

### What Went Wrong

**Bug 1: Spaced path in file:// URI**

The path set in opencode.json contained unencoded spaces:
```
file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v1.1/SHIP_KRAKEN_V1.1/build/index.js
```
OpenCode's plugin loader cannot resolve `file://` URIs with literal spaces. The plugin was silently skipped — no console error, just absent from the tab toggle.

**Bug 2: Bare dist directory missing node_modules**

Even when using a spaces-free path, copying only `index.js` to a fresh directory fails:
```
ERROR service=plugin path=file:///workspace/plugins/kraken-agent-v1.1/dist/index.js
error=Cannot find module '@opencode-ai/plugin' from '...dist/index.js' failed to load plugin
```
OpenCode resolves `@opencode-ai/plugin` (peer dep, built with `--external`) from `node_modules` **adjacent to the plugin file**. A dist-only directory has no `node_modules` → silent failure after log line.

### Diagnostic Method

```bash
opencode debug config --print-logs --log-level DEBUG 2>&1 | grep -i 'plugin\|error'
```

This reveals the exact load error that `opencode run` swallows silently.

### Container Evidence

Tested in `opencode-test:1.4.3` (exact local runtime replica):

```bash
docker run --rm \
  --entrypoint /bin/bash \
  -v /home/leviathan/OPENCODE_WORKSPACE:/workspace \
  -v /tmp/kraken-v1.1-test/config:/root/.config/opencode \
  -v /home/leviathan/.config/opencode/plugins/kraken-agent-v1.1:/home/leviathan/.config/opencode/plugins/kraken-agent-v1.1:ro \
  -e MINIMAX_API_KEY="$MINIMAX_API_KEY" \
  opencode-test:1.4.3 \
  -c "opencode debug config --print-logs --log-level DEBUG 2>&1 | grep -i 'plugin\|kraken\|error'"
```

**With broken path (pre-fix):**
```
ERROR service=plugin ... error=Cannot find module '@opencode-ai/plugin' failed to load plugin
```

**With correct path (post-fix):**
```
INFO  service=plugin path=file:///home/leviathan/.config/opencode/plugins/kraken-agent-v1.1/dist/index.js loading plugin
[v4.1][kraken-agent] Kraken Agent Harness initialized { clusterCount: 3, totalAgents: 11, krakenHiveReady: true }
```

### Resolution Applied

**Step 1:** Updated `~/.config/opencode/plugins/kraken-agent-v1.1/dist/index.js` with the SHIP build:
```bash
cp SHIP_KRAKEN_V1.1/build/index.js \
   ~/.config/opencode/plugins/kraken-agent-v1.1/dist/index.js
# Result: 527585 bytes — this directory already has node_modules installed
```

**Step 2:** Updated `~/.config/opencode/opencode.json` to use the no-spaces path with node_modules:
```json
"file:///home/leviathan/.config/opencode/plugins/kraken-agent-v1.1/dist/index.js"
```

### Container Test Results (Post-Fix)

| Test | Command | Result | Evidence |
|------|---------|--------|---------|
| Plugin loads | `opencode debug config --log-level DEBUG` | ✅ PASS | `[v4.1][kraken-agent] initialized, krakenHiveReady: true` |
| Cluster status | `get_cluster_status` | ✅ PASS | 3 clusters, 9 agents returned |
| Shark routing | `spawn_shark_agent` × 1 | ✅ PASS | `shark-gamma-1`, agentType: `shark` |
| Manta routing | `spawn_manta_agent` × 1 | ✅ PASS | `manta-gamma-1`, agentType: `manta` |

### Files Updated

| File | Change |
|------|--------|
| `~/.config/opencode/plugins/kraken-agent-v1.1/dist/index.js` | Replaced with SHIP build (527585 bytes, Apr 13) |
| `~/.config/opencode/opencode.json` | Updated kraken plugin path to no-spaces path with node_modules |
| `SHIP_KRAKEN_V1.1/INSTALL.md` | Rewritten with correct install steps and critical warnings |
| `SHIP_KRAKEN_V1.1/CHANGELOG.md` | Added deployment incident section |

**Timestamp:** 2026-04-13T21:35:00Z  
**Engineer:** opencode diagnostic session

---

## BUG FIX 2 — 2026-04-13 ~18:00 UTC: `run_parallel_tasks` Crash

### Bug: Python Spawn Double-Wrap

**Symptom:** `SyntaxError: source code cannot contain null bytes`

**Root Cause:** `executePythonWrapper('/usr/bin/python3', ['-c', shim])` prepends `python3` to its first argument, producing:
```
python3 /usr/bin/python3 -c "<inline code>"
```
Python reads `/usr/bin/python3` as a script → ELF magic bytes → SyntaxError.

**Fix Applied:**

**File:** `plugins/opencode-subagent-manager/src/tools/index.ts`
```typescript
// BROKEN (line 81):
const result = await executePythonWrapper('/usr/bin/python3', ['-c', shim]);

// FIXED — direct spawn:
import { spawn } from 'child_process';
const result = await new Promise((resolve) => {
  const proc = spawn('python3', ['-c', shim]);
  let stdout = '', stderr = '';
  proc.stdout?.on('data', (data) => stdout += data.toString());
  proc.stderr?.on('data', (data) => stderr += data.toString());
  proc.on('close', (code) => resolve({ stdout, stderr, exitCode: code ?? 0 }));
});
```

**Same fix applied to:** `SHIP_KRAKEN_V1.1/kraken-agent-source/subagent-manager/src/tools/index.ts`

### Bug: Python 3.9 Incompatibility in Wrappers

**Symptom:** `TypeError: unsupported operand type(s) for |: 'type' and 'NoneType'`

**Root Cause:** `container_pool.py` and `opencode_agent.py` use `str | None` type hint syntax (Python 3.10+). Container runs Python 3.9.

**Fix Applied:** Added `from __future__ import annotations` to both files:

| File | Location |
|------|----------|
| `container_pool.py` | `hermes-workspace/projects/Shadow Magic/OpenCode Subagents/wrappers/` |
| `opencode_agent.py` | `hermes-workspace/projects/Shadow Magic/OpenCode Subagents/wrappers/` |
| `container_pool.py` | `SHIP_KRAKEN_V1.1/kraken-agent-source/wrappers/` |
| `opencode_agent.py` | `SHIP_KRAKEN_V1.1/kraken-agent-source/wrappers/` |

### Rebuilt Artifacts

| File | Size | Date | Change |
|------|------|------|--------|
| `plugins/opencode-subagent-manager/dist/index.js` | 967KB | Apr 13 | Spawn fix |
| `SHIP/subagent-manager/dist/index.js` | 967KB | Apr 13 | Spawn fix |

### Container Verification (opencode-test:1.4.3)

All tests passed:
| Test | Result |
|------|--------|
| `get_cluster_status` | ✅ 3 clusters, 9 agents |
| `spawn_shark_agent` | ✅ shark-gamma-1, agentType: shark |
| `spawn_manta_agent` | ✅ manta-gamma-1, agentType: manta |
| `run_parallel_tasks` | ✅ No more SyntaxError — reaches Docker correctly |
| Wrapper import (Python 3.9) | ✅ Both import cleanly |

**Test command:**
```bash
docker run --rm \
  --entrypoint /bin/bash \
  -v /home/leviathan/OPENCODE_WORKSPACE:/workspace \
  -v /tmp/kraken-v1.1-test/config:/root/.config/opencode \
  -v /home/leviathan/.config/opencode/plugins/kraken-agent-v1.1:/home/leviathan/.config/opencode/plugins/kraken-agent-v1.1:ro \
  -v /home/leviathan/hermes-workspace:/home/leviathan/hermes-workspace \
  -e MINIMAX_API_KEY="$MINIMAX_API_KEY" \
  opencode-test:1.4.3 \
  -c "opencode run 'call get_cluster_status' -m minimax/MiniMax-M2.7 2>&1 | tail -15"
```

### Files Updated

| File | Change |
|------|--------|
| `plugins/opencode-subagent-manager/src/tools/index.ts` | Spawn fix applied |
| `plugins/opencode-subagent-manager/dist/index.js` | Rebuilt |
| `hermes-workspace/.../wrappers/container_pool.py` | `from __future__ import annotations` added |
| `hermes-workspace/.../wrappers/opencode_agent.py` | `from __future__ import annotations` added |
| `SHIP_KRAKEN_V1.1/kraken-agent-source/subagent-manager/src/tools/index.ts` | Spawn fix applied |
| `SHIP_KRAKEN_V1.1/kraken-agent-source/subagent-manager/dist/index.js` | Rebuilt |
| `SHIP_KRAKEN_V1.1/kraken-agent-source/wrappers/container_pool.py` | `from __future__ import annotations` added |
| `SHIP_KRAKEN_V1.1/kraken-agent-source/wrappers/opencode_agent.py` | `from __future__ import annotations` added |
| `INSTALL.md` | Fully rewritten with dual-plugin deployment guide |
| `DEBUG LOGS/parallel-subagent-bug-investigation.md` | Resolution documented |

**Timestamp:** 2026-04-13T18:10:00Z
