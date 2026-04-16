# KRAKEN V1.2 — RELOAD ANCHOR SHIP PACKAGE

**Version:** 1.2.0
**Date:** 2026-04-16
**Type:** Self-Contained Reload Anchor
**Purpose:** Vanilla build agent can reload and continue without issues

---

## WHAT IS THIS?

This is a **fully self-contained reload anchor** for Kraken v1.2 multi-brain orchestrator with identity system. A vanilla build agent should be able to:
1. Read this README
2. Understand the project structure
3. Build and test without any external dependencies
4. Continue development from where we left off

---

## PROJECT STRUCTURE

```
SHIP_PACKAGE_FULL/
├── README.md                    # THIS FILE
├── opencode.json               # OpenCode plugin config
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── bun.lock                    # Lock file
│
├── src/                        # Kraken agent source
│   ├── index.ts                # Main plugin entry
│   ├── identity/               # Identity system
│   │   ├── loader.ts           # File loader
│   │   ├── injector.ts        # System prompt injector
│   │   ├── types.ts           # TypeScript types
│   │   └── index.ts           # Module exports
│   ├── brains/                # Multi-brain infrastructure
│   │   ├── planning/
│   │   ├── execution/
│   │   └── system/
│   ├── clusters/              # Cluster management
│   ├── factory/               # Factory components
│   ├── hooks/                 # Hooks
│   ├── kraken-hive/           # Hive Mind integration
│   ├── shared/                # Shared utilities
│   └── tools/                 # Tool definitions
│
├── identity/                   # Agent identity files
│   └── orchestrator/
│       ├── KRAKEN.md          # Core identity
│       ├── IDENTITY.md         # Role definition
│       ├── EXECUTION.md        # Delegation patterns
│       ├── QUALITY.md          # Quality gates
│       └── TOOLS.md           # Available tools
│
├── dist/                      # Built plugin (0.56 MB)
│   └── index.js               # Bundled entry point
│
├── container-plugins/          # Supporting plugins
│   ├── coding-subagents/
│   ├── opencode-subagent-manager/
│   ├── opencode-plugin-engineering/
│   ├── shark-agent-v4.7-hotfix-v3/
│   └── manta-agent-v1.5/
│
├── shark-agent/               # Embedded Shark agent
├── manta-agent/               # Embedded Manta agent
├── subagent-manager/          # Subagent management
├── wrappers/                  # Python wrappers
│
├── container_orig/            # Original container build
│   └── Dockerfile             # Container build file
│
└── docs/                      # Documentation
    ├── BUILD_REPORT.md
    ├── DEBUG_LOG.md
    └── IDENTITY_SYSTEM.md
```

---

## DUAL PLUGIN ARCHITECTURE

### Plugin 1: kraken-agent (Main Orchestrator)
- **Purpose:** Central orchestration with 3 brains + Hive Mind
- **Identity System:** File-based (KRAKEN.md, IDENTITY.md, etc.)
- **Loads:** identity/orchestrator/ on startup
- **Agent Tab:** "kraken" visible in dropdown

### Plugin 2: subagent-manager (Execution Layer)
- **Purpose:** Manages actual Docker container execution
- **Handles:** spawn_shark_agent, spawn_manta_agent
- **Creates:** Real Docker containers for sub-agents
- **Required by:** kraken-agent for delegation

### Supporting Plugins:
- **coding-subagents:** Code generation tools
- **opencode-plugin-engineering:** Engineering knowledge base
- **shark-agent-v4.7-hotfix-v3:** Shark execution agent
- **manta-agent-v1.5:** Manta precision agent

---

## BUILD INSTRUCTIONS

### Step 1: Build the Plugin

```bash
cd SHIP_PACKAGE_FULL

# Install dependencies (if needed)
bun install

# Build TypeScript
bun run build

# Output: dist/index.js (0.56 MB)
```

### Step 2: Copy to OpenCode Config

```bash
# Create plugin directories
mkdir -p ~/.config/opencode/plugins/kraken-agent
mkdir -p ~/.config/opencode/plugins/subagent-manager
mkdir -p ~/.config/opencode/plugins/coding-subagents
mkdir -p ~/.config/opencode/plugins/opencode-subagent-manager
mkdir -p ~/.config/opencode/plugins/opencode-plugin-engineering
mkdir -p ~/.config/opencode/plugins/shark-agent-v4.7-hotfix-v3
mkdir -p ~/.config/opencode/plugins/manta-agent-v1.5

# Copy files
cp -r dist/* ~/.config/opencode/plugins/kraken-agent/
cp -r subagent-manager/* ~/.config/opencode/plugins/subagent-manager/
cp -r container-plugins/coding-subagents/* ~/.config/opencode/plugins/coding-subagents/
cp -r container-plugins/opencode-subagent-manager/* ~/.config/opencode/plugins/opencode-subagent-manager/
cp -r container-plugins/opencode-plugin-engineering/* ~/.config/opencode/plugins/opencode-plugin-engineering/
cp -r container-plugins/shark-agent-v4.7-hotfix-v3/* ~/.config/opencode/plugins/shark-agent-v4.7-hotfix-v3/
cp -r container-plugins/manta-agent-v1.5/* ~/.config/opencode/plugins/manta-agent-v1.5/
```

### Step 3: Configure OpenCode

```bash
cp opencode.json ~/.config/opencode/opencode.json
```

### Step 4: Test

```bash
opencode --version  # Should show 1.4.6
opencode --agent kraken
```

---

## IDENTITY SYSTEM

### How It Works

1. **Session starts** → `index.ts` loads
2. **IdentityLoader** reads `identity/orchestrator/`
3. **KRAKEN.md, IDENTITY.md, EXECUTION.md, QUALITY.md, TOOLS.md** parsed
4. **formatIdentityForSystemPrompt()** creates 8734 char prompt
5. **Hook** `experimental.chat.system.transform` injects into context
6. **Agent sees:** "You ARE the Kraken orchestrator..."

### Key Files

| File | Purpose | Lines |
|------|---------|-------|
| KRAKEN.md | Core identity ("You ARE...") | ~40 |
| IDENTITY.md | Role definition | ~25 |
| EXECUTION.md | Delegation triggers/patterns | ~100 |
| QUALITY.md | Quality gates, debug protocol | ~55 |
| TOOLS.md | Available tools list | ~35 |

### Environment Variable

```bash
KRAKEN_IDENTITY_DIR=/root/.config/opencode/plugins/kraken-agent/identity
```

---

## CONTAINER BUILD

### Build Container

```bash
cd container_orig
docker build -t kraken-v1.2:latest .
```

### Run Container

```bash
docker run -it --rm \
  -v "$HOME/.config/opencode:/root/.config/opencode" \
  kraken-v1.2:latest
```

---

## VERIFICATION RESULTS

### Build: ✅ PASS
- Bundle: 0.56 MB
- Modules: 110 bundled
- Errors: None

### Container: ✅ PASS
```
[Identity] Orchestrator identity loaded { length: 8734 }
[PlanningBrain] Initialized
[ExecutionBrain] Initialized
[SystemBrain] Initialized
Agents registered { count: 11, primary: ["kraken"] }
```

### Identity Files: ✅ PASS
```
KRAKEN.md ✓ IDENTITY.md ✓ EXECUTION.md ✓ QUALITY.md ✓ TOOLS.md ✓
```

---

## BEHAVIORAL TEST (PENDING)

**Issue:** `opencode run` does NOT fire hooks. Only TUI mode works.

### Manual Test Required:

```bash
docker run -it --rm \
  -v "$HOME/.config/opencode:/root/.config/opencode" \
  kraken-v1.2:latest

# In TUI:
# 1. Select "kraken" agent
# 2. Ask: "Who are you?"
#    → Should respond: "You ARE the Kraken orchestrator"
# 3. Ask: "Build a user auth system (5 files)"
#    → Should use spawn_shark_agent to delegate
```

### Success Criteria

| Test | Expected | Pass? |
|------|----------|-------|
| Identity shown | "You ARE the Kraken orchestrator" | TBD |
| Delegation | Uses spawn_shark_agent | TBD |
| Parallel | 2-3 agents spawned | TBD |

---

## CONTINUATION GUIDE

### For Vanilla Build Agent

1. **Read this README** — Understand project structure
2. **Check identity system** — Verify KRAKEN.md content
3. **Build plugin** — `bun run build`
4. **Deploy to config** — Copy to ~/.config/opencode/plugins/
5. **Test in TUI** — `opencode --agent kraken`
6. **Verify identity** — Ask "Who are you?"
7. **Verify delegation** — Give multi-file task

### If Issues:

1. **Identity not loading:**
   - Check `KRAKEN_IDENTITY_DIR` env var
   - Verify files at `identity/orchestrator/`

2. **Hook not firing:**
   - Use TUI mode, not `opencode run`
   - Check `experimental.chat.system.transform` registered

3. **Plugin not loading:**
   - Check opencode.json config
   - Verify all paths correct

---

## RELOAD ANCHOR CHECKPOINTS

| Checkpoint | Date | Status |
|------------|------|--------|
| cp_1776288937266 | 2026-04-16 | Pre-identity build |
| Current | 2026-04-16 | Identity integration complete |

---

## CONTACT/SUPPORT

- **Kraken:** Multi-brain orchestrator with Planning, Execution, System brains
- **Identity:** File-based agent identity system
- **Delegation:** spawn_shark_agent, spawn_manta_agent, run_parallel_tasks
- **Hive Mind:** kraken_hive_search, kraken_hive_remember