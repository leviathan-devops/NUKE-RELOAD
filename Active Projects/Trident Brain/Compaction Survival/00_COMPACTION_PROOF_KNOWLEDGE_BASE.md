# TRIDENT MULTI-MODE BUILD — COMPACTION PROOF KNOWLEDGE BASE

**Version:** 1.0.0
**Date:** 2026-04-16
**Build:** Trident Brain Multi-Mode Plugins
**Classification:** PROCESS DOCUMENTATION
**Status:** IN PROGRESS

---

## PROJECT LOCATION

```
/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Projects/Trident Brain/
```

---

## WHAT IS BEING BUILT

Three standalone Trident Brain plugins sharing a common multimode codebase framework:

1. **Context Synthesis Mode** - 4-layer dynamic context synthesis (T1/T2/T3/T4 → injection)
2. **Deep Planning Mode** - 3-layer deep reasoning (What/How/Explain to agent)
3. **Problem Solving Mode** - 6-layer evidence-based debugging (Assumption→Action→Observation→Gap→Meta→Verify)

Prototype: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Reload Anchor v3.2/`

---

## ARCHITECTURE

### Shared Framework Design

```
trident-multimode/
├── src/
│   ├── framework/              # Shared codebase
│   │   ├── base-plugin.ts      # Base plugin class
│   │   ├── state-machine.ts    # Layer state management
│   │   ├── gate-validator.ts   # Mechanical gate enforcement
│   │   ├── artifact-generator.ts # Report/artifact creation
│   │   └── types.ts            # Shared TypeScript types
│   ├── modes/
│   │   ├── context-synthesis/  # Mode 1 (4 layers)
│   │   ├── deep-planning/      # Mode 2 (3 layers)
│   │   └── problem-solving/    # Mode 3 (6 layers)
│   └── plugins/
│       ├── trident-context-synthesis/
│       ├── trident-deep-planning/
│       └── trident-problem-solving/
```

### Each Plugin Is Independent

Each mode gets its own:
- `src/plugins/{mode}/index.ts` - Entry point
- `src/modes/{mode}/*.ts` - Mode-specific logic
- `dist/` - Built output

Shared code is imported from `src/framework/`.

---

## KRAKEN ARCHITECTURE COMPLIANCE

This build follows KRAKEN orchestrator principles:

1. **DELEGATE, don't do directly** - Use spawn_shark_agent for parallel builds
2. **EXECUTE in parallel** - Build all 3 plugins simultaneously via parallel tasks
3. **VERIFY everything** - Container testing required before ship
4. **FAIL FAST** - If build fails, debug immediately
5. **LEARN from mistakes** - Document failures in compaction survival

---

## BUILD PHASES

| Phase | Gate | Task |
|-------|------|------|
| PLAN | ✅ | Create compaction survival + project structure |
| BUILD | 🔄 | Build shared framework + 3 plugins |
| TEST | ⬜ | Container TUI testing each plugin |
| VERIFY | ⬜ | Verify each plugin loads correctly |
| SHIP | ⬜ | Final deployment package |

---

## KEY FILES REFERENCE

### Source Files
- Prototype index.ts: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Reload Anchor v3.2/src/index.ts`
- Prototype algorithmic-core.ts: `.../src/algorithmic-core.ts`
- Prototype artifact-writer.ts: `.../src/artifact-writer.ts`

### Spec Files
- Context Synthesis: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Context Synthesis Mode/Overview/SPEC/TRIDENT_SPEC.md`
- Deep Planning: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Deep Planning Mode/Overview/SPEC/TRIDENT_SPEC.md`
- Problem Solving: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Problem Solving Mode/Overview/SPEC/TRIDENT_SPEC.md`

### Container Testing
- Master Reference: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/Container Testing Context/CONTAINER_TESTING_MASTER_REFERENCE.md`
- Plugin SOP: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/Plugin Context/PLUGIN_SHIP_SOP.md`

---

## COMPACTION TIER SYSTEM

| Tier | Trigger | Action |
|------|---------|--------|
| Tier 0 | Start | Create 00_COMPACTION_PROOF_KNOWLEDGE_BASE.md |
| Tier 1 | Every 10K tokens | Update 03_SESSION_STATE_TRACKER.md |
| Tier 2 | Before complex ops | Create 02_EMERGENCY_CONTEXT.md |
| Tier 3 | At 80% tokens | Save checkpoint + hibernate |

---

## ALIGNMENT BIBLE

1. NEVER edit source files - duplicate template and edit clone
2. Container testing via docker exec TUI ONLY
3. All plugins must pass `docker exec ... opencode run "call trident-status"`
4. Use bun build for TypeScript compilation
5. Shared framework is imported, not copied

---

**Last Updated:** 2026-04-16
**Next Action:** Create 01_PROJECT_ANCHORS.md and 03_SESSION_STATE_TRACKER.md