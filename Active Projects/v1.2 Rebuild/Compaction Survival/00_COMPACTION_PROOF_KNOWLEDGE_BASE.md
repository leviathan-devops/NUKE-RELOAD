# KRAKEN V1.2 — COMPACTION-PROOF BUILD WORKFLOW

**Version:** 1.0 | **Purpose:** Build v1.2 Multi-Brain Orchestrator

---

## 🚨 POST-COMPACTION RECOVERY

**READ THIS FIRST IF COMPACTED:**

1. Read `00_COMPACTION_PROOF_KNOWLEDGE_BASE.md` (this dir)
2. Read `03_SESSION_STATE_TRACKER.md`
3. Read `01_PROJECT_ANCHORS.md` for project structure
4. Resume from last decision point

---

## THE ONE RULE

**IF IT'S NOT REAL, IT'S NOT DONE.**

---

## PROJECT STRUCTURE

**Project:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Projects/v1.2 Rebuild/`

**Source Base:** NUKE RELOAD v1.1 (`Shared Workspace Context/Kraken Agent/NUKE RELOAD/v1.1/kraken-agent-source/`)

**Target:** v1.2 Multi-Brain Orchestrator

---

## V1.2 ARCHITECTURE

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  PLANNING   │────▶│  EXECUTION  │◀────│   SYSTEM    │
│   BRAIN     │     │   BRAIN    │     │   BRAIN     │
│             │     │            │     │             │
│ owns:       │     │ owns:      │     │ owns:       │
│ planning-   │     │ execution- │     │ workflow-   │
│ state       │     │ state      │     │ state       │
│ context-    │     │ quality-   │     │ security-   │
│ bridge      │     │ state      │     │ state       │
└─────────────┘     └─────────────┘     └─────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                   ┌────────┴────────┐
                   │ BRAIN MESSENGER│
                   │ Priority signal│
                   └────────┬────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
  │   ALPHA     │    │    BETA     │    │   GAMMA     │
  │  CLUSTER    │    │  CLUSTER    │    │  CLUSTER    │
  │  (steamroll)│    │ (precision) │    │  (testing)  │
  └─────────────┘    └─────────────┘    └─────────────┘
```

---

## COMPACTION TIER SYSTEM

| Threshold | Tier | Action |
|-----------|------|--------|
| ~110K | 0 | Light pruning (DynamicContextPruner) |
| 140-150K | 1 | PRE-EXPORT via hook |
| ~170-175K | 2 | AUTO-COMPACT (OpenCode native) |
| Post-compact | 3 | RELOAD from state tracker |

---

## KEY FILES

| File | Purpose |
|------|---------|
| `src/brains/planning/planning-brain.ts` | T2 Master loading, T1 generation |
| `src/brains/execution/execution-brain.ts` | Task supervision, output verification |
| `src/brains/system/system-brain.ts` | Workflow state, security, gates |
| `src/shared/brain-messenger.ts` | Inter-brain priority messaging |
| `src/shared/domain-ownership.ts` | State domain ownership rules |
| `src/clusters/ClusterInstance.ts` | **REAL** executeOnAgent (keep as-is) |

---

## ALIGNMENT BIBLE (ALWAYS REFERENCED)

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/KRAKEN_ALIGNMENT_BIBLE.md`

**Key Rules:**
- executeOnAgent NOT simulateTaskExecution
- Hooks are async functions NOT arrays
- Evidence built BEFORE use
- State cleanup on session.ended
- Container testing MANDATORY

---

## LAST UPDATED

**Timestamp:** 2026-04-15T23:30 UTC
**Phase:** PLAN → BUILD
**Gate:** PLAN