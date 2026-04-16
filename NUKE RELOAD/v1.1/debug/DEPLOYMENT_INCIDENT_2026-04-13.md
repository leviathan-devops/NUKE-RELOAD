# DEPLOYMENT INCIDENT — KRAKEN v1.1 SILENT LOAD FAILURE
**Date:** 2026-04-13  
**Severity:** HIGH — Kraken disappeared from tab toggle entirely  
**Status:** RESOLVED ✅  

---

## Timeline

| Time (approx UTC) | Event |
|-------------------|-------|
| ~19:00 | v1.1 SHIP package built, container tests pass, `~/.config/opencode/plugins/kraken-agent-v1.1/dist/index.js` written (523KB build) |
| ~19:15 | First deployment attempt: `opencode.json` NOT updated. v1.0 still active. |
| ~21:00 | Second deployment attempt: `opencode.json` updated to spaced path. Session crashes. Kraken gone from toggle. |
| ~21:20 | Diagnostic session starts. `opencode.json` inspected — spaced path found. |
| ~21:25 | Root cause confirmed via `opencode debug config --log-level DEBUG` in container. |
| ~21:32 | SHIP build (527KB, newer) copied to plugin dir with node_modules. |
| ~21:35 | `opencode.json` updated to correct path. Container re-verified. |
| ~21:35 | All tests pass. RESOLVED. |

---

## Root Cause Analysis

### Bug 1 — Spaces in file:// URI (primary cause of crash)

**What was set in opencode.json:**
```
file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v1.1/SHIP_KRAKEN_V1.1/build/index.js
```

**Why it fails:** The `file://` scheme requires percent-encoded spaces (`%20`). OpenCode's plugin loader receives the literal path with spaces and fails to resolve the file. The failure is **silent at default log level** — the plugin is simply not registered. Because Kraken fails, the plugins listed after it (Shark, Manta) also do not load.

**Detection:**
```bash
opencode debug config --print-logs --log-level DEBUG 2>&1 | grep -i 'plugin\|error'
# At default level: no error shown, plugin just absent
# At DEBUG level: error surfaces
```

**Rule:** Never put paths with spaces in opencode.json plugin entries. All plugin paths must use directories with no spaces.

---

### Bug 2 — Missing node_modules (secondary, discovered during fix)

When attempting to fix by creating a clean directory at a spaces-free path:
```bash
mkdir -p /home/leviathan/OPENCODE_WORKSPACE/plugins/kraken-agent-v1.1/dist/
cp build/index.js /home/leviathan/OPENCODE_WORKSPACE/plugins/kraken-agent-v1.1/dist/
```

This also fails:
```
ERROR service=plugin path=file:///workspace/plugins/kraken-agent-v1.1/dist/index.js
target=file:///workspace/plugins/kraken-agent-v1.1/dist/index.js
error=Cannot find module '@opencode-ai/plugin' from '/workspace/plugins/kraken-agent-v1.1/dist/index.js'
failed to load plugin
```

**Why:** The plugin is built with `--external @opencode-ai/plugin` (Bun build flag). This means the bundle does NOT include `@opencode-ai/plugin` — it expects the host to provide it at runtime. OpenCode resolves this module from `node_modules` adjacent to the plugin file's directory. A bare dist-only directory has no `node_modules`.

**All working plugins have node_modules:**
```
/home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/
  ├── node_modules/           ← present, @opencode-ai/plugin installed
  └── dist/index.js

/home/leviathan/.config/opencode/plugins/kraken-agent-v1.1/
  ├── node_modules/           ← present, @opencode-ai/plugin installed
  └── dist/index.js           ← SHIP build copied here = working
```

**Rule:** Plugin deployment target must be a directory with `bun install` (or `npm install`) already run. Never deploy to a bare dist-only directory.

---

## Diagnostic Commands

### Check if plugin loaded (run before starting OpenCode session):
```bash
opencode debug config --print-logs --log-level DEBUG 2>&1 | grep -E 'kraken|plugin|ERROR|WARN' -i
```

**Healthy output:**
```
INFO  service=plugin path=file:///home/leviathan/.config/opencode/plugins/kraken-agent-v1.1/dist/index.js loading plugin
[v4.1][kraken-agent] Initializing Kraken Agent Harness { clusters: 3, agents: 11 }
[v4.1][kraken-agent] Kraken Agent Harness initialized { clusterCount: 3, totalAgents: 11, krakenHiveReady: true }
```

**Broken output (spaced path):**
```
INFO  service=plugin path=file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/... loading plugin
# ...then nothing. No init message. No error at default log level.
```

**Broken output (missing node_modules):**
```
ERROR service=plugin ... error=Cannot find module '@opencode-ai/plugin' failed to load plugin
```

---

## Container Verification Protocol

Used to verify the fix before applying to local runtime.

### Setup:
```bash
# Create test config dir
mkdir -p /tmp/kraken-v1.1-test/config

# Build test opencode.json (same as local but with container-relative workspace path)
python3 -c "
import json
cfg = json.load(open('/home/leviathan/.config/opencode/opencode.json'))
cfg['plugin'] = [
    'file:///workspace/plugins/opencode-subagent-manager/dist/index.js',
    'file:///workspace/plugins/coding-subagents/dist/index.js',
    'file:///workspace/plugins/opencode-plugin-engineering/dist/index.js',
    'file:///home/leviathan/.config/opencode/plugins/kraken-agent-v1.1/dist/index.js',
    'file:///workspace/plugins/shark-agent-v4.7-hotfix-v3/dist/index.js',
    'file:///workspace/plugins/manta-agent-v1.5/dist/index.js',
]
json.dump(cfg, open('/tmp/kraken-v1.1-test/config/opencode.json','w'), indent=4)
"
```

### Run load test:
```bash
docker run --rm \
  --entrypoint /bin/bash \
  -v /home/leviathan/OPENCODE_WORKSPACE:/workspace \
  -v /tmp/kraken-v1.1-test/config:/root/.config/opencode \
  -v /home/leviathan/.config/opencode/plugins/kraken-agent-v1.1:/home/leviathan/.config/opencode/plugins/kraken-agent-v1.1:ro \
  -e MINIMAX_API_KEY="$MINIMAX_API_KEY" \
  opencode-test:1.4.3 \
  -c "opencode debug config --print-logs --log-level DEBUG 2>&1 | grep -i 'kraken\|plugin\|error'"
```

### Run functional tests:
```bash
# Test 1: Cluster status
docker run --rm --entrypoint /bin/bash \
  -v /home/leviathan/OPENCODE_WORKSPACE:/workspace \
  -v /tmp/kraken-v1.1-test/config:/root/.config/opencode \
  -v /home/leviathan/.config/opencode/plugins/kraken-agent-v1.1:/home/leviathan/.config/opencode/plugins/kraken-agent-v1.1:ro \
  -e MINIMAX_API_KEY="$MINIMAX_API_KEY" \
  opencode-test:1.4.3 \
  -c "opencode run 'call get_cluster_status and show all clusters and agents' -m minimax/MiniMax-M2.7 2>&1 | tail -20"

# Test 2: Shark routing (v1.1 fix)
docker run --rm --entrypoint /bin/bash \
  -v /home/leviathan/OPENCODE_WORKSPACE:/workspace \
  -v /tmp/kraken-v1.1-test/config:/root/.config/opencode \
  -v /home/leviathan/.config/opencode/plugins/kraken-agent-v1.1:/home/leviathan/.config/opencode/plugins/kraken-agent-v1.1:ro \
  -e MINIMAX_API_KEY="$MINIMAX_API_KEY" \
  opencode-test:1.4.3 \
  -c "opencode run 'call spawn_shark_agent task=\"routing test\" priority=\"high\" and report the agentType' -m minimax/MiniMax-M2.7 2>&1 | tail -15"

# Test 3: Manta routing
docker run --rm --entrypoint /bin/bash \
  -v /home/leviathan/OPENCODE_WORKSPACE:/workspace \
  -v /tmp/kraken-v1.1-test/config:/root/.config/opencode \
  -v /home/leviathan/.config/opencode/plugins/kraken-agent-v1.1:/home/leviathan/.config/opencode/plugins/kraken-agent-v1.1:ro \
  -e MINIMAX_API_KEY="$MINIMAX_API_KEY" \
  opencode-test:1.4.3 \
  -c "opencode run 'call spawn_manta_agent task=\"routing test\" priority=\"normal\" and report the agentType' -m minimax/MiniMax-M2.7 2>&1 | tail -15"
```

---

## Evidence — Actual Test Output (2026-04-13)

### Load verification:
```
INFO  service=plugin path=file:///home/leviathan/.config/opencode/plugins/kraken-agent-v1.1/dist/index.js loading plugin
[v4.1][kraken-agent] Initializing Kraken Agent Harness { clusters: 3, agents: 11 }
[v4.1][kraken-agent] Kraken Agent Harness initialized { clusterCount: 3, totalAgents: 11, krakenHiveReady: true }
[v4.1][kraken-agent] Agents registered { count: 11, primary: ["kraken"] }
```

### Cluster status:
```
| cluster-alpha | shark-alpha-1, shark-alpha-2, manta-alpha-1 |
| cluster-beta  | shark-beta-1, manta-beta-1, manta-beta-2    |
| cluster-gamma | manta-gamma-1, manta-gamma-2, shark-gamma-1  |
Agents: 9 total, all available (0 busy)
```

### Shark routing:
```
[ClusterInstance] Spawning container for agent shark-gamma-1
spawn_shark_agent → agentType: "shark" ✅
```

### Manta routing:
```
[ClusterInstance] Spawning container for agent manta-gamma-1
spawn_manta_agent → agentType: "manta" ✅
```

---

## Final State (Resolved)

| Item | Value |
|------|-------|
| Active plugin path | `~/.config/opencode/plugins/kraken-agent-v1.1/dist/index.js` |
| Build size | 527585 bytes |
| Build date | 2026-04-13 21:32 |
| node_modules present | ✅ Yes |
| path spaces | ✅ None |
| opencode.json entry | `file:///home/leviathan/.config/opencode/plugins/kraken-agent-v1.1/dist/index.js` |
| Container verified | ✅ opencode-test:1.4.3 |
| Routing fix active | ✅ shark→shark, manta→manta |

---

## Rules for Future Deployments

1. **Never** use paths with spaces in opencode.json plugin entries
2. **Always** deploy to a directory that has had `bun install` run (node_modules present)
3. **Always** verify with `opencode debug config --log-level DEBUG` before declaring success
4. **Always** container-test before touching local opencode.json
5. **Check plugin loaded** by looking for `[kraken-agent] Kraken Agent Harness initialized` in startup logs
