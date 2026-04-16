# IDENTITY SPAWN INJECTION — ANALYSIS & FIX PLAN

**Last Updated:** 2026-04-16T20:50 UTC
**Status:** ISSUE IDENTIFIED — FIX PENDING
**Priority:** HIGH (blocking sub-agent identity)

---

## THE PROBLEM

When spawning sub-agents via `spawn_shark_agent`, they respond as vanilla OpenCode instead of Kraken orchestrator identity.

**Evidence:**
```
User: who are you?
Agent: "I'm Opencode, an interactive CLI tool..."
Expected: "You ARE the Kraken orchestrator..."
```

**Root Cause:** Identity injection only happens at plugin initialization via `experimental.chat.system.transform` hook. The spawn tools don't include identity context in the task they pass to sub-agents.

---

## CURRENT ARCHITECTURE

### How Identity Loads (Plugin Level) ✅

```typescript
// src/index.ts - Plugin initialization
const identityLoader = new IdentityLoader();
const bundle = await identityLoader.loadForRole('orchestrator');
await injectIdentity(session, bundle);  // Only runs at session start
```

This works for the **primary kraken agent** (the orchestrator itself), but NOT for **spawned sub-agents**.

### How Spawn Works (Sub-Agent Level) ❌

```typescript
// src/tools/cluster-tools.ts - spawn_shark_agent
const request: KrakenDelegationRequest = {
  taskId,
  task: sharkPrompt,  // Just a prompt string, no identity context
  targetCluster: resolvedCluster,
  ...
};
const result = await ctx.delegationEngine.delegate(request);
```

The `sharkPrompt` is just a character description, NOT the full Kraken identity.

---

## WHAT NEEDS TO CHANGE

### Option A: Modify Spawn Tools to Include Identity (RECOMMENDED)

Modify `cluster-tools.ts` to include full Kraken identity in spawned task context:

**Files to modify:**
- `src/tools/cluster-tools.ts` — `spawn_shark_agent`, `spawn_manta_agent`, `spawn_cluster_task`
- `src/identity/injector.ts` — Add `formatForTaskContext()` method

**Changes needed:**
1. Import `IdentityLoader` and `formatIdentityForSystemPrompt`
2. Load orchestrator identity in spawn tool context
3. Prepend identity to the task prompt
4. Include identity context in `KrakenDelegationRequest.context`

### Option B: Modify Delegation Engine (MORE COMPLEX)

Modify the delegation engine to automatically inject identity when delegating to sub-agents.

**Files to modify:**
- `src/factory/async-delegation-engine.ts`
- `src/clusters/cluster-instance.ts`

This is more complex because it requires passing identity through multiple layers.

---

## RECOMMENDED FIX

### Step 1: Add Helper Function

Add to `src/identity/injector.ts`:

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

### Step 2: Modify Spawn Tools

In `src/tools/cluster-tools.ts`, modify the `ClusterToolsContext` interface to include identity loader:

```typescript
export interface ClusterToolsContext {
  // ... existing fields ...
  identityLoader: {
    loadForRole(role: string): Promise<IdentityBundle>;
  };
}
```

Then in `spawn_shark_agent` execute function:

```typescript
// Load identity and format task
const bundle = await ctx.identityLoader.loadForRole('orchestrator');
const fullTask = formatIdentityForTaskContext(bundle, args.task);

const request: KrakenDelegationRequest = {
  taskId,
  task: fullTask,  // Now includes identity context
  ...
};
```

### Step 3: Verify

After implementing:
1. Spawn a shark agent with `spawn_shark_agent`
2. Ask it "who are you?"
3. Verify it responds with Kraken identity

---

## FILES REFERENCE

| File | Purpose |
|------|---------|
| `src/tools/cluster-tools.ts` | Spawn tools (spawn_shark_agent, etc.) |
| `src/identity/injector.ts` | Identity formatting |
| `src/identity/loader.ts` | Identity file loading |
| `src/identity/types.ts` | IdentityBundle type |
| `identity/orchestrator/*.md` | Identity source files |

---

## IDENTITY FILES CONTENT

### KRAKEN.md (Soul)
```
You ARE the Kraken orchestrator. You are not a chatbot. You are not a solo coder.
You are an EXECUTION ENGINE with parallel processing capability.

Core Directives:
1. DELEGATE, don't do directly. If a task can be delegated, it MUST be delegated.
2. EXECUTE in parallel. Never do sequentially what can be done simultaneously.
3. VERIFY everything. Never assume code works — run it, check the output.
4. FAIL FAST. If something breaks, debug it immediately.
5. LEARN from mistakes. Every failure updates your knowledge.
```

### IDENTITY.md (Role)
```
You are the Kraken Multi-Brain Orchestrator — the top-level agent that coordinates
sub-agents to execute work in parallel.

Architecture:
- Planning Brain: T2 loading, T1 generation, task decomposition
- Execution Brain: Task supervision, output verification
- System Brain: Workflow tracking, security, gate management
- Brain Messenger: Inter-brain communication
```

---

## IMPLEMENTATION NOTES

1. **Identity is per-role** — Currently only `orchestrator` identity exists. Need to ensure spawned sub-agents also get appropriate identity injection.

2. **Context vs Prompt** — The identity should be prepended to the task, not passed as separate context, so it appears in the sub-agent's system prompt.

3. **Caching** — The `IdentityLoader` already caches, so repeated loads are fast.

4. **Error Handling** — If identity loading fails during spawn, should log warning but still allow spawn (don't block delegation).

---

**Next Action:** Implement the fix in `src/tools/cluster-tools.ts` to include identity in spawned tasks.
