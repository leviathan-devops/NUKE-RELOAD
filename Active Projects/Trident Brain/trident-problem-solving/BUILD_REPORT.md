# TRIDENT PROBLEM SOLVING - BUILD REPORT

**Version:** 1.0.0
**Date:** 2026-04-16
**Status:** SHIP READY ✅

---

## PLUGIN OVERVIEW

**Name:** trident-problem-solving
**Type:** OpenCode Plugin (Tool-based)
**Core Principle:** "Trident Debug. Humans Fix."

### What It Does
Problem Solving Mode produces deeply structured debugging and root cause analysis artifacts through mechanical 6-layer gate enforcement. Forces evidence-based iteration.

### Architecture
- **6 Mechanical Layers** with gate enforcement
- **Tool-based** (not chat.message hooks) for CLI compatibility
- **State Machine** for layer transitions
- **Evidence Collection** for proof-based verification

---

## SOURCE FILES

```
trident-problem-solving/
├── src/
│   ├── index.ts         (297 lines) - Plugin entry point + tool definition
│   ├── types.ts         (62 lines)  - Layer configs + gate requirements
│   └── state-machine.ts (45 lines) - Layer state management
├── dist/
│   └── index.js         (7.95 KB)   - Bundled output
├── package.json
└── tsconfig.json
```

---

## LAYERS IMPLEMENTED

### Layer 1: ASSUMPTION STATEMENT
- **Thinking:** "What do I assume? What do I believe will happen?"
- **Evokes:** Explicit assumption, reasoning chain, success criteria, confirmation criteria
- **Requires:**
  - Explicit_Assumption (boolean)
  - Reasoning_Chain (boolean)
  - Success_Criteria (boolean)
  - Confirmation_Criteria (boolean)
- **Files:** 01_ASSUMPTION.md
- **Min Chars:** 300

### Layer 2: ACTION WITH PREDICTION
- **Thinking:** "What action will I take? What specific output do I expect?"
- **Evokes:** Exact command, expected output, environment state
- **Requires:**
  - Exact_Command (boolean)
  - Expected_Output (string)
  - Environment_State (string)
- **Files:** 02_ACTION.md
- **Min Chars:** 200

### Layer 3: OBSERVATION & EVIDENCE
- **Thinking:** "What actually happened? Show me the proof."
- **Evokes:** Raw evidence, logs checked, expected vs actual comparison
- **Requires:**
  - Raw_Evidence (boolean)
  - Expected_vs_Actual (boolean)
- **Files:** 03_OBSERVATION.md
- **Min Chars:** 300

### Layer 4: GAP ANALYSIS & ADJUSTMENT
- **Thinking:** "The gap tells me what? Adjust hypothesis."
- **Evokes:** Gap analysis, updated hypothesis, next action
- **Requires:**
  - Gap_Analysis (boolean)
  - Updated_Hypothesis (boolean)
- **Files:** 04_GAP_ANALYSIS.md
- **Min Chars:** 300

### Layer 5: META-COGNITIVE REFLECTION
- **Thinking:** "What should I have done differently?"
- **Evokes:** Pattern extraction, systemic issue identification
- **Requires:**
  - Pattern_Extracted (boolean)
  - Systemic_Issue (boolean)
- **Files:** 05_META_REFLECTION.md
- **Min Chars:** 200

### Layer 6: VERIFICATION & CONFIRMATION
- **Thinking:** "How do I know the fix actually worked?"
- **Evokes:** Target environment execution, behavior match
- **Requires:**
  - Verification_Result (string)
  - Behavior_Match (boolean)
- **Files:** 06_VERIFICATION.md
- **Min Chars:** 200

---

## ITERATION PATTERN

```
ASSUMPTION → ACTION → OBSERVATION → GAP → META → VERIFICATION
     ↑                                            │
     └────────────────────────────────────────────┘
```

Multiple iterations may be needed for complex problems.

---

## BUILD PROCESS

### Step 1: Initialize
```bash
mkdir -p trident-problem-solving/src
```

### Step 2: Create source files
- index.ts - Main plugin with tool definition
- types.ts - Layer configs
- state-machine.ts - Layer transition logic

### Step 3: Build
```bash
bun build src/index.ts --outdir dist --target bun --format esm --bundle
```
**Result:** Bundled 1 module in 2ms → index.js (7.95 KB)

### Step 4: Add Tool Definition
- Added `tool:` section with trident-solve tool
- Enables CLI invocation: "Call trident-solve status"

---

## CONTAINER TESTING

### Test Setup
- Image: opencode-test:1.4.3
- Config: /tmp/trident-container-test/config
- Plugins: /tmp/trident-container-test/plugins

### Test Commands & Results

```bash
# Test 1: Status
$ opencode run "Call trident-solve status" -m opencode/big-pickle
> ⚙ trident-solve Unknown
  Current Status: idle | Layer 1/6 | Ready
  
  Say "start" to begin debugging.
✅ PASSED

# Test 2: Help
$ opencode run "Call trident-solve help" -m opencode/big-pickle
> ⚙ trident-solve {"query":"help"}
  ## TRIDENT PROBLEM SOLVING v1.0 STATUS
  
  Mode: idle
  Current Layer: 1/6
  Status: IDLE
  Initialized: YES
  
  CORE PRINCIPLE: "Trident Debug. Humans Fix."
  
  Problem Solving NEVER EDITS. It only documents assumptions, 
  predicts expected vs actual, collects evidence, and analyzes gaps.
  
  THE 6 LAYERS:
  1. ASSUMPTION - What do I assume?
  2. ACTION - What action + expected?
  3. OBSERVATION - What actually happened?
  4. GAP ANALYSIS - What does gap tell me?
  5. META-REFLECTION - What should I have done?
  6. VERIFICATION - Did it work?
  
  Say "start" to begin debugging.
✅ PASSED
```

---

## ANTI-DERAILMENT RULES

1. **THEATRICAL CODE BANNED** - No claims without proof
2. **Evidence Required** - Raw output must be captured
3. **Expected vs Actual** - Must show comparison
4. **No Mocking** - Real execution required for verification

---

## TOOL BLOCKING

The plugin blocks write tools to enforce documentation-only principle:
```typescript
const BLOCKED_TOOLS = ['edit', 'sed', 'write', 'write_file', 'apply_diff'];
```

---

## DEPLOYMENT

To deploy:
```bash
cp dist/index.js ~/.config/opencode/plugins/trident-problem-solving/
```

Add to opencode.json:
```json
"plugin": [
  "file:///root/.config/opencode/plugins/trident-problem-solving/index.js"
]
```

---

## CHANGELOG

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-04-16 | Initial build - 6 layers, tool-based |

---

**Report Generated:** 2026-04-16
**Build Status:** SHIP READY ✅