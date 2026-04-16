# KRAKEN V2.0 PROPER - CONTEXT LIBRARY INDEX

**Version:** 2.0.0-PROPER  
**Date:** 2026-04-13  
**Status:** Ready for building

---

## Quick Start

**Read this first:** [CONTEXT_LIBRARY.md](./CONTEXT_LIBRARY.md)

This index points to all context files needed to build Kraken v2.0 properly.

---

## Context Library Structure

```
kraken-agent-v2.0/
├── CONTEXT_LIBRARY.md                    # Main context library (this file)
├── V2.0_PROPER_CONTEXT.md              # Previous rebuild context (supplemental)
├── V2.0_BROKEN_CONTEXT.md              # Catastrophic failure analysis
│
├── src/
│   └── clusters/
│       └── ClusterInstance.ts           # NEEDS UPDATE: Replace HTTP with spawn
│
└── subagent-manager/
    └── wrappers/
        ├── opencode_agent.py           # REAL executor (verify it's correct)
        └── container_pool.py           # Pool manager (verify it's correct)
```

---

## Key Context Files (External)

| File | Purpose |
|------|---------|
| `/home/leviathan/OPENCODE_WORKSPACE/opencode-python3/CONTEXT_LIBRARY.md` | Python3 image context |
| `/home/leviathan/OPENCODE_WORKSPACE/opencode-python3/README.md` | Image documentation |
| `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/KRAKEN_DEBUG_LOGS/13-kraken-catastrophic-failure-20260413_005709/CATASTROPHIC_FAILURE_REPORT.md` | What NOT to do |
| `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/KRAKEN_DEBUG_LOGS/13-kraken-catastrophic-failure-20260413_005709/FORENSIC_REPORT.md` | Detailed failure analysis |

---

## What Makes v2.0 PROPER vs v2.0-BROKEN

| Aspect | v2.0-BROKEN (Shipped 2026-04-12) | v2.0-PROPER |
|--------|----------------------------------|-------------|
| Bundle Size | 52KB | ~199KB+ (kraken) + ~569KB (shark) + ~158KB (manta) |
| Execution | 100ms fake timeout | Real `spawn('python3', [...])` |
| Python | N/A (no python in container) | `opencode-python3:latest` (3.12.13) |
| Container Spawn | Never happened | Real Docker via wrapper |
| HTTP Daemon | Port 18086 required | Not needed |
| Result | Always success | Real success/failure |

---

## Critical Anti-Theatrical Rules

1. **No `simulateTaskExecution`** - Function must not exist
2. **No `setTimeout(...success: true)`** - No fake success delays
3. **No `// Full implementation would`** - No incomplete code
4. **Bundle sizes must be larger than v1.1** - If smaller = code deleted
5. **Must use `opencode-python3:latest`** - Python3 image required

---

## Ship Readiness Checklist

- [ ] ClusterInstance.ts uses `spawn('python3', [wrapperPath, ...])`
- [ ] No `simulateTaskExecution` in codebase
- [ ] Bundle sizes: kraken >190KB, shark >550KB, manta >150KB
- [ ] `opencode-python3:latest` image exists and has Python 3.12
- [ ] `docker run opencode-python3:latest python3 --version` works
- [ ] Wrapper scripts call real Docker subprocess
- [ ] No HTTP daemon references (port 18086)
- [ ] Tests verify real Docker execution, not just "success: true"

---

## For Agents Building This

**Read in order:**
1. This index
2. [CONTEXT_LIBRARY.md](./CONTEXT_LIBRARY.md) - Full context
3. Relevant source files for your task

**When in doubt:**
- Is it theatrical? → `grep -r "simulate\|setTimeout.*success" src/`
- Is size wrong? → `ls -la */dist/index.js`
- Does it spawn real process? → Must use `spawn('python3', [...])`

---

**Remember:** If you cannot verify it with `docker ps`, it's not real.
