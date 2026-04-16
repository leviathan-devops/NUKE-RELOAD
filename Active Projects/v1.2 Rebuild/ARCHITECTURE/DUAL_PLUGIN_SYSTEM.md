# Kraken Agent v1.1 Architecture

## Dual Plugin System

Kraken requires **two separate plugins** for full functionality:

| Plugin | Purpose | Tools Provided |
|--------|---------|----------------|
| **kraken-agent** | Orchestration & cluster management | `spawn_cluster_task`, `spawn_shark_agent`, `spawn_manta_agent`, `anchor_cluster`, `kraken-status`, `kraken-gate`, `kraken-hive-*` |
| **opencode-subagent-manager** | Container-level parallel execution | `run_subagent_task`, `run_parallel_tasks`, `cleanup_subagents` |

## Tool Separation

### Kraken Tools (kraken-agent)
```
spawn_cluster_task    - Queue task to internal cluster queue
spawn_shark_agent     - Queue Shark task to internal cluster queue  
spawn_manta_agent     - Queue Manta task to internal cluster queue
anchor_cluster        - Anchor cluster to project focus name
kraken-status         - View cluster load
kraken-gate           - Manage gate chain
kraken-hive-store     - Store pattern in Hive Mind
kraken-hive-search    - Search Hive Mind
```

### Subagent Manager Tools (opencode-subagent-manager)
```
run_subagent_task     - Spawn Docker container agent
run_parallel_tasks    - Parallel Docker container execution
cleanup_subagents    - Kill all container agents
```

## Why Two Plugins?

### Kraken (Orchestration Layer)
- **In-memory task queue** using JavaScript Maps/Promises
- **Cluster load balancing** via ClusterScheduler
- **Hive Mind** for persistent memory
- **Focus anchoring** for smart cluster resolution
- Manages **logical task scheduling** not actual execution

### Subagent Manager (Execution Layer)
- **Docker container spawning** via Python wrappers
- **Container pool management** for parallel execution
- **Actual process isolation** at OS level
- Used by Kraken internally for **real execution**

## Data Flow

```
User Request
    │
    ▼
┌─────────────────────────┐
│   KRAKEN AGENT          │
│  (Orchestration Layer)  │
│                         │
│  spawn_cluster_task()   │
│  → Task queued in       │
│    AsyncDelegationEngine│
└───────────┬─────────────┘
            │ Task execution
            ▼
┌─────────────────────────┐
│ SUBAGENT MANAGER        │
│  (Execution Layer)       │
│                         │
│  run_subagent_task()    │
│  → Docker container     │
│    spawns actual agent  │
└─────────────────────────┘
```

## Plugin Loading Order

```json
{
  "plugins": [
    "file:///.../opencode-subagent-manager-git/dist/index.js",  // First - base execution
    "file:///.../kraken-agent-v1.1/dist/index.js",              // Second - orchestration
    "file:///.../kraken-agent-v1.1/shark-agent/dist/index.js",  // Shark agent
    "file:///.../kraken-agent-v1.1/manta-agent/dist/index.js"    // Manta agent
  ]
}
```

## Key Files

### kraken-agent-v1.1/
```
src/
├── index.ts                    # Main entry, exports tools
├── factory/
│   ├── AsyncDelegationEngine.ts  # In-memory task queue
│   └── ClusterScheduler.ts       # Load balancing + focus anchoring
├── clusters/
│   └── ClusterManager.ts         # Cluster lifecycle
├── kraken-hive/
│   └── index.ts                 # Hive Mind memory
└── tools/
    ├── cluster-tools.ts          # spawn_* tools
    ├── monitoring-tools.ts       # kraken-status
    └── kraken-hive-tools.ts     # kraken-hive-* tools
```

### opencode-subagent-manager-git/
```
src/
├── tools/index.ts              # run_* tools
├── utils/cli.ts               # Python wrapper executor
wrappers/
├── opencode_agent.py          # Container spawn script
└── container_pool.py           # Pool manager
```

## Self-Contained Structure

Each plugin is self-contained with no external dependencies at runtime:

- **kraken-agent**: Bundled Shark/Manta agents, Kraken-Hive, AsyncDelegationEngine
- **opencode-subagent-manager**: Bundled Python wrappers for Docker container management

## Important Notes

1. **Both plugins required**: Disabling either breaks functionality
2. **Tool names are distinct**: No overlap between plugins
3. **Kraken delegates to subagent**: When Kraken's internal agents actually execute, they use subagent-manager
4. **Focus anchoring**: Kraken's cluster focus resolution happens at orchestration layer

---

*Version 1.1 - Focus Anchoring + Smart Cluster Resolution*
