# CHANGELOG — KRAKEN AGENT v1.2

**Version:** 1.2
**Date:** 2026-04-16
**Status:** DEPLOYED & VERIFIED

---

## v1.2 — Multi-Brain Orchestrator

### Features Added
- **Triple-Brain Architecture**: PlanningBrain, ExecutionBrain, SystemBrain
- **Brain-to-Brain Messaging**: Inter-brain communication via messenger system
- **State Store**: Distributed state management across brains
- **Gate System**: Mechanical gate enforcement (plan → build → test → verify → audit → delivery)
- **Enhanced Identity**: Full orchestrator identity with context injection

### Bug Fixes

#### Issue #1: Config Not Updated After Build
**Date:** 2026-04-16
**Problem:** v1.2 was fully built and ship packages were created, BUT `opencode.json` was never updated to load the new plugin.

**Solution:** Manually edited `opencode.json` to point to:
```json
"file:///home/leviathan/.config/opencode/plugins/kraken-v1.2/dist/index.js"
```

**Verification:**
```
[v4.1][kraken-agent] [V1.2] Multi-Brain Orchestrator initialized
```

#### Issue #2: Identity Context Not Loading in Agent Spawn
**Date:** 2026-04-16
**Status:** INVESTIGATION NEEDED

**Problem:** When spawning sub-agents, they respond as vanilla OpenCode instead of Kraken identity.

**Evidence:**
```
User: who are you?
Agent: "I'm Opencode, an interactive CLI tool..."
```

**Required Fix:** Integrate identity context injection into spawn tools.

---

## v1.1 — Agent Type Routing Fix

**Date:** 2026-04-13
**Status:** DEPRECATED

### Bug Fixed: Agent Type Routing
- `spawn_shark_agent` now correctly routes to shark agents
- `spawn_manta_agent` now correctly routes to manta agents

---

## v1.0 — Initial Release

**Date:** 2026-04-11
**Status:** DEPRECATED
