# NUKE-RELOAD - Kraken Agent Self-Contained Rebuild Archive

## Contents

### NUKE RELOAD/
- **v1.1/** - Kraken Agent v1.1 (NOT theatrical legacy - has executeOnAgent real execution)
- **v1.2/** - Kraken Agent v1.2 with full source, build, identity, and agent dependencies

### GLOBAL NUKE RELOAD/
- **SMK_RELOAD_SCRIPT.md** - Master reload automation script

### Active Projects/
- **Kraken Agent v1.3/** - Latest Kraken Agent v1.3 with checkpoints, docs, T2 context
- **Trident Brain/** - Trident multi-brain system (deep-planning, context-synthesis, problem-solving, multimode-framework)
- **v1.2 Rebuild/** - v1.2 rebuild project (source, SHIP packages, container configs)

## Reload Instructions

1. Clone this repo
2. For each project with `package.json`, run `npm install` or `bun install`
3. Build TypeScript projects with `npm run build` or `bun run build`
4. Reference `GLOBAL NUKE RELOAD/SMK_RELOAD_SCRIPT.md` for full reload automation

## Key Files (Cluster Execution)
All ClusterInstance.ts files use `executeOnAgent()` - NO theatrical `simulateTaskExecution()` code.

## Repository Structure
```
NUKE-RELOAD/
├── NUKE RELOAD/
│   ├── v1.1/          (real execution code)
│   └── v1.2/          (real execution code, full sources)
├── GLOBAL NUKE RELOAD/
│   └── SMK_RELOAD_SCRIPT.md
└── Active Projects/
    ├── Kraken Agent v1.3/
    ├── Trident Brain/
    └── v1.2 Rebuild/
```
