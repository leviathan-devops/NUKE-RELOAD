# IDENTITY CONTEXT INTEGRATION PLAN

**Created:** 2026-04-16
**Status:** PENDING IMPLEMENTATION
**Owner:** Kraken v1.2 Overhaul

---

## PROBLEM STATEMENT

When spawning sub-agents via `spawn_shark_agent`, `spawn_manta_agent`, or `spawn_cluster_task`, the agent does NOT respond with Kraken identity - instead responds as vanilla OpenCode/chatbot.

**Expected:** Agent should introduce itself as Kraken orchestrator with full identity context
**Actual:** Agent responds "I'm Opencode, an interactive CLI tool..."

---

## REQUIRED FIXES

### 1. Identity Files Location
```
~/.config/opencode/plugins/kraken-v1.2/identity/
```
Contents needed:
- `KRAKEN.md` - Core identity statement
- `IDENTITY.md` - Role in swarm
- `EXECUTION.md` - Delegation philosophy
- `TOOLS.md` - Tool descriptions
- Other identity files

### 2. Agent Spawn Tool Modification

Current flow:
```
spawn_shark_agent(task) → create container → run subagent
```

Required flow:
```
spawn_shark_agent(task) → load identity context → inject into task → create container → run subagent with identity
```

### 3. Files to Modify

| File | Purpose |
|------|---------|
| `src/tools/cluster-tools.ts` | Modify spawn tools to inject identity |
| `src/v4.1/context/hook-context.ts` | Ensure identity is in context |
| `src/v4.1/config/identity.ts` | Ensure identity loading |

### 4. Implementation Approach

**Option A: Context Injection (Recommended)**
- Before spawning, load identity files
- Inject as system prompt prefix to sub-agent
- Pass through `context` parameter in spawn call

**Option B: File-based Identity**
- Subagent reads identity files on startup
- Requires identity folder mounted in container
- Less reliable

### 5. Verification Tests

| Test | Expected Result |
|------|-----------------|
| Spawn shark → "who are you?" | "I am Kraken orchestrator..." |
| Spawn manta → "who are you?" | "I am Kraken precision agent..." |
| Spawn cluster → "who are you?" | Cluster identity response |

---

## DEPENDENCIES

- Identity files must exist in `~/.config/opencode/plugins/kraken-v1.2/identity/`
- Container must have access to identity files (volume mount or copy)
- `spawn_*` tools must support `context` parameter injection

---

## IMPLEMENTATION STEPS

1. **Verify identity folder exists and contents**
2. **Modify cluster-tools.ts** - Add identity injection to spawn functions
3. **Test with manual spawn** - Verify identity appears in new session
4. **Run full test suite** - Verify all identity tests pass
5. **Document any issues** - Add to nuke reload anchor

---

## REFERENCE

- Test Suite: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Projects/v1.2 Rebuild/TEST_PACKAGE/TEST_SUITE.md`
- Identity Tests: KRAKEN-101 through KRAKEN-110
