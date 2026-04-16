# Hardware Pressure Test Results — v3 HOTFIX (AFTER MEMORY LEAK FIXES)

**Date**: 2026-04-11  
**Test Subject**: shark-agent-v4.7-hotfix-v3  
**Location**: `/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/`
**Test Goal**: Measure memory/CPU state AFTER implementing session cleanup fixes

---

## System State After v3 Fixes Applied

```
System Memory:
  Mem: 31706 MB total, 23328 MB used, 4962 MB available
  Swap: 8191 MB total, 7809 MB used, 382 MB available
```

**Available RAM**: 4962 MB  
**Swap Used**: 7809 MB (down from 8191 MB full)

---

## OpenCode Sessions Running (7 active)

| PID | RSS (KB) | RSS (GB) |
|-----|----------|----------|
| 4189892 | 4091.7 MB | 4.0 GB |
| 3434456 | 3354.0 MB | 3.3 GB |
| 1539648 | 1503.6 MB | 1.5 GB |
| 1337484 | 1306.1 MB | 1.3 GB |
| 1237420 | 1208.4 MB | 1.2 GB |
| 855220 | 835.2 MB | 0.8 GB |
| 488700 | 477.2 MB | 0.5 GB |

**Total OpenCode RSS**: ~**13.2 GB**

---

## v3 Fixes Implemented

### 1. messenger.ts — Added cleanup()
- Clears `pendingAcks` Map (with timer cleanup)
- Clears `queues` Map
- Clears `receivedAcks` Set

### 2. state-store.ts — Added cleanup()
- Clears `data` Map
- Clears `versions` Map
- Clears `watchers` Map

### 3. gate-hook.ts — Added resetGateHookState()
- Resets `lastDeliveryBlocked = false` on session end

### 4. system-transform-hook.ts — Added resetSystemTransformState()
- Resets `lastInjectedGate = null` on session end

### 5. session-hook.ts — Full session cleanup
On `session.ended` event now calls:
- `stateStore.cleanup()`
- `messenger.cleanup()`
- `dirCreationAttempted = false`
- `resetSystemTransformState()`
- `resetGateHookState()`
- `clearCurrentAgent()`

### 6. index.ts — Wired stateStore and messenger through
- Passed to `createSharkHooks()` 
- Passed to session-hook for cleanup access

---

## Comparison: v2 vs v3

| Metric | v2 (Before) | v3 (After) |
|--------|-------------|------------|
| OpenCode RSS | ~9.5 GB | ~13.2 GB |
| Mem Used | 20498 MB | 23328 MB |
| Swap Used | 8191 MB (FULL) | 7809 MB |
| Available RAM | 8173 MB | 4962 MB |

**Note**: Measurements taken at different times with different number of active sessions. Not a controlled comparison.

---

## Test Methodology

```bash
# Get process list
ps aux | grep opencode

# Get memory state
free -m

# Timestamp
date
```

---

## Next Steps

1. Run controlled comparative test: restart opencode sessions with v3, measure baseline
2. Run 5 sequential shark commands and compare memory delta vs v2
3. Verify 20+ parallel sessions possible without swap exhaustion

---

**Capture Time**: 2026-04-11 20:34  
**Capture Method**: `ps aux` + `free -m`  
**Tester**: Shark Agent / MiniMax-M2.7
