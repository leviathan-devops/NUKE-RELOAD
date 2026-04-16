# KRAKEN V1.2 MULTI-BRAIN ORCHESTRATOR — SHIP PACKAGE

**Build ID:** kraken-v1.2-multi-brain-2026-04-16
**Package Version:** 1.2.0
**Date:** 2026-04-16T02:30 UTC
**Classification:** Production Release

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Package Contents](#package-contents)
3. [Quick Start](#quick-start)
4. [Installation](#installation)
5. [Container Testing](#container-testing)
6. [Local Deployment](#local-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Architecture](#architecture)
9. [Verification Checklist](#verification-checklist)

---

## OVERVIEW

This is a production-ready release of **Kraken v1.2 Multi-Brain Orchestrator**, built on the foundation of NUKE RELOAD v1.1. It implements a three-brain architecture (Planning, Execution, System) with real Docker container execution via `executeOnAgent`.

### Key Features

- **Three-Brain Architecture**: Planning → Execution ← System
- **Real Execution**: Uses `executeOnAgent` (NOT `simulateTaskExecution`)
- **Domain Ownership**: Strict state management preventing brain cross-contamination
- **Priority Messaging**: Structured inter-brain communication
- **Container-First**: All testing done in Docker before local deployment

### What's Included

- Complete source code with brain infrastructure
- Pre-built bundle (555KB)
- Self-contained Docker image for testing
- Comprehensive documentation
- Verification scripts

---

## PACKAGE CONTENTS

```
SHIP_PACKAGE/
├── README.md              # This file
├── INSTALLATION.md        # Detailed installation guide
├── DEPLOYMENT.md          # Local deployment instructions
├── TROUBLESHOOTING.md     # Common issues and fixes
├── VERIFICATION.md         # Post-installation verification
│
├── src/                   # Complete source code
│   ├── brains/             # Brain infrastructure
│   │   ├── planning/      # PlanningBrain
│   │   ├── execution/     # ExecutionBrain
│   │   └── system/        # SystemBrain
│   ├── shared/            # Shared infrastructure
│   │   ├── brain-messenger.ts
│   │   ├── domain-ownership.ts
│   │   └── state-store.ts
│   ├── clusters/           # ClusterInstance (executeOnAgent)
│   ├── tools/             # Monitoring tools
│   │   └── monitoring-tools.ts
│   └── index.ts           # Plugin entry point
│
├── dist/                  # Pre-built bundle
│   └── index.js           # 555,061 bytes
│
├── container/             # Docker container definition
│   ├── Dockerfile         # Self-contained image build
│   ├── opencode-config.json
│   └── plugins/           # Bundled plugins for container
│       ├── coding-subagents/
│       ├── opencode-subagent-manager/
│       ├── opencode-plugin-engineering/
│       ├── shark-agent-v4.7-hotfix-v3/
│       └── manta-agent-v1.5/
│
├── scripts/               # Build and test scripts
│   ├── build-container.sh
│   ├── test-container.sh
│   └── deploy-local.sh
│
├── docs/                  # Additional documentation
│   ├── ARCHITECTURE.md
│   ├── BRAIN_INFRASTRUCTURE.md
│   └── ALIGNMENT_BIBLE.md
│
└── tests/                 # Verification tests
    └── verification-checklist.md
```

---

## QUICK START

### Option A: Container Testing (Recommended First)

```bash
# 1. Build the container image
cd SHIP_PACKAGE/container
docker build -t kraken-v1.2-test:latest -f Dockerfile .

# 2. Run interactive TUI test
docker run -it kraken-v1.2-test:latest

# 3. In TUI, verify brain initialization:
kraken_brain_status
```

### Option B: Local Deployment

```bash
# 1. Copy plugin to local
cp -r SHIP_PACKAGE/dist ~/.config/opencode/plugins/kraken-agent-v1.2/

# 2. Update opencode config
# (See DEPLOYMENT.md for detailed instructions)

# 3. Run opencode
opencode --agent kraken
```

---

## INSTALLATION

See [INSTALLATION.md](INSTALLATION.md) for detailed step-by-step installation instructions.

### Prerequisites

- Docker (for container testing)
- Node.js 20+ (for building from source)
- bun runtime (for building)
- opencode installed

---

## CONTAINER TESTING

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive container testing instructions.

**Why Container Testing First?**
- Isolated environment
- No local device modification
- Reproducible verification
- Catches issues before local deployment

---

## LOCAL DEPLOYMENT

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed local deployment instructions.

**CRITICAL:** Always test in container FIRST, then deploy to local.

---

## TROUBLESHOOTING

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues and solutions.

### Quick Fixes

| Issue | Solution |
|-------|----------|
| Plugin won't load | Check opencode.json path |
| Brains not initializing | Check bundle integrity |
| executeOnAgent fails | Verify Docker in Docker |
| TUI freezes | Use `opencode serve` not `opencode` |

---

## ARCHITECTURE

### Three-Brain System

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  PLANNING   │────▶│  EXECUTION  │◀────│   SYSTEM    │
│   BRAIN     │     │   BRAIN     │     │   BRAIN     │
│             │     │             │     │             │
│ owns:       │     │ owns:       │     │ owns:       │
│ planning-   │     │ execution-  │     │ workflow-   │
│ state       │     │ state       │     │ state       │
│ context-    │     │ quality-    │     │ security-   │
│ bridge      │     │ state       │     │ state       │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Execution Flow

1. **Planning Brain**: Loads T2 patterns, generates T1 tasks
2. **Execution Brain**: Supervises tasks, verifies outputs
3. **System Brain**: Tracks workflow, manages gates

### Domain Ownership

| Domain | Owner |
|--------|-------|
| planning-state | Planning, System |
| execution-state | Execution, System |
| workflow-state | System, Execution |
| security-state | System only |
| quality-state | Execution, System |

---

## VERIFICATION CHECKLIST

See [VERIFICATION.md](VERIFICATION.md) for complete checklist.

### Post-Installation Verification

- [ ] Plugin loads without errors
- [ ] `kraken_brain_status` shows 3 brains
- [ ] `hive_status` works
- [ ] `get_cluster_status` shows alpha/beta/gamma
- [ ] `spawn_shark_agent` creates real Docker containers
- [ ] `docker ps` shows running containers

---

## ALIGNMENT BIBLE

This build follows strict rules to prevent past failures:

- **executeOnAgent** NOT simulateTaskExecution
- Hooks are async functions NOT arrays
- State cleanup on session.ended
- Container testing MANDATORY
- No theatrical placeholders

See [docs/ALIGNMENT_BIBLE.md](docs/ALIGNMENT_BIBLE.md) for complete rules.

---

## SUPPORT

For issues:
1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Run container verification
3. Check Docker logs: `docker logs <container>`

---

**END README**