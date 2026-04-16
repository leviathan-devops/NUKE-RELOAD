# KRAKEN V1.2 — PROJECT ANCHORS

## Project Structure

```
/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Projects/v1.2 Rebuild/
├── src/
│   ├── brains/
│   │   ├── planning/planning-brain.ts    # Owns planning-state, context-bridge
│   │   ├── execution/execution-brain.ts  # Owns execution-state, quality-state
│   │   └── system/system-brain.ts         # Owns workflow-state, security-state
│   ├── shared/
│   │   ├── domain-ownership.ts             # Domain ownership rules
│   │   ├── brain-messenger.ts            # Inter-brain priority messaging
│   │   └── state-store.ts                 # Session-scoped state
│   ├── clusters/
│   │   └── ClusterInstance.ts            # executeOnAgent (REAL Docker spawning)
│   ├── index.ts                          # Plugin entry, brain initialization
│   └── tools/
│       └── monitoring-tools.ts            # kraken_brain_status, kraken_message_status
├── dist/
│   └── index.js                          # 0.56 MB bundle
├── wrappers/                              # Python Docker wrappers
├── subagent-manager/                     # Container management
├── shark-agent/                          # Shark T2 agents
└── manta-agent/                          # Manta T2 agents
```

## Key Files

### Brain Infrastructure (NEW)
| File | Purpose |
|------|---------|
| `src/brains/planning/planning-brain.ts` | T2 Master loading, T1 generation, task decomposition |
| `src/brains/execution/execution-brain.ts` | Task supervision, output verification, override commands |
| `src/brains/system/system-brain.ts` | Workflow tracking, security, gate management |
| `src/shared/brain-messenger.ts` | Priority messaging between brains |
| `src/shared/domain-ownership.ts` | State domain ownership rules |

### Preserved Working Code (from NUKE RELOAD)
| File | Purpose |
|------|---------|
| `src/clusters/ClusterInstance.ts` | executeOnAgent - REAL Docker spawning |
| `subagent-manager/` | Container spawning system |
| `wrappers/opencode_agent.py` | Python wrapper for Docker |

## V1.2 Architecture

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
```

## New V1.2 Tools

- `kraken_brain_status` - Shows initialization state of all 3 brains
- `kraken_message_status` - Shows inter-brain message queue

## Alignment Bible

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/KRAKEN_ALIGNMENT_BIBLE.md`

**Key rules applied:**
- executeOnAgent NOT simulateTaskExecution ✅
- Hooks are async functions NOT arrays ✅
- State cleanup on session.ended ✅
- Container testing MANDATORY ✅

---

## Build Status

- [x] Bundle built: 0.56 MB
- [ ] Container TUI test: PENDING
- [ ] Deep verification: PENDING
- [ ] Ship package: PENDING