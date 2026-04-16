# TRIDENT MULTI-MODE — PROJECT ANCHORS

**Version:** 1.0.0
**Date:** 2026-04-16

---

## EXACT PROJECT STRUCTURE

```
Trident Brain/
├── Compaction Survival/
│   ├── 00_COMPACTION_PROOF_KNOWLEDGE_BASE.md
│   ├── 01_PROJECT_ANCHORS.md (this file)
│   ├── 02_EMERGENCY_CONTEXT.md
│   └── 03_SESSION_STATE_TRACKER.md
└── (build artifacts will go here)
```

---

## PLUGIN OUTPUT DIRECTORY

All built plugins will be at:
```
/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Projects/Trident Brain/
├── trident-context-synthesis/    # Plugin 1
├── trident-deep-planning/        # Plugin 2
├── trident-problem-solving/      # Plugin 3
└── trident-multimode-framework/  # Shared framework
```

---

## ARCHITECTURE ASCII DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    TRIDENT MULTI-MODE                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              SHARED FRAMEWORK                        │   │
│  │  ┌───────────┐ ┌────────────┐ ┌──────────────────┐   │   │
│  │  │base-plugin│ │state-machine│ │gate-validator  │   │   │
│  │  └───────────┘ └────────────┘ └──────────────────┘   │   │
│  │  ┌───────────────────┐ ┌──────────────────────┐   │   │
│  │  │artifact-generator │ │ types.ts              │   │   │
│  │  └───────────────────┘ └──────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│          ┌─────────────────┼─────────────────┐             │
│          ▼                 ▼                 ▼             │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐     │
│  │  CONTEXT      │ │  DEEP         │ │  PROBLEM      │     │
│  │  SYNTHESIS    │ │  PLANNING     │ │  SOLVING      │     │
│  ├───────────────┤ ├───────────────┤ ├───────────────┤     │
│  │ Layer 1: COL  │ │ Layer 1: WHAT │ │ Layer 1: ASS  │     │
│  │ Layer 2: SCORE│ │ Layer 2: HOW  │ │ Layer 2: ACT   │     │
│  │ Layer 3: COMPR│ │ Layer 3: EXPLAIN│ │ Layer 3: OBS  │     │
│  │ Layer 4: INJ  │ │               │ │ Layer 4: GAP   │     │
│  │               │ │               │ │ Layer 5: META  │     │
│  │               │ │               │ │ Layer 6: VERIFY│     │
│  └───────────────┘ └───────────────┘ └───────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## V1.2 BRAIN ARCHITECTURE (FOR REFERENCE)

```
┌─────────────────────────────────────────────────────────────┐
│                     KRAKEN ORCHESTRATOR                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  PLANNING   │  │  EXECUTION  │  │      SYSTEM         │  │
│  │   BRAIN     │  │   BRAIN     │  │       BRAIN         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## BUILD STATUS

| Component | Status | Notes |
|-----------|--------|-------|
| Compaction Survival | ✅ | Created |
| Project Structure | 🔄 | In progress |
| Shared Framework | ⬜ | Pending |
| Context Synthesis Plugin | ⬜ | Pending |
| Deep Planning Plugin | ⬜ | Pending |
| Problem Solving Plugin | ⬜ | Pending |
| Container Testing | ⬜ | Pending |

---

## NEW TOOLS ADDED

Each plugin adds a primary tool:
- `trident-context-synthesis` - Synthesizes context from T1/T2/T3/T4 sources
- `trident-deep-plan` - Deep reasoning with 3-layer gates
- `trident-problem-solve` - Evidence-based debugging with 6-layer gates

---

**Created:** 2026-04-16
**Next:** Create 03_SESSION_STATE_TRACKER.md and start build