# Hardware Pressure Test Results — v2 HOTFIX (BEFORE V3 FIXES)

**Date**: 2026-04-11  
**Test Subject**: shark-agent-v4.7-hotfix-v2  
**Location**: `/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v2/`
**Test Goal**: Capture baseline memory/CPU state BEFORE memory leak fixes

---

## CRITICAL: System State (Swap FULL)

```
System Memory:
  Mem: 31706 MB total, 20498 MB used, 8173 MB available
  Swap: 8191 MB total, 8191 MB used, 0 MB available
```

**Swap is 100% full** — This is the symptom we need to fix.

---

## OpenCode Sessions (5 active)

| PID | RSS (KB) | RSS (GB) | Process |
|-----|----------|----------|---------|
| 2149816 | 2.1 GB | .opencode (main) |
| 2120244 | 2.0 GB | .opencode (session 2) |
| 1997852 | 1.9 GB | .opencode (session 3) |
| 1114160 | 1.1 GB | .opencode (session 4) |
| 1130272 | 1.1 GB | .opencode (session 5) |
| 880824 | 860 MB | opencode (TUI/shell) |
| 489144 | 478 MB | opencode (another instance) |

**Total OpenCode RSS**: ~**9.5 GB**

---

## Previous Test Findings (2026-04-11)

### Memory Leak Sources Identified (NOT YET FIXED):

1. **messenger.ts** — Unbounded Maps that grow forever:
   - `queues` Map — never cleared
   - `pendingAcks` Map — never cleared
   - `receivedAcks` Set — never cleared

2. **state-store.ts** — Unbounded Maps:
   - `data` Map — never cleared
   - `versions` Map — never cleared
   - `watchers` Map — never cleared

3. **Module-level state that persists across sessions:**
   - `gate-hook.ts:26` — `let lastDeliveryBlocked = false` — NEVER RESET
   - `session-hook.ts:16` — `let dirCreationAttempted = false` — NEVER RESET
   - `system-transform-hook.ts:16` — `let lastInjectedGate: string | null = null` — stale comparison

---

## Test Commands Used

```bash
# Get process list
ps aux | grep opencode

# Get memory state
free -m

# OpenCode sessions (5 total consuming ~9.5GB)
```

---

## Expected Improvement After v3 Fixes

After implementing session-scoped cleanup for Maps/Sets and resetting module-level state:

- **Target**: 20+ parallel shark sessions without swap exhaustion
- **Expected memory per session**: < 500 MB
- **Total for 5 sessions**: < 2.5 GB (down from ~9.5 GB)

---

## Next Steps

1. Implement v3 fixes (clear Maps/Sets on session end)
2. Rebuild and redeploy
3. Run same hardware measurement
4. Compare results

---

**Capture Time**: 2026-04-11
**Capture Method**: `ps aux` + `free -m`
**Tester**: Shark Agent / MiniMax-M2.7
