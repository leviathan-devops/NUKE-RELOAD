// @bun
// src/index.ts
var state = {
  mode: "idle",
  currentLayer: 1,
  artifacts: new Map,
  initialized: true,
  status: "IDLE"
};
var CORE_PRINCIPLE = "Trident Debug. Humans Fix.";
var currentLayerNum = 1;
function getStatus() {
  return `## TRIDENT PROBLEM SOLVING v1.0 STATUS

Mode: ${state.mode || "idle"}
Current Layer: ${currentLayerNum}/6
Status: ${state.status}
Initialized: ${state.initialized ? "YES" : "NO"}

CORE PRINCIPLE: "${CORE_PRINCIPLE}"

Problem Solving NEVER EDITS. It only documents assumptions, predicts expected vs actual, collects evidence, and analyzes gaps.

THE 6 LAYERS:
1. ASSUMPTION - What do I assume?
2. ACTION - What action + expected?
3. OBSERVATION - What actually happened?
4. GAP ANALYSIS - What does gap tell me?
5. META-REFLECTION - What should I have done?
6. VERIFICATION - Did it work?

Say "start" to begin debugging.`;
}
function getHelp() {
  return `## TRIDENT PROBLEM SOLVING v1.0

CORE PRINCIPLE: "${CORE_PRINCIPLE}"

What It Does:
Problem Solving produces structured debugging through mechanical gates.

Iteration Cycle:
ASSUMPTION -> ACTION -> OBSERVATION -> GAP -> META -> VERIFICATION

COMMANDS:
- start - Begin the problem solving process
- status - Show current state
- help - Show this help
- show analysis - Display current analysis
- reset - Reset to initial state
- continue - Advance to next layer`;
}
function runStart() {
  state.mode = "solving";
  currentLayerNum = 1;
  state.status = "LAYER_IN_PROGRESS";
  state.artifacts.clear();
  return `## TRIDENT PROBLEM SOLVING - LAYER 1

Layer 1: ASSUMPTION STATEMENT

Thinking: "What do I assume? What do I believe will happen?"

Gate Requirements:
- Explicit ASSUMPTION stated in one sentence
- REASONING CHAIN (why you believe it)
- SUCCESS CRITERIA defined upfront
- What would CONFIRM/DISPROVE the assumption

Example:
"My assumption is that the error occurs because X. I believe this because Y. Success = Z. This would be disproved if W."

Enter your assumption, then say "continue".`;
}
function runContinue(content) {
  if (currentLayerNum === 1) {
    state.artifacts.set("layer1", content || "Assumption recorded");
    currentLayerNum = 2;
    return `## LAYER 1 COMPLETE -> LAYER 2

Layer 2: ACTION WITH PREDICTION

Thinking: "What action will I take? What specific output do I expect?"

Gate Requirements:
- EXACT COMMAND to execute
- EXPECTED OUTPUT documented BEFORE execution
- ENVIRONMENT STATE captured

Example:
Command: npm test
Expected: All tests pass with 0 failures
Environment: Node 20, npm 10

Enter your action, then say "continue".`;
  }
  if (currentLayerNum === 2) {
    state.artifacts.set("layer2", content || "Action recorded");
    currentLayerNum = 3;
    return `## LAYER 2 COMPLETE -> LAYER 3

Layer 3: OBSERVATION & EVIDENCE

Thinking: "What actually happened? Show me the proof."

Gate Requirements:
- RAW OUTPUT copied verbatim
- LOGS CHECKED (list which ones)
- EXPECTED vs ACTUAL comparison

Enter your observation, then say "continue".`;
  }
  if (currentLayerNum === 3) {
    state.artifacts.set("layer3", content || "Observation recorded");
    currentLayerNum = 4;
    return `## LAYER 3 COMPLETE -> LAYER 4

Layer 4: GAP ANALYSIS & ADJUSTMENT

Thinking: "The gap tells me what? Adjust hypothesis."

Gate Requirements:
- GAP ANALYSIS (what is the difference?)
- UPDATED HYPOTHESIS (what is the real cause?)
- NEXT ACTION tied to insight

Enter your gap analysis, then say "continue".`;
  }
  if (currentLayerNum === 4) {
    state.artifacts.set("layer4", content || "Gap analysis recorded");
    currentLayerNum = 5;
    return `## LAYER 4 COMPLETE -> LAYER 5

Layer 5: META-COGNITIVE REFLECTION

Thinking: "What should I have done differently?"

Gate Requirements:
- PATTERN EXTRACTED (what systemic issue exists?)
- LESSON LEARNED (what would you do differently?)

Enter your reflection, then say "continue".`;
  }
  if (currentLayerNum === 5) {
    state.artifacts.set("layer5", content || "Reflection recorded");
    currentLayerNum = 6;
    return `## LAYER 5 COMPLETE -> LAYER 6

Layer 6: VERIFICATION & CONFIRMATION

Thinking: "How do I know the fix actually worked?"

Gate Requirements:
- VERIFICATION COMMAND executed
- BEHAVIOR MATCH confirmed
- RESULT documented

Enter your verification, then say "continue".`;
  }
  if (currentLayerNum === 6) {
    state.artifacts.set("layer6", content || "Verification recorded");
    state.status = "COMPLETE";
    return generateFinalReport();
  }
  return "Unknown state.";
}
function generateFinalReport() {
  return `# TRIDENT PROBLEM SOLVING - FINAL REPORT

Generated: ${new Date().toISOString()}
Layers Completed: 6/6

LAYER 1: ASSUMPTION
${state.artifacts.get("layer1") || "N/A"}

LAYER 2: ACTION & PREDICTION
${state.artifacts.get("layer2") || "N/A"}

LAYER 3: OBSERVATION & EVIDENCE
${state.artifacts.get("layer3") || "N/A"}

LAYER 4: GAP ANALYSIS
${state.artifacts.get("layer4") || "N/A"}

LAYER 5: META-REFLECTION
${state.artifacts.get("layer5") || "N/A"}

LAYER 6: VERIFICATION
${state.artifacts.get("layer6") || "N/A"}

Generated by Trident Problem Solving v1.0
${CORE_PRINCIPLE}`;
}
async function TridentProblemSolvingPlugin() {
  return {
    tool: {
      "trident-solve": {
        description: "Trident Problem Solving - Evidence-based debugging with 6-layer mechanical gates",
        args: {},
        execute: async (args, context) => {
          const message = args.message || "status";
          const msg = message.toLowerCase().trim();
          if (msg.includes("start") || msg.includes("debug")) {
            return runStart();
          }
          if (msg.includes("status")) {
            return getStatus();
          }
          if (msg.includes("help")) {
            return getHelp();
          }
          if (msg.includes("show analysis")) {
            return generateFinalReport();
          }
          if (msg.includes("reset")) {
            state.mode = "idle";
            currentLayerNum = 1;
            state.status = "IDLE";
            state.artifacts.clear();
            return 'Reset complete. Say "start" to begin.';
          }
          if (msg.includes("continue")) {
            return runContinue();
          }
          if (state.status === "LAYER_IN_PROGRESS") {
            return runContinue(message);
          }
          return 'Say "help" for commands or "start" to begin.';
        }
      }
    },
    "tool.execute.before": async (input, output) => {
      const BLOCKED_TOOLS = ["edit", "sed", "write", "write_file", "apply_diff"];
      const isBlocked = BLOCKED_TOOLS.some((t) => input.tool === t);
      if (isBlocked) {
        output.blocked = true;
        output.blockReason = "[Trident] BLOCKED - Problem Solving is documentation-only.";
      }
    },
    "chat.message": async (input, output) => {
      if (input.agent !== "trident-solve")
        return;
      const msg = (input.message || "").toLowerCase().trim();
      if (msg.includes("start") || msg.includes("debug")) {
        output.content = runStart();
        return;
      }
      if (msg.includes("status")) {
        output.content = getStatus();
        return;
      }
      if (msg.includes("help")) {
        output.content = getHelp();
        return;
      }
      if (msg.includes("show analysis")) {
        output.content = generateFinalReport();
        return;
      }
      if (msg.includes("reset")) {
        state.mode = "idle";
        currentLayerNum = 1;
        state.status = "IDLE";
        state.artifacts.clear();
        output.content = 'Reset complete. Say "start" to begin.';
        return;
      }
      if (msg.includes("continue")) {
        output.content = runContinue();
        return;
      }
      if (state.status === "LAYER_IN_PROGRESS") {
        output.content = runContinue(input.message);
        return;
      }
      output.content = 'Say "help" for commands or "start" to begin.';
    }
  };
}
export {
  TridentProblemSolvingPlugin as default
};
