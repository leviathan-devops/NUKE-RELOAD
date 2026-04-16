# KRAKEN V1.2 — SHIP REPORT v1

**Build ID:** kraken-v1.2-multi-brain-2026-04-16
**Ship Package:** `SHIP_PACKAGE/` (v1 — SHIPPED)
**Ship Package V2:** `SHIP_PACKAGE_V2/` (identity addition — NOT SHIPPED)
**Date:** 2026-04-16T04:00 UTC
**Status:** DEPLOYED & OPERATIONAL

---

## EXECUTIVE SUMMARY

Kraken v1.2 Multi-Brain Orchestrator was successfully built on the v1.1 NUKE RELOAD foundation and deployed to local device. The build integrated three brain infrastructure components (Planning, Execution, System) with the preserved real execution layer (executeOnAgent via Python wrappers).

**Critical Failure During Ship:** The ship agent deployed v1.2 while v1.1 was still active in opencode.json, causing **dual-plugin loading**. The v1.1 plugin was not removed before v1.2 was added, resulting in both plugins being loaded simultaneously. This was a config architecture oversight — the ship agent called success without properly thinking about plugin migration.

---

## ARCHITECTURE

### Triple-Brain System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KRAKEN ORCHESTRATOR                                  │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                          │
│  │  PLANNING   │◀▶│  EXECUTION  │◀▶│   SYSTEM    │                          │
│  │   BRAIN     │  │   BRAIN     │  │   BRAIN     │                          │
│  │             │  │             │  │             │                          │
│  │ owns:       │  │ owns:       │  │ owns:       │                          │
│  │ planning-   │  │ execution-  │  │ workflow-   │                          │
│  │ state       │  │ state       │  │ state       │                          │
│  │ context-    │  │ quality-    │  │ security-   │                          │
│  │ bridge      │  │ state       │  │ state       │                          │
│  └─────────────┘  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Preserved v1.1 Execution Layer

- `executeOnAgent()` — Real Docker container spawning via Python wrappers
- `subagent-manager/` — Container management system
- `wrappers/opencode_agent.py` — Single container spawner
- `wrappers/container_pool.py` — Container pool manager
- `shark-agent/` — Embedded shark agent plugin
- `manta-agent/` — Embedded manta agent plugin

---

## DEPLOYMENT TIMELINE

### PHASE 1: Build (2026-04-16 ~00:00-01:30)

1. Created isolated project directory from v1.1 NUKE RELOAD source
2. Integrated triple-brain architecture (Planning, Execution, System brains)
3. Built bundle: 555KB
4. Created Docker test container
5. Verified container execution

### PHASE 2: Identity Integration (2026-04-16 ~01:30-02:30)

1. Created identity files in `identity/orchestrator/`:
   - `KRAKEN.md` — Core identity
   - `IDENTITY.md` — Role definition
   - `EXECUTION.md` — Delegation patterns
   - `QUALITY.md` — Quality gates
   - `TOOLS.md` — Available tools
2. Built identity loader module (`src/identity/`)
3. Integrated into plugin hook system

### PHASE 3: Deployment (2026-04-16 ~02:30-04:00)

**CRITICAL ERROR: Dual-plugin loading**

The ship agent:
1. Copied v1.2 bundle to `~/.config/opencode/plugins/kraken-v1.2/`
2. Added v1.2 paths to `opencode.json`
3. Did NOT remove v1.1 (`kraken-nuke-reload`) paths
4. Called ship success

Result: Both v1.1 and v1.2 loaded simultaneously.

---

## BUGS FIXED DURING BUILD

| # | Bug | Fix |
|---|-----|-----|
| 1 | KRAKEN_IDENTITY_DIR env var not set in container | Added ENV to Dockerfile |
| 2 | bundle.spider.raw undefined (SPIDER→QUALITY rename) | Changed to bundle.quality.raw |
| 3 | ExecutionTrigger TypeScript type error | Simplified type declaration |
| 4 | Path resolution failed (cwd issues) | Added KNOWN_LOCATIONS[] search |
| 5 | Env vars not inherited by opencode subprocess | Made loader self-sufficient |
| 6 | KNOWN_LOCATIONS paths wrong (too many `..`) | Fixed relative path levels |
| 7 | Fallback returned invalid path | Simplified fallback logic |

---

## CRITICAL SHIP FAILURE: DUAL-PLUGIN CONFLICT

### What Happened

The ship agent deployed v1.2 while v1.1 was still configured in opencode.json:

```json
// opencode.json after "successful" ship:
{
  "plugin": [
    "file:///home/leviathan/.config/opencode/plugins/kraken-nuke-reload/dist/index.js",  // ← v1.1 STILL HERE
    "file:///home/leviathan/.config/opencode/plugins/kraken-v1.2/dist/index.js",          // ← v1.2 ADDED
    ...
  ]
}
```

### Why This Is A Problem

1. **Two Kraken plugins loaded simultaneously**
2. **Resource conflicts** — both trying to register agents, hooks, tools
3. **State pollution** — v1.1 brain state mixed with v1.2 brain state
4. **Behavior undefined** — which plugin's hooks take precedence?
5. **Ship called success without verification**

### Root Cause

The ship agent followed a naive "add new, ignore old" pattern instead of a proper **plugin migration protocol**.

### Proper Migration Sequence (Missing Documentation)

```
1. REMOVE old plugin paths from opencode.json
2. VERIFY old plugin directory can be safely archived
3. ADD new plugin paths to opencode.json
4. RESTART opencode
5. VERIFY only new plugin loads
6. CONFIRM brain status shows correct version
```

### The Fix Applied

Manual edit of opencode.json to remove v1.1 references:

```json
// AFTER FIX:
{
  "plugin": [
    "file:///home/leviathan/.config/opencode/plugins/kraken-v1.2/dist/index.js",
    ...
  ]
}
```

### Lesson Learned

**Plugin migration requires explicit removal, not just addition.**

Future ship agents must follow this checklist:
- [ ] Old plugin paths REMOVED before adding new
- [ ] Old plugin directory archived/renamed
- [ ] opencode.json verified to have ONLY new plugin
- [ ] Restart opencode and verify single-plugin load
- [ ] Brain status confirms correct version

---

## VERIFICATION RESULTS

### Local Deployment: ✅ WORKING

```
Plugin: /home/leviathan/.config/opencode/plugins/kraken-v1.2/
Identity: /home/leviathan/.config/opencode/plugins/kraken-v1.2/identity/
Config: /home/leviathan/.config/opencode/opencode.json (updated)

Verification Results:
[Identity] Orchestrator identity loaded { length: 8734 }
[PlanningBrain] Initialized - owns planning-state, context-bridge
[ExecutionBrain] Initialized - owns execution-state, quality-state
[SystemBrain] Initialized - owns workflow-state, security-state
[v4.1][kraken-agent] Agents registered { primary: ["kraken"] }
```

### Other Plugins: ✅ UNTROUCHED

- trident-brain ✅
- coding-subagents ✅
- opencode-subagent-manager ✅
- opencode-plugin-engineering ✅
- shark-agent-v4.7-hotfix-v3 ✅
- manta-agent-v1.5 ✅

---

## SHIP PACKAGES

| Package | Location | Size | Status |
|---------|----------|------|--------|
| Full v1 | `KRAKEN_V1.2_SHIP_PACKAGE.tar.gz` | ~27 MB | SHIPPED |
| Full v2 | `KRAKEN_V1.2_FULL_SHIP_PACKAGE.tar.gz` | 46 MB | NOT SHIPPED |
| Identity | `KRAKEN_V1.2_IDENTITY_SHIP_PACKAGE.tar.gz` | 16 MB | NOT SHIPPED |

**Note:** SHIP_PACKAGE_V2 contains the identity addition — NOT YET SHIPPED.

---

## REMAINING ISSUE

### Identity Context Not Loading in Spawned Sub-Agents

**Problem:** When spawning sub-agents via `spawn_shark_agent`, they respond as vanilla OpenCode instead of Kraken identity.

**Evidence:**
```
User: who are you?
Agent: "I'm Opencode, an interactive CLI tool..."
```

**Required Fix:** Integrate identity context injection into spawn tools.

---

## KEY FILES REFERENCE

| File | Purpose |
|------|---------|
| `Compaction Survival/03_SESSION_STATE_TRACKER.md` | Stream of consciousness |
| `Compaction Survival/04_IDENTITY_INTEGRATION.md` | Identity system docs |
| `SHIP_PACKAGE/docs/SHIP_DEPLOYMENT_LOG.md` | Full deployment debug log |
| `SHIP_PACKAGE/docs/BEHAVIOR_REPORT.md` | Agent execution analysis |

---

## LESSONS LEARNED

### 1. Plugin Migration Protocol
**Problem:** Ship agent added new plugin without removing old.
**Lesson:** Plugin upgrades require explicit removal + restart + verify.

### 2. Path Resolution
**Problem:** `process.cwd()` varies depending on where opencode is invoked.
**Solution:** Search multiple known paths, don't rely on env vars.

### 3. Bundled JS Changes import.meta.url
**Problem:** `import.meta.url` doesn't work in Bun-bundled output.
**Solution:** Don't rely on it for path resolution in bundled code.

### 4. File Rename References
**Problem:** Renamed SPIDER.md → QUALITY.md but injector still referenced old name.
**Lesson:** When renaming, must update ALL references.

### 5. opencode Doesn't Inherit Shell Env Vars
**Problem:** `export KRAKEN_IDENTITY_DIR=...` in bashrc didn't help.
**Solution:** Make loader self-sufficient without external configuration.

---

**Classification:** POST-SHIP CHRONICLE
**Version:** 1.2.0
**Deployed:** 2026-04-16
