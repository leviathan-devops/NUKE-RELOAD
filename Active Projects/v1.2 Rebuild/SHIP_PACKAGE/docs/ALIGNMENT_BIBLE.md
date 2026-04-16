# KRAKEN ALIGNMENT BIBLE

**Reference:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/KRAKEN_ALIGNMENT_BIBLE.md`

---

## THE ONE RULE

**IF IT'S NOT REAL, IT'S NOT DONE.**

---

## CRITICAL RULES

### 1. executeOnAgent NOT simulateTaskExecution

**Why:** `simulateTaskExecution` is theatrical - it pretends to execute but doesn't spawn real Docker containers.

**Correct:**
```typescript
// ClusterInstance.ts
const result = await executeOnAgent(clusterId, task, {
  timeout: timeout,
  priority: priority
});
```

**Wrong:**
```typescript
// This creates FAKE results that appear to work but don't actually execute
const result = await simulateTaskExecution(clusterId, task);
```

**How to verify:**
```bash
grep -c "simulateTaskExecution" dist/index.js  # MUST be 0
grep -c "executeOnAgent" dist/index.js         # MUST be > 0
```

---

### 2. Hooks Are Async Functions NOT Arrays

**Why:** v2.0 used arrays for hooks which caused async/await issues.

**Correct:**
```typescript
hooks: {
  'chat.message': async (ctx, msg) => {
    // async function
  }
}
```

**Wrong:**
```typescript
hooks: {
  'chat.message': [
    async (ctx, msg) => {},
    async (ctx, msg) => {}
  ]
}
```

---

### 3. State Cleanup on session.ended

**Why:** Prevents memory leaks across sessions.

**Correct:**
```typescript
// Clean up state when session ends
stateStore.cleanup();
brainMessenger.clear();
```

---

### 4. Container Testing MANDATORY

**Why:** Local testing can miss issues that appear in production.

**Rule:** ALL testing must happen in Docker container first.

**Workflow:**
```
Build → Container Test → Local Deploy (only after container passes)
```

---

### 5. Domain Ownership Enforcement

**Why:** Prevents brain cross-contamination.

**Rule:** Only the owning brain can write to a domain.

**Correct:**
```typescript
// Only Execution brain can write to quality-state
if (!canWrite('quality-state', 'kraken-execution')) {
  throw new Error('Not authorized');
}
```

---

### 6. No Theatrical Placeholders

**Why:** v2.0 had "theatrical" code that looked real but wasn't.

**Rule:** Every function must perform its stated purpose.

---

## BUNDLE SIZE AS QUALITY GATE

| Version | Bundle Size | Status |
|---------|-------------|--------|
| NUKE RELOAD v1.1 | ~521KB | Working |
| v2.0 (theatrical) | ~52KB | FAIL - 90% deleted |
| v1.2 target | ~540-560KB | Working |

**If bundle size drops unexpectedly, investigate.**

---

## EVIDENCE VARIABLE ORDERING

**Correct:**
```typescript
const evidence = {
  requirement: '...',
  implementation: '...',
  verification: '...',
  result: '...'
};
```

---

## PRE-DEPLOYMENT CHECKLIST

- [ ] Bundle size ~555KB
- [ ] executeOnAgent present (2+ refs)
- [ ] simulateTaskExecution absent (0 refs)
- [ ] All 3 brains initializing
- [ ] Container test passed
- [ ] No theatrical placeholders

---

**END ALIGNMENT BIBLE**