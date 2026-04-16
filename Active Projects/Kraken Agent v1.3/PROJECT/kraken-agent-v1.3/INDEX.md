# KRAKEN AGENT v1.3 — INDEX

## Navigation

| File | Description |
|------|-------------|
| **[INDEX.md](INDEX.md)** | This file — project navigation |
| **[SPEC.md](SPEC.md)** | Project specification and requirements |
| **[BUILD_REPORT.md](.checkpoints/v1.3-post-review-2026-04-16/BUILD_REPORT.md)** | Latest build report |
| **[DEBUG_LOG.md](.checkpoints/v1.3-post-review-2026-04-16/DEBUG_LOG.md)** | Debug log with issues found |
| **[CHANGE_LOG.md](.checkpoints/v1.3-post-review-2026-04-16/CHANGE_LOG.md)** | Changes made during review |
| **[CONTAINER_TEST_REPORT.md](.checkpoints/v1.3-post-review-2026-04-16/CONTAINER_TEST_REPORT.md)** | Container test results |
| **[CONTEXT_LIBRARY.md](kraken-context/T2_PATTERNS.md)** | T2 context library (see kraken-context/) |

---

## Project Structure

```
kraken-agent-v1.3/
├── INDEX.md                    ← You are here
├── SPEC.md                     ← Project specification
├── package.json                ← Dependencies
├── dist/index.js               ← Built bundle (0.57 MB)
├── src/                        ← TypeScript source
│   ├── index.ts                ← Plugin entry point
│   ├── brains/                 ← Triple-brain system
│   ├── clusters/               ← Cluster management
│   ├── factory/                ← Architecture factory
│   ├── hooks/                  ← V2.0 hooks
│   ├── tools/                  ← Agent tools
│   ├── shared/                 ← Shared utilities
│   └── kraken-hive/            ← Hive Mind engine
├── kraken-context/              ← T2 context files
│   ├── T2_PATTERNS.md
│   ├── T2_BUILD_CHAIN.md
│   ├── T2_FAILURE_MODES.md
│   ├── T2_CONTEXT_LIBRARY.md
│   └── T2_INDEX.md
├── subagent-manager/            ← Python wrappers
│   └── wrappers/opencode_agent.py
├── shark-agent/                ← Shark subagent
├── manta-agent/                ← Manta subagent
├── docs/                        ← Legacy documentation
│   ├── ARCHITECTURE_OVERHAUL.md
│   └── V2.0_PROPER_CONTEXT.md
└── .checkpoints/               ← Build checkpoints
    └── v1.3-post-review-2026-04-16/
        ├── BUILD_REPORT.md
        ├── DEBUG_LOG.md
        ├── CHANGE_LOG.md
        └── CONTAINER_TEST_REPORT.md
```

---

## Quick Links

### For Developers
- [SPEC.md](SPEC.md) — What this project is
- [src/index.ts](src/index.ts) — Plugin entry point
- [src/brains/](src/brains/) — Brain implementations

### For Testing
- [CONTAINER_TEST_REPORT.md](.checkpoints/v1.3-post-review-2026-04-16/CONTAINER_TEST_REPORT.md) — Test results
- [DEBUG_LOG.md](.checkpoints/v1.3-post-review-2026-04-16/DEBUG_LOG.md) — Known issues

### For Context
- [kraken-context/](kraken-context/) — T2 context files
- [T2_PATTERNS.md](kraken-context/T2_PATTERNS.md) — Shark/Manta patterns
- [T2_CONTEXT_LIBRARY.md](kraken-context/T2_CONTEXT_LIBRARY.md) — Full context library
- [T2_INDEX.md](kraken-context/T2_INDEX.md) — Context index

---

## Status

| Component | Status |
|-----------|--------|
| Build | ✅ Compiles (0.57 MB bundle) |
| Container Test | ✅ Passed |
| T2 Context | ✅ Loaded |
| Hooks | ✅ Wired (event, chat.message, tool.*) |
| Clusters | ✅ 3 clusters (alpha, beta, gamma) |
| Agents | ✅ 11 agents registered |
| Guardrails | ✅ TwoLayerGuardian active |

---

*Last Updated: 2026-04-16*
