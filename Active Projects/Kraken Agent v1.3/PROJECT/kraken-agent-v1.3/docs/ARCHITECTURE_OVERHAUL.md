# KRAKEN V2.0 — COMPREHENSIVE ARCHITECTURE OVERHAUL

**Date:** 2026-04-15  
**Status:** CRITICAL - Architecture Not Wired  
**Priority:** P0 - Must Fix

---

## EXECUTIVE SUMMARY

The Kraken V2.0 source code has **ALL components implemented** but **NOT WIRED TOGETHER**. Agents default to single-execution mode because the multi-brain orchestration hooks are not registered with OpenCode.

### What's IMPLEMENTED (Source Code Exists):
- ✅ `src/brains/system/system-brain.ts` - Two-Layer Guardian + Compaction Manager
- ✅ `src/brains/system/two-layer-guardian.ts` - Tool + Message enforcement
- ✅ `src/brains/system/compaction-manager.ts` - Four-tier context management
- ✅ `src/brains/system/gate-manager.ts` - Explicit gate criteria
- ✅ `src/brains/execution/execution-brain.ts` - Output verification + Override handler
- ✅ `src/brains/planning/planning-brain.ts` - T2 Master + T1 Generation
- ✅ `src/brains/council/roundtable-council.ts` - Alpha/Beta/Gamma clusters
- ✅ `src/shared/output-verifier.ts` - Mechanical fs.existsSync() verification
- ✅ `src/shared/brain-messenger.ts` - Priority cross-brain messaging
- ✅ `src/hooks/index.ts` - Hook functions defined

### What's MISSING (Not Wired):
- ❌ **Hooks not registered** - `createEventHook`, `createChatMessageHook`, `createToolGuardianHook` never registered with plugin
- ❌ **Session lifecycle hooks** - `session.created`, `session.compacting` never fire
- ❌ **Two-Layer Guardian** - Never active because hooks not registered
- ❌ **Compaction system** - Never triggers because session hooks not registered
- ❌ **Parallel brain execution** - Brains initialize but don't coordinate
- ❌ **Council coordination** - Alpha/Beta/Gamma brains are stubs with no real logic
- ❌ **Output verification** - Registered but never called by task completion

---

## PROBLEM ANALYSIS

### Root Cause

The plugin factory in `src/index.ts` only registers basic hooks:

```typescript
// CURRENT (lines 541-559):
'tool.execute.before': safeHook(...),  // Just tracks last tool
'chat.message': clusterStateHook,       // Just tracks state
'experimental.chat.system.transform': safeHook(...), // Injects context
```

The sophisticated V2.0 hooks exist:
- `createEventHook()` - session.created, session.compacting
- `createChatMessageHook()` - Layer 2 message enforcement
- `createToolGuardianHook()` - Layer 1 tool enforcement  
- `createGateHook()` - Post-tool gate evaluation
- `createCompactionHook()` - Session compaction

**BUT THEY'RE NEVER REGISTERED!**

---

## ARCHITECTURE COMPARISON

### What V2.0 Spec Says (Context Library)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KRAKEN V2.0 ORCHESTRATOR                             │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            │
│  │  PLANNING   │────────▶│  EXECUTION  │◀────────│   SYSTEM    │            │
│  │   BRAIN     │         │   BRAIN    │         │   BRAIN     │            │
│  └─────────────┘         └─────────────┘         └─────────────┘            │
│                                                                           │
│  ════════════════════════════════════════════════════════════════════════  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │               SYSTEM BRAIN — DYNAMIC CONTEXT MANAGEMENT                │  │
│  │  Tier 0: Proactive (65%) → Tier 1: Pre-compaction (75%)               │  │
│  │  Tier 2: Post-compaction (85%) → Tier 3: Dynamic Injection             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### What Actually Happens

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    KRAKEN PLUGIN (CURRENT)                                   │
│                                                                              │
│  Kraken Agent (registered)                                                  │
│    └── Instructions loaded                                                   │
│    └── Tools available                                                       │
│    └── BUT NO HOOKS FIRE                                                    │
│                                                                              │
│  Brains (initialized but idle)                                              │
│    ├── PlanningBrain ──→ idle                                               │
│    ├── ExecutionBrain ──→ idle                                              │
│    ├── SystemBrain ──→ idle                                                 │
│    └── CouncilCoordinator ──→ idle                                          │
│                                                                              │
│  Hooks (defined but unregistered)                                           │
│    ├── createEventHook() ──→ NEVER CALLED                                   │
│    ├── createChatMessageHook() ──→ NEVER CALLED                             │
│    ├── createToolGuardianHook() ──→ NEVER CALLED                            │
│    └── createGateHook() ──→ NEVER CALLED                                    │
│                                                                              │
│  Result: Single-agent execution, no orchestration                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## DETAILED ISSUES

### Issue 1: Event Hooks Never Fire

**File:** `src/hooks/index.ts`  
**Function:** `createEventHook()`  
**Problem:** Never registered with OpenCode

```typescript
// hooks/index.ts defines:
export function createEventHook(): Hooks['event'] {
  return async ({ event }) => {
    if (event.type === 'session.created') {
      // Initialize brains...
    }
    if (event.type === 'session.compacting') {
      // Trigger compaction...
    }
  };
}
```

**Fix:** Register in plugin factory:
```typescript
// In src/index.ts plugin factory:
'event': createEventHook(),
```

### Issue 2: Two-Layer Guardian Never Active

**File:** `src/brains/system/two-layer-guardian.ts`  
**Problem:** Hooks not registered, so pattern matching never runs

The Guardian has:
- 9 THEATRICAL_PATTERNS (Layer 1)
- 6 FAKE_COMPLETION_MESSAGE_PATTERNS (Layer 2)
- 6 HOST_FALLBACK_MESSAGE_PATTERNS (Layer 2)
- 8 SUCCESS_CLAIM_MESSAGE_PATTERNS (Layer 2)

**BUT** - Since hooks not registered, these patterns never block anything.

### Issue 3: Compaction System Never Triggers

**File:** `src/brains/system/compaction-manager.ts`  
**Problem:** Requires `session.compacting` event which never fires

Four tiers defined:
- Tier 0: 65% - Warning
- Tier 1: 75% - Pre-compaction export
- Tier 2: 85% - Post-compaction synthesis
- Tier 3: Dynamic injection

**BUT** - Without event hook, never activates.

### Issue 4: Roundtable Council is Stub Code

**File:** `src/brains/council/roundtable-council.ts`

```typescript
// AlphaBrain.executeBuild() - what's implemented:
async executeBuild(task: { taskId: string; description: string }): Promise<void> {
  console.log(`[AlphaBrain] Executing build: ${task.description}`);
  // Steamroll implementation
  // TODO: Implement actual steamroll logic
}

// BetaBrain.executeDebug() - what's implemented:
async executeDebug(task: { taskId: string; description: string }): Promise<void> {
  console.log(`[BetaBrain] Executing debug: ${task.description}`);
  // TODO: Implement actual precision logic
}
```

**Problem:** No real coordination logic - just console.log.

### Issue 5: Output Verification Never Called

**File:** `src/shared/output-verifier.ts`  
**Problem:** Registered but task completion never invokes it

```typescript
// ExecutionBrain.registerTaskOutputs() is defined:
registerTaskOutputs(taskId: string, outputs: {...}[]): void {
  this.outputVerifier.registerOutputs(taskId, outputs);
}

// BUT no code path calls this when tasks complete
```

### Issue 6: Planning Brain is Stub

**File:** `src/brains/planning/planning-brain.ts`

```typescript
// loadT2Master() - what's implemented:
async loadT2Master(): Promise<void> {
  console.log('[PlanningBrain] Loading T2 Master context...');
  await this.delay(100);  // Simulate loading
  this.t2MasterLoaded = true;
}
```

**Problem:** Just simulates loading, doesn't actually load T2 context.

---

## REQUIRED FIXES

### Fix 1: Wire Up Event Hooks

**File:** `src/index.ts`  
**Location:** Plugin factory return object (around line 560)

**Current:**
```typescript
return {
  name: ...,
  tool: allTools,
  config: ...,
  // Only basic hooks registered
};
```

**Required:**
```typescript
return {
  name: ...,
  tool: allTools,
  config: ...,
  
  // Wire up V2.0 Hooks
  'event': createEventHook(),
  'chat.message': createChatMessageHook(),
  'tool.execute.before': createToolGuardianHook(),
  'tool.execute.after': createGateHook(),
};
```

### Fix 2: Wire Up Brain Coordination

The brains need to actively coordinate. Currently:
- `session.created` → initializes brains
- But no mechanism for ongoing coordination

**Required:** Add brain-to-brain messaging that fires on tool calls

### Fix 3: Implement Council Coordination

**File:** `src/brains/council/roundtable-council.ts`

The cluster brains need real logic:
- Alpha: Knows how to steamroll builds
- Beta: Knows how to debug precisely
- Gamma: Knows how to test thoroughly

### Fix 4: Wire Output Verification to Task Completion

**File:** `src/tools/cluster-tools.ts` or `src/factory/AsyncDelegationEngine.ts`

When `spawn_cluster_task` completes, must call:
```typescript
await executionBrain.claimOutputsRetrieved(taskId, hostPaths);
```

### Fix 5: Implement T2 Master Loading

**File:** `src/brains/planning/planning-brain.ts`

Actually load the T2 context from:
- `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/.../T2_*.md`
- Or the kraken-context library

### Fix 6: Auto-Orchestration Trigger

The user shouldn't have to manually prompt for Kraken architecture.

**Required:** When Kraken agent receives a task, it should automatically:
1. Load T2 Master context
2. Decompose task with Planning Brain
3. Assign to appropriate cluster via Council
4. Monitor with Execution Brain
5. Enforce with System Brain

---

## IMPLEMENTATION PLAN

### Phase 1: Hook Wiring (Critical)

1. Register all hooks in plugin factory
2. Verify `session.created` initializes brains
3. Verify `session.compacting` triggers compaction
4. Verify `tool.execute.before` fires Two-Layer Guardian
5. Verify `chat.message` fires Message Guardian

### Phase 2: Brain Coordination

1. Implement `brain-messenger.ts` properly
2. Wire Planning → Execution → System messaging
3. Add coordination triggers on tool calls

### Phase 3: Council Implementation

1. Expand AlphaBrain with steamroll logic
2. Expand BetaBrain with precision logic
3. Expand GammaBrain with testing logic
4. Implement inter-cluster communication

### Phase 4: Output Verification Wiring

1. Find where tasks complete
2. Wire `executionBrain.claimOutputsRetrieved()`
3. Add `outputVerifier.canComplete()` check
4. Block completion if outputs not verified

### Phase 5: T2 Master Loading

1. Implement actual T2 context loading
2. Load patterns from kraken-context library
3. Generate T1 from SPEC.md analysis

### Phase 6: Auto-Orchestration

1. Make Kraken automatically use architecture
2. No manual prompting required
3. Session starts → brains initialize → ready to coordinate

---

## SUCCESS CRITERIA

### Functional

- [ ] `session.created` → All brains initialize, council initializes
- [ ] `session.compacting` → Compaction system triggers, context exported
- [ ] Tool call → Two-Layer Guardian checks patterns
- [ ] Message to agent → Message Guardian checks patterns
- [ ] Task complete → Output verification runs
- [ ] Gate reached → All brains sync

### Behavioral

- [ ] Kraken automatically uses multi-brain architecture
- [ ] No manual prompting required for orchestration
- [ ] Cluster assignment automatic based on task type
- [ ] Parallel execution when appropriate
- [ ] Compaction preserves stream of consciousness

---

## FILES TO MODIFY

| File | Change |
|------|--------|
| `src/index.ts` | Register all V2.0 hooks |
| `src/hooks/index.ts` | May need modifications |
| `src/brains/council/roundtable-council.ts` | Implement real coordination |
| `src/brains/planning/planning-brain.ts` | Implement T2 loading |
| `src/tools/cluster-tools.ts` | Wire output verification |
| `src/factory/AsyncDelegationEngine.ts` | Wire output verification |
| `src/shared/brain-messenger.ts` | May need modification |

---

## CONTEXT LIBRARIES REFERENCE

The following context library files define the FULL ARCHITECTURE that should be implemented:

**V1.2 Context Library:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/V1.2 Build/Working Context Library/`
- `01_ARCHITECTURE_OVERVIEW.md` - Triple-brain + Roundtable
- `06_V1.2_MULTI_BRAIN_INTEGRATION.md` - Brain wiring
- `12_ROUNDTABLE_COUNCIL.md` - Cluster coordination
- `13_SUBAGENT_MANAGER_BRAIN.md` - Subagent autonomy

**V2.0 Context Library:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/V2.0 Optimized/Working Context Library/`
- `01_ARCHITECTURE_OVERVIEW.md` - V2.0 optimizations
- `06_TWO_LAYER_FIREWALL.md` - Tool + Message enforcement
- `07_MECHANICAL_OUTPUT_VERIFICATION.md` - fs.existsSync() checkpoints
- `11_COMPACTION_MANAGEMENT.md` - Four-tier compaction
- `COMPACTION_MANAGEMENT.md` - Full compaction spec

---

**Document Version:** 1.0  
**Created:** 2026-04-15  
**Status:** Ready for Implementation
