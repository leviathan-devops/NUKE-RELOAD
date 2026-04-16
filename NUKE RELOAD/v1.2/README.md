# KRAKEN V1.2 - NUKE RELOAD ANCHOR

**Created:** 2026-04-16
**Status:** DEPLOYED & VERIFIED
**Engine:** v4.1

---

## DEPLOYMENT TIMELINE

### 2026-04-16 - Ship & Deploy Issues

#### ISSUE #1: Config Not Updated After Build
**Problem:** v1.2 was fully built and ship packages were created, BUT `opencode.json` was never updated to load the new plugin.

**Evidence:**
- Ship packages created in `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Projects/v1.2 Rebuild/`:
  - `KRAKEN_V1.2_FULL_SHIP_PACKAGE.tar.gz` (79MB)
  - `KRAKEN_V1.2_SHIP_PACKAGE.tar.gz` (27MB)
- Plugin extracted to: `~/.config/opencode/plugins/kraken-v1.2/`
- BUT config still referenced OLD workspace path:
  ```
  file:///home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1/dist/index.js
  ```

**Symptom:** System loaded v1.1 instead of v1.2

**Solution:** Manually edited `opencode.json` to point to:
```
file:///home/leviathan/.config/opencode/plugins/kraken-v1.2/dist/index.js
```

**Verification:**
```
[v4.1][kraken-agent] [V1.2] Multi-Brain Orchestrator initialized
```

---

## CURRENT STATE (VERIFIED)

### Active Plugins
| Plugin | Path |
|--------|------|
| kraken-v1.2 | `~/.config/opencode/plugins/kraken-v1.2/` |
| shark-agent | `~/.config/opencode/plugins/kraken-v1.2/shark-agent/` |
| manta-agent | `~/.config/opencode/plugins/kraken-v1.2/manta-agent/` |
| subagent-manager | `~/.config/opencode/plugins/kraken-v1.2/subagent-manager/` |

### Cluster Status
- ✅ cluster-alpha (3 agents: shark-alpha-1, shark-alpha-2, manta-alpha-1)
- ✅ cluster-beta (3 agents: shark-beta-1, manta-beta-1, manta-beta-2)
- ✅ cluster-gamma (3 agents: manta-gamma-1, manta-gamma-2, shark-gamma-1)

### System Health
- PlanningBrain: initialized
- ExecutionBrain: initialized (0 tasks)
- SystemBrain: initialized (gate: plan)
- krakenHiveReady: true

---

## KNOWN ISSUES

### ISSUE #2: Identity Context Not Loading in Agent Spawn
**Status:** INVESTIGATION NEEDED

Initial tests show:
- Kraken orchestrator identity loads correctly
- Multi-brain orchestration initializes
- BUT agent spawn may not be injecting identity context properly

**Evidence from test:**
```
User: who are you?
Agent: "I'm Opencode, an interactive CLI tool..."
```

Should respond as Kraken orchestrator with full identity context.

**Required Fix:** Integrate identity context injection into `spawn_shark_agent`, `spawn_manta_agent`, and `spawn_cluster_task` tools.

---

## IDENTITY FILES STATUS

**Location:** `~/.config/opencode/plugins/kraken-v1.2/identity/orchestrator/`

| File | Status | Size |
|------|--------|------|
| KRAKEN.md | ✅ Present | 1518 bytes |
| IDENTITY.md | ✅ Present | 1046 bytes |
| EXECUTION.md | ✅ Present | 3265 bytes |
| TOOLS.md | ✅ Present | 1206 bytes |
| QUALITY.md | ✅ Present | 1574 bytes |

---

## CONFIG LOCATION

```
~/.config/opencode/opencode.json
```

**Active Kraken entries (lines 384-387):**
```json
"file:///home/leviathan/.config/opencode/plugins/kraken-v1.2/subagent-manager/dist/index.js",
"file:///home/leviathan/.config/opencode/plugins/kraken-v1.2/dist/index.js",
"file:///home/leviathan/.config/opencode/plugins/kraken-v1.2/shark-agent/dist/index.js",
"file:///home/leviathan/.config/opencode/plugins/kraken-v1.2/manta-agent/dist/index.js",
```

---

## RELOAD COMMANDS

### To Reload After Any Changes:
```bash
# Restart opencode to reload plugins
opencode debug config
```

### To Verify v1.2 is Loaded:
```bash
opencode debug config 2>&1 | grep "V1.2"
```

Expected output:
```
[v4.1][kraken-agent] [V1.2] Multi-Brain Orchestrator initialized
```

---

## RELATED DOCUMENTS

- Identity Integration Plan: `IDENTITY_INTEGRATION_PLAN.md`
