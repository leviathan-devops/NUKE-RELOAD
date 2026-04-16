# KRAKEN V1.2 — RESUME DOCUMENT
**For:** Vanilla build agent resuming after compaction or power loss
**Last Updated:** 2026-04-16T20:55 UTC
**Token Budget at Save:** ~85K remaining (compaction imminent)

---

## IMMEDIATE STATUS

**v1.2 DEPLOYED AND OPERATIONAL** — but identity spawn injection NOT working.

```
Plugin: ~/.config/opencode/plugins/kraken-v1.2/
Identity: ~/.config/opencode/plugins/kraken-v1.2/identity/
Status: ✅ PlanningBrain, ExecutionBrain, SystemBrain all initialized
Status: ✅ 3 clusters active (alpha/beta/gamma), 9 agents registered
Status: ❌ Spawned sub-agents say "I'm Opencode" instead of Kraken identity
```

---

## WHAT WAS SHIPPED (SHIP REPORT v1)

**Location:** `Compaction Survival/SHIP_REPORT_v1.md`

### Build Summary
- Built on v1.1 NUKE RELOAD foundation (real Docker execution preserved)
- Added triple-brain architecture (Planning, Execution, System)
- Created identity system with 5 files in `identity/orchestrator/`
- Bundle size: 555KB
- Container testing: PASSED

### Critical Failure During Ship
The ship agent deployed v1.2 while v1.1 was STILL IN opencode.json. Result: BOTH PLUGINS LOADED SIMULTANEOUSLY. The ship agent called success without removing the old plugin first.

**Fix applied:** Manual edit to remove v1.1 (`kraken-nuke-reload`) references from opencode.json.

**Lesson learned:** Plugin migration requires EXPLICIT REMOVAL + RESTART + VERIFY. Future ships must follow the migration checklist in SHIP_REPORT_v1.md.

### Bugs Fixed During Build
1. KRAKEN_IDENTITY_DIR env var not set in container
2. bundle.spider.raw undefined (SPIDER→QUALITY rename)
3. ExecutionTrigger TypeScript type error
4. Path resolution failed (cwd issues) — Added KNOWN_LOCATIONS[] search
5. Env vars not inherited by opencode subprocess
6. KNOWN_LOCATIONS paths wrong (too many `..`)
7. Fallback returned invalid path

---

## CURRENT BLOCKING ISSUE

### Identity Spawn Injection NOT WORKING

**Problem:** When spawning sub-agents via `spawn_shark_agent`, they respond as vanilla OpenCode, NOT Kraken identity.

**Evidence:**
```
User: who are you?
Agent: "I'm Opencode, an interactive CLI tool..."
```

**Root Cause:** The spawn tools in `src/tools/cluster-tools.ts` build a simple character prompt but don't include the full Kraken identity context. Identity injection only happens at plugin initialization for the PRIMARY kraken agent, not for spawned sub-agents.

**Full analysis:** `Compaction Survival/05_IDENTITY_SPAWN_INJECTION.md`

---

## IMMEDIATE NEXT STEPS

### 1. Implement Identity Spawn Injection

**Files to modify:**
- `src/tools/cluster-tools.ts` — spawn_shark_agent, spawn_manta_agent, spawn_cluster_task
- `src/identity/injector.ts` — Add formatIdentityForTaskContext() helper

**Implementation:**

Step A — Add to `src/identity/injector.ts`:
```typescript
export function formatIdentityForTaskContext(bundle: IdentityBundle, task: string): string {
  const identity = formatIdentityForSystemPrompt(bundle);
  return `${identity}

---

## TASK

${task}
`;
}
```

Step B — Modify `src/tools/cluster-tools.ts`:
```typescript
// Add identityLoader to ClusterToolsContext
export interface ClusterToolsContext {
  delegationEngine: { delegate(request: KrakenDelegationRequest): Promise<any>; };
  clusterScheduler: { assignCluster(...): Promise<string>; ... };
  clusterManager: { getClusterStatus(...): any; ... };
  identityLoader: { loadForRole(role: string): Promise<IdentityBundle>; };  // ADD THIS
}

// In spawn_shark_agent execute function:
const bundle = await ctx.identityLoader.loadForRole('orchestrator');
const fullTask = formatIdentityForTaskContext(bundle, args.task);

const request: KrakenDelegationRequest = {
  taskId,
  task: fullTask,  // Now includes identity context
  ...
};
```

Step C — Update the ClusterToolsContext initialization in `src/index.ts` to pass identityLoader.

### 2. Test the Fix

After implementing:
1. Rebuild bundle: `bun run build`
2. Test in container
3. Spawn a shark agent: `spawn_shark_agent { task: "who are you?" }`
4. Verify response includes "You ARE the Kraken orchestrator"

### 3. Create Ship Package V2

Once identity spawn injection works:
- Create updated ship package with identity spawn fix
- Name it appropriately (V2 or identity-fix)

---

## ARCHITECTURE REFERENCE

### Triple-Brain System
```
┌─────────────────────────────────────────────────────┐
│              KRAKEN ORCHESTRATOR                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  PLANNING   │◀▶│  EXECUTION  │◀▶│   SYSTEM    │  │
│  │   BRAIN     │  │   BRAIN     │  │   BRAIN     │  │
│  │ owns:       │  │ owns:       │  │ owns:       │  │
│  │ planning-   │  │ execution-  │  │ workflow-   │  │
│  │ state       │  │ state       │  │ state       │  │
│  │ context-    │  │ quality-    │  │ security-   │  │
│  │ bridge      │  │ state       │  │ state       │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Clusters
| Cluster | Type | Agents |
|---------|------|--------|
| Alpha | Steamroll | shark-alpha-1, shark-alpha-2, manta-alpha-1 |
| Beta | Precision | shark-beta-1, manta-beta-1, manta-beta-2 |
| Gamma | Testing | manta-gamma-1, manta-gamma-2, shark-gamma-1 |

### Identity Files
```
identity/orchestrator/
├── KRAKEN.md      (Core identity - "You ARE the Kraken...")
├── IDENTITY.md    (Role definition)
├── EXECUTION.md   (Delegation patterns)
├── QUALITY.md     (Quality gates)
└── TOOLS.md       (Available tools)
```

---

## KEY FILES REFERENCE

### Project Location
```
/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Projects/v1.2 Rebuild/
```

### Critical Files
| File | Purpose |
|------|---------|
| `Compaction Survival/SHIP_REPORT_v1.md` | Full ship chronicle with lessons learned |
| `Compaction Survival/05_IDENTITY_SPAWN_INJECTION.md` | Detailed fix analysis |
| `Compaction Survival/03_SESSION_STATE_TRACKER.md` | Current state (update this!) |
| `src/tools/cluster-tools.ts` | Spawn tools (WHERE TO FIX) |
| `src/identity/injector.ts` | Identity formatter (ADD HELPER HERE) |
| `src/identity/loader.ts` | Identity loader with caching |
| `src/index.ts` | Plugin factory (initializes identity) |
| `KRAKEN_IDENTITY_SPEC.md` | Full identity spec with SOUL.md content |

### Deployed Plugin Location
```
~/.config/opencode/plugins/kraken-v1.2/
├── dist/index.js (0.56 MB)
├── identity/orchestrator/
├── wrappers/
├── shark-agent/
└── manta-agent/
```

---

## VERIFICATION COMMANDS

```bash
# Check brain status
kraken_brain_status

# Check cluster status
get_cluster_status

# Verify identity loaded
# (check logs for: [Identity] Orchestrator identity loaded { length: 8734 })
```

---

## LESSONS FROM THIS BUILD

### 1. Plugin Migration Protocol (CRITICAL)
**NEVER** just add new plugin without removing old. opencode.json entries are additive.

**Proper sequence:**
1. REMOVE old plugin paths from opencode.json
2. VERIFY old plugin can be archived
3. ADD new plugin paths
4. RESTART opencode
5. VERIFY single-plugin load
6. CONFIRM brain status shows correct version

### 2. Compaction Survival Usage
- Create session state tracker BEFORE building
- Update every 15-20K tokens
- Create checkpoints at milestones
- Copy SHIP_REPORT to ship packages

### 3. Path Resolution
- `process.cwd()` varies depending on where opencode is invoked
- Don't rely on env vars (opencode doesn't inherit them)
- Don't rely on `import.meta.url` (unreliable in Bun-bundled output)
- Use KNOWN_LOCATIONS[] array for search paths

---

## ON RESUMING

**Read first:** `Compaction Survival/SHIP_REPORT_v1.md`
**Then check:** `Compaction Survival/03_SESSION_STATE_TRACKER.md`
**Then implement:** Identity spawn injection fix

If identity spawn injection is already implemented and working, proceed to:
1. Rebuild bundle
2. Test in container
3. Create updated ship package

---

**Good luck. Delegate don't duplicate. Parallelize don't serialize.**
