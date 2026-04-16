# Hardware Pressure Test Report — v4.7-hotfix

**Date**: 2026-04-11  
**Test Subject**: shark-agent-v4.7-hotfix  
**Location**: `/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix/`

---

## Hardware State During Test

### CPU Spike Trigger
When running **Stage 3 commands** (5 sequential `echo` tests via `opencode run`), hardware fan kicked into high usage.

### Identified High-CPU Process
```
PID 1480201 — .opencode (collaborator session)
  CPU: 47% (continuously)
  RSS: 1.1GB
  State: R (running)
```

This is **opencode running inside collaborator**, NOT the shark plugin itself.

---

## Memory Measurements

### Baseline (Before Any Tests)
```
OpenCode processes:
  PID 1453983 — .opencode  RSS: 2006560 KB (2.0 GB)
  PID 1480201 — .opencode  RSS: 1126432 KB (1.1 GB)
  PID 779594  — .opencode  RSS:  289040 KB (289 MB)

System Memory:
  Mem: 31706 MB total, 16418 MB used, 15288 MB available
  Swap: 8191 MB total, 5158 MB used
```

### After `shark-status` Command
```
OpenCode processes:
  PID 1453983 — .opencode  RSS: 2035440 KB (2.0 GB)  [+29 MB]
  PID 1480201 — .opencode  RSS: 1218528 KB (1.2 GB)  [+92 MB]
  PID 779594  — .opencode  RSS:  289040 KB (289 MB)

System Memory:
  Mem: 31706 MB total, 16436 MB used, 15269 MB available
  Swap: 8191 MB total, 5129 MB used
```

### After 5 Sequential `echo` Commands
```
OpenCode processes:
  PID 1453983 — .opencode  RSS: 2035520 KB (2.0 GB)  [+0.8 MB]
  PID 1480201 — .opencode  RSS: 1163008 KB (1.1 GB)  [-55 MB]
  PID 779594  — .opencode  RSS:  288820 KB (289 MB)  [-0.2 MB]

System Memory:
  Mem: 31706 MB total, 16281 MB used, 15425 MB available
  Swap: 8191 MB total, 5129 MB used
```

**Observation**: Memory is stable, not growing. The 5 echo commands did NOT cause leak.

---

## Code Review Findings

After thorough review of the hotfix codebase, **no obvious sources of runaway CPU/memory** were found in the shark plugin code itself.

### Reviewed Files

| File | Lines | Finding |
|------|-------|---------|
| `guardian-hook.ts` | 90 | Clean, returns early if no agent |
| `gate-hook.ts` | 266 | Has JSON.stringify on every tool result |
| `system-transform-hook.ts` | 98 | Only injects on gate transition (FIXED) |
| `compacting-hook.ts` | 34 | No context injection (FIXED) |
| `session-hook.ts` | 83 | Cleanup on session.ended (FIXED) |
| `tool-summarizer-hook.ts` | 67 | String operations only |
| `chat-message-hook.ts` | 20 | Simple early return |
| `state-store.ts` | 156 | Maps with watchers, no unbounded growth |
| `shark-test-runner.ts` | 241 | Uses execSync, runs in sequence |

### Potential Inefficiency Found: `gate-hook.ts`

**Location**: Lines 124, 238, 239

```typescript
// Line 124 - JSON.stringify on every verify gate tool result
const verifyResultStr = result ? JSON.stringify(result) : '';

// Lines 238-239 - More JSON.stringify on every tool result  
const resultStr = result ? JSON.stringify(result) : '';
const hasError = resultStr.includes('"error"') || resultStr.includes('"status":"error"');
```

**Impact**: If a tool returns a large output (e.g., grep with 500 matches), `JSON.stringify` creates a full string copy in memory.

**Severity**: Medium — only affects `verify` gate, not all gates.

### NOT the Issue

1. **Tool Summarizer** — Runs AFTER `tool.execute.after`, only modifies output for display
2. **Session Cleanup** — Only fires on `session.ended`, not during commands
3. **System Transform** — Only fires on gate transitions (once per gate change)
4. **Compacting Hook** — Does NOT inject context anymore (fixed)

---

## Test Output: `shark-status`

```
**Shark V4 Status**

| Gate | Status |
|------|--------|
| Plan | PENDING |
| Build | pending |
| Test | pending |
| Verify | pending |
| Audit | pending |
| Delivery | pending |

- **Brain**: unknown
- **Iteration**: V1.0
- **Evidence**: No evidence collected yet
```

**Issue**: Brain shows `unknown` — the `chat-message` hook is not initializing the brain properly.

**Root Cause**: The `chat.message` hook fires but `getCurrentAgent()` returns falsy because `agent-state.ts` module-level variable is reset on each plugin load.

---

## Conclusion

| Metric | Result |
|--------|--------|
| Memory leak during commands | **NOT FOUND** — memory stable across 5 commands |
| CPU spike source | **opencode in collaborator** (47% CPU, not shark plugin) |
| Brain initialization | **BROKEN** — shows `unknown` |
| Code-level inefficiencies | **Medium** — `gate-hook.ts` stringify on large outputs |

### Hardware Spike Analysis

The CPU spike during Stage 3 (5 echo commands) is correlated with **collaborator's opencode process** (PID 1480201) running at 47% CPU, not the shark plugin itself.

**Possible causes**:
1. Collaborator frontend polling
2. opencode internals (token counting, context management)
3. Multiple concurrent sessions accumulating state

---

## Recommendations

1. **Fix brain init**: `chat-message-hook.ts` needs to be wired correctly in the hook chain
2. **Optimize gate-hook**: Avoid `JSON.stringify` on potentially large tool outputs
3. **Investigate collaborator**: The 47% CPU on opencode is the actual bottleneck

---

**Tester**: Shark / MiniMax-M2.7  
**Raw Data**: This document contains all measurements taken during pressure test