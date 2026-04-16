# Hardware Pressure Test Results — v3 HOTFIX

**Date**: 2026-04-11  
**Test Subject**: shark-agent-v4.7-hotfix-v3  
**GitHub**: https://github.com/leviathan-devops/shark-agent-v4.7-hotfix

---

## BEFORE vs AFTER v3 Comparison

### State: BEFORE (Old Sessions Running)
```
Total OpenCode RSS: ~12.6 GB (13 processes)
Mem: 23190 MB used, 5170 MB available
Swap: 8190/8191 MB used (99.99% FULL)
```

### State: AFTER Restart (More Sessions Added)
```
Total OpenCode RSS: ~19.1 GB (16 processes)
Mem: 28569 MB used, 427 MB available
Swap: 8191/8191 MB used (100% FULL)
```

---

## IMPORTANT CAVEAT

**The v3 fix only applies to NEW sessions.**

Existing sessions are still running with the OLD plugin code. The memory leak fix will only take effect when:
1. Old sessions are closed
2. New sessions load v3

This explains why the current state shows MORE memory usage — there are now MORE active sessions.

---

## v3 Memory Leak Fixes (Pushed to GitHub)

| File | Fix |
|------|-----|
| `messenger.ts` | Added `cleanup()` to clear queues, pendingAcks, receivedAcks |
| `state-store.ts` | Added `cleanup()` to clear data, versions, watchers Maps |
| `gate-hook.ts` | Added `resetGateHookState()` to reset `lastDeliveryBlocked` |
| `system-transform-hook.ts` | Added `resetSystemTransformState()` to reset `lastInjectedGate` |
| `session-hook.ts` | Calls ALL cleanup functions on `session.ended` |
| `index.ts` | Wires stateStore and messenger through to session-hook |

---

## Next Steps for Valid Test

1. Close all existing opencode sessions
2. Start FRESH sessions with v3 loaded
3. Run same 5 sequential commands test
4. Compare memory delta vs old sessions

**Expected Result with v3**: Memory should stay stable across sessions, no unbounded growth.

---

**Commit**: bc430d6  
**Pushed**: Yes  
**Tester**: Shark Agent / MiniMax-M2.7
