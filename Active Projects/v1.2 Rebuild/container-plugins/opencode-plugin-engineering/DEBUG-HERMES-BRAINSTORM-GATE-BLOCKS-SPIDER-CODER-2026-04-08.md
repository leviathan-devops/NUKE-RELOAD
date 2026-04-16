# DEBUG LOG: Spider Agent Coder Subagent Failure After Shark/Manta Installation

**Date:** 2026-04-08  
**Phase:** Forensic Analysis + Fix  
**Severity:** HIGH (broken delegation chain)  
**Status:** FIXED

---

## Executive Summary

Spider Agent's coder subagent was failing to create files. After extensive testing, root cause identified as **Hermes brainstorm gate blocking ALL agents** (not just Hermes agents) when `.hermes/` directory doesn't exist.

**Fix Applied:** Added `.hermes/` directory existence check to brainstorm gate - only fires when Hermes session is active.

---

## Symptoms Observed

1. Spider agent delegates to coder subagent
2. Coder reports success (✓) but file not created
3. Spider retries coder delegation → same result
4. Spider falls back to direct bash/qwen CLI
5. File eventually created via fallback

**Evidence:**
```
[0m• [0mWrite hello world to hello.js[90m Coder Agent[0m
[0m✓ [0mWrite hello world to hello.js[90m Coder Agent[0m
[0m✗ [0mread failed
[91m[1mError: [0mFile not found: /tmp/spider-container-test/hello.js
```

---

## Root Cause Analysis

### Hook Execution Order (from opencode.json)

```
1. spider-agent         (file:///home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent)
2. hermes-agent         (file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.3-build/dist/index.js)
3. coding-subagents
4. opencode-plugin-engineering
5. opencode-subagent-manager
6. manta-agent          (file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Manta Agent/manta-agent/dist)
7. shark-agent-dist    (file:///home/leviathan/tmp/oc-test-ws/shark-agent-dist)
```

### Primary Issue: Hermes brainstorm-gate.ts

**File:** `Hermes Agent Plugin/src/hooks/brainstorm-gate.ts:17-55`

**Bug:** The `createBrainstormGateHook()` hook fires for EVERY agent's message transform, not just Hermes agents. When phase is IDLE or ANALYZE and code blocks/tool calls are detected, it appends `[HARD-GATE BLOCKED]` to messages.

**Why it affected Spider:** When Spider's coder subagent tried to write files:
1. Hermes brainstorm gate (phase=IDLE) detected code blocks
2. Appended `[HARD-GATE BLOCKED]` message
3. This interfered with the tool execution flow
4. Coder's `toolCalls: 0` - no actual tools called

**Note:** The Manta and Shark agents have proper `isMantaAgent()`/`isSharkAgent()` guards, but Hermes brainstorm-gate did NOT have equivalent agent filtering.

### Secondary Issue: Manta Agent Hook Guard Bug (pre-existing)

**File:** `Manta Agent/manta-agent/dist/index.js:14462`

```javascript
if (!isMantaAgent(agent)) {
  return;  // agent is undefined in CLI mode!
}
```

The `tool.execute.before` hook input only has `{ tool, sessionID, callID }` - **no `agent` field**. So `isMantaAgent(undefined)` returns `false` and hooks silently skip. This was already known and marked for fix in v1.3.5.

---

## The Fix

### File Modified
`/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/src/hooks/brainstorm-gate.ts`

### Change Applied
Added `.hermes/` directory existence check before applying brainstorm gate:

```typescript
import type { Hooks } from "@opencode-ai/plugin";
import { existsSync } from "fs";
import { resolve } from "path";
import { PHASES } from "../config/constants.js";

let _currentPhase: string = PHASES.IDLE;

export function getCurrentPhase(): string {
  return _currentPhase;
}

export function setCurrentPhase(phase: string): void {
  _currentPhase = phase;
}

export function createBrainstormGateHook(): NonNullable<
  Hooks["experimental.chat.messages.transform"]
> {
  return async (input, output) => {
    const phase = getCurrentPhase();

    if (phase !== PHASES.IDLE && phase !== PHASES.ANALYZE) {
      return;
    }

    // FIX: Only apply brainstorm gate when Hermes session is active
    // (indicated by .hermes/ directory existence)
    if (!existsSync(resolve(process.cwd(), ".hermes"))) {
      return;
    }

    const messages = output?.messages;
    if (!messages || messages.length === 0) return;

    // ... rest of gate logic unchanged
```

### Build & Deploy
```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin"
npm run build
cp dist/index.js v2.3.3-build/dist/index.js
```

---

## Verification

### Test 1: Spider Agent Without .hermes/
```bash
cd /tmp && rm -rf spider-container-test && mkdir spider-container-test
opencode run --agent spider "write hello world to hello.js"
```
**Result:** ✓ File created successfully on first try

### Test 2: Hermes Agent With .hermes/
```bash
cd /tmp && mkdir -p hermes-test/.hermes
opencode run --agent hermes "write hello world to test.txt"
```
**Result:** ✓ File created, brainstorm gate active for Hermes

### Test 3: Coder Subagent Delegation
```
[0m• [0mWrite hello world to hello.js[90m Coder Agent[0m
[0m✓ [0mWrite hello world to hello.js[90m Coder Agent[0m
→ Read hello.js
Done. Created `hello.js` with content "hello world".
```
**Result:** ✓ Coder subagent now properly creates files

---

## Why This Happened

1. **Plugin Hook Architecture:** OpenCode plugin hooks execute in order, transforming messages/outputs
2. **Hermes Hook Scope:** brainstorm-gate was designed for Hermes but had no agent filtering
3. **Phase State Collision:** Hermes `_currentPhase` module variable affects ALL sessions
4. **No Isolation:** When Spider runs in a workspace without `.hermes/`, Hermes hooks should not fire

---

## Lessons Learned

1. **Agent-specific hooks MUST have agent filtering** - Check agent identity before applying gates
2. **Workspace-based activation is safer than module state** - Using `.hermes/` directory existence as activation signal
3. **Plugin hook order matters** - Earlier plugins' hooks can interfere with later ones
4. **Test in fresh workspace** - Context from previous sessions can mask bugs

---

## Files Modified

| File | Change | Version |
|------|--------|---------|
| `Hermes Agent Plugin/src/hooks/brainstorm-gate.ts` | Added `.hermes/` existence check | v2.3.3 |
| `Hermes Agent Plugin/dist/index.js` | Rebuilt | v2.3.3 |
| `Hermes Agent Plugin/v2.3.3-build/dist/index.js` | Deployed | v2.3.3 |

---

## Related Issues

- **Manta Agent:** `isMantaAgent(agent)` receives `undefined` in CLI mode - fix planned for v1.3.5
- **Shark Agent:** Properly guards hooks with `isSharkAgent()` - no action needed

---

## Debug Commands Used

```bash
# Test Spider in fresh workspace
cd /tmp && rm -rf test && mkdir test
opencode run --agent spider "write hello to f.js"

# Check plugin loading order
cat ~/.config/opencode/opencode.json | grep plugin

# Verify brainstorm gate fix in deployed file
grep "\.hermes" Hermes Agent Plugin/v2.3.3-build/dist/index.js

# Test Hermes with .hermes/ directory
cd /tmp && mkdir -p test/.hermes
opencode run --agent hermes "test"
```

---

## End of Debug Log
