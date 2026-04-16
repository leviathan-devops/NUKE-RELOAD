// @bun
// src/types.ts
var DEEP_PLANNING_LAYERS = [
  {
    number: 1,
    name: "INITIAL PLAN",
    thinking: "What is this really? What are we trying to solve?",
    evokes: ["First Principles", "Surface Understanding", "Constraints", "Success Criteria", "Open Questions"],
    requires: [
      { field: "First_Principles", type: "number", value: 3 },
      { field: "Surface_Understanding", type: "boolean", value: true },
      { field: "Constraints", type: "number", value: 3 },
      { field: "Success_Criteria", type: "number", value: 1 },
      { field: "Open_Questions", type: "number", value: 2 }
    ],
    files: ["01_INITIAL_PLAN.md"],
    minChars: 500
  },
  {
    number: 2,
    name: "DETAILED BUILD WORKFLOW",
    thinking: "How does it decompose? What are the parts?",
    evokes: ["Components", "Sequencing", "Dependencies", "Failure Modes", "Verification"],
    requires: [
      { field: "Components", type: "number", value: 5 },
      { field: "Failure_Modes", type: "number", value: 3 },
      { field: "Dependencies", type: "number", value: 3 },
      { field: "Critical_Path", type: "boolean", value: true }
    ],
    files: ["02_COMPONENTS.md", "03_SEQUENCE.md", "04_DEPENDENCIES.md", "05_FAILURE_MODES.md", "06_VERIFICATION.md"],
    minChars: 2000
  },
  {
    number: 3,
    name: "SELF-CONTAINED CONTEXT LIBRARY",
    thinking: "Can I explain it so another agent can execute it?",
    evokes: ["Architecture", "Interfaces", "State Management", "Error Handling"],
    requires: [
      { field: "Architecture", type: "boolean", value: true },
      { field: "Interfaces", type: "boolean", value: true },
      { field: "State_Management", type: "boolean", value: true },
      { field: "Error_Handling", type: "boolean", value: true }
    ],
    files: ["00_INDEX.md", "ARCHITECTURE.md", "COMPONENTS.md", "DATA_FLOW.md", "INTERFACES.md", "STATE.md", "ERRORS.md"],
    minChars: 1500
  }
];

// src/state-machine.ts
class StateMachine {
  layers;
  state;
  transitionHistory = [];
  constructor(layers) {
    this.layers = layers;
    this.state = { currentLayer: 0, iteration: "V1.0", layerAttempts: 0, status: "IDLE", completedLayers: [] };
  }
  getState() {
    return { ...this.state };
  }
  start() {
    if (this.state.status === "IDLE") {
      this.state.currentLayer = 1;
      this.state.startedAt = new Date;
      this.state.status = "LAYER_IN_PROGRESS";
    }
  }
  completeLayer() {
    if (this.state.status === "COMPLETE")
      return false;
    if (!this.state.completedLayers.includes(this.state.currentLayer)) {
      this.state.completedLayers.push(this.state.currentLayer);
    }
    this.transitionHistory.push({ from: this.state.currentLayer, to: this.state.currentLayer + 1, timestamp: new Date, successful: true });
    if (this.state.currentLayer >= this.layers.length) {
      this.state.status = "COMPLETE";
      return false;
    }
    this.state.currentLayer++;
    this.state.layerAttempts = 0;
    this.state.status = "LAYER_IN_PROGRESS";
    return true;
  }
  failLayer(reason) {
    this.state.layerAttempts++;
    console.error(`Layer ${this.state.currentLayer} failed: ${reason}`);
  }
  reset() {
    this.state = { currentLayer: 0, iteration: "V1.1", layerAttempts: 0, status: "IDLE", completedLayers: [] };
  }
  isComplete() {
    return this.state.status === "COMPLETE";
  }
}

// src/index.ts
var state = {
  mode: "idle",
  currentLayer: 1,
  artifacts: new Map,
  initialized: true,
  status: "IDLE"
};
var CORE_PRINCIPLE = "Trident Plans. Humans Execute.";
var layers = DEEP_PLANNING_LAYERS;
var stateMachine = new StateMachine(layers);
function getStatus() {
  return `## TRIDENT DEEP PLANNING v1.0 STATUS

**Mode:** ${state.mode || "idle"}
**Current Layer:** ${state.currentLayer}/3
**Status:** ${state.status}
**Initialized:** ${state.initialized ? "\u2705" : "\u274C"}

---

## CORE PRINCIPLE: "${CORE_PRINCIPLE}"

Deep Planning NEVER EDITS. It only:
- Forces structured first-principles reasoning
- Enforces decomposition into components
- Creates self-contained context libraries

---

## THE 3 LAYERS

| Layer | Name | Thinking |
|-------|------|----------|
| 1 | INITIAL PLAN | "What is this really?" |
| 2 | DETAILED WORKFLOW | "How does it decompose?" |
| 3 | CONTEXT LIBRARY | "Can I explain to another agent?" |

**Say "start" to begin planning.**`;
}
function getHelp() {
  return `## TRIDENT DEEP PLANNING v1.0

**CORE PRINCIPLE:** "${CORE_PRINCIPLE}"

**What It Does:**
Deep Planning Mode produces deeply structured, injectable reasoning artifacts
through mechanical gate enforcement.

**The 3 Layers:**

**Layer 1: INITIAL PLAN**
Thinking: "What is this really?"
Evokes: First principles, surface understanding, constraints, success criteria

**Layer 2: DETAILED WORKFLOW**
Thinking: "How does it decompose?"
Evokes: Components, sequencing, dependencies, failure modes, verification

**Layer 3: CONTEXT LIBRARY**
Thinking: "Can I explain it so another agent can execute it?"
Evokes: Architecture, interfaces, state management, error handling

**COMMANDS:**
- "start" - Begin the planning process
- "status" - Show current state
- "help" - Show this help
- "show plan" - Display latest artifact
- "reset" - Reset to initial state`;
}
function parseCommand(message) {
  const msg = message.toLowerCase().trim();
  if (msg.includes("start") || msg.includes("plan"))
    return { action: "start" };
  if (msg.includes("status"))
    return { action: "status" };
  if (msg.includes("help"))
    return { action: "help" };
  if (msg.includes("show plan"))
    return { action: "show_plan" };
  if (msg.includes("reset"))
    return { action: "reset" };
  if (msg.includes("continue") || msg.includes("next"))
    return { action: "advance" };
  return null;
}
function runStart() {
  state.mode = "planning";
  state.currentLayer = 1;
  state.status = "LAYER_IN_PROGRESS";
  state.artifacts.clear();
  stateMachine.start();
  return `## TRIDENT DEEP PLANNING - LAYER 1

**Layer 1: INITIAL PLAN**

Thinking: "What is this really? What are we trying to solve?"

**Gate Requirements:**
- [ ] Identify 3+ FIRST PRINCIPLES (non-negotiable truths)
- [ ] Surface UNDERSTANDING (what's being asked, in my own words)
- [ ] List 3+ CONSTRAINTS (what must be true)
- [ ] Define 1+ SUCCESS CRITERIA (how do we know we're done)
- [ ] List 2+ OPEN QUESTIONS (what do we not know yet)

**Say "continue" when you've addressed all requirements.**`;
}
function runAdvance() {
  const currentLayer = layers.find((l) => l.number === state.currentLayer);
  if (!currentLayer)
    return "Error: layer not found";
  let content = "";
  switch (state.currentLayer) {
    case 1:
      content = `# LAYER 1: INITIAL PLAN

## First Principles
[Your 3+ non-negotiable truths here]

## Surface Understanding
[What's being asked, in my own words]

## Constraints
[3+ things that must be true]

## Success Criteria
[How we know we're done]

## Open Questions
[2+ things we don't know]`;
      break;
    case 2:
      content = `# LAYER 2: DETAILED WORKFLOW

## Components (5+)
[Break into main components]

## Sequencing
[What must come before what]

## Dependencies
[What relies on what]

## Failure Modes (3+)
[3+ ways this could fail]

## Verification Strategy
[How to verify each component]`;
      break;
    case 3:
      content = `# LAYER 3: CONTEXT LIBRARY

## Architecture
[How it fits together - diagram]

## Interfaces
[What talks to what]

## State Management
[What persists, how]

## Error Handling
[What can go wrong, how handled]

## Self-Contained Summary
[Executable by another agent]`;
      state.status = "COMPLETE";
      stateMachine.completeLayer();
      break;
  }
  state.artifacts.set(`layer${state.currentLayer}`, content);
  if (state.currentLayer < 3) {
    stateMachine.completeLayer();
    state.currentLayer = stateMachine.getState().currentLayer;
    const nextLayer = layers.find((l) => l.number === state.currentLayer);
    return `## LAYER ${state.currentLayer - 1} COMPLETE \u2192 LAYER ${state.currentLayer}

**Layer ${state.currentLayer}: ${nextLayer?.name}**

Thinking: "${nextLayer?.thinking}"

${content}

**Say "continue" when ready.**`;
  }
  return `## COMPLETE

# TRIDENT DEEP PLANNING - FINAL OUTPUT

${Array.from(state.artifacts.values()).join(`

---

`)}

---

*Generated by Trident Deep Planning v1.0*
*${CORE_PRINCIPLE}*`;
}
async function TridentDeepPlanningPlugin() {
  return {
    tool: {
      "trident-plan": {
        description: "Trident Deep Planning - Pure reasoning with 3-layer mechanical gates",
        args: {},
        execute: async (args, context) => {
          const message = args.message || "status";
          const parsed = parseCommand(message);
          if (!parsed) {
            return 'Say "help" for commands or "start" to begin.';
          }
          switch (parsed.action) {
            case "status":
              return getStatus();
            case "help":
              return getHelp();
            case "start":
              return runStart();
            case "show_plan":
              return Array.from(state.artifacts.values()).join(`

`) || "No plan yet.";
            case "reset":
              state.mode = "idle";
              state.currentLayer = 1;
              state.status = "IDLE";
              state.artifacts.clear();
              stateMachine.reset();
              return 'Reset complete. Say "start" to begin.';
            case "advance":
              return runAdvance();
            default:
              return `Unknown action: ${parsed.action}`;
          }
        }
      }
    },
    "tool.execute.before": async (input, output) => {
      const BLOCKED_TOOLS = ["edit", "sed", "write", "write_file", "apply_diff"];
      const isBlocked = BLOCKED_TOOLS.some((t) => input.tool === t);
      if (isBlocked) {
        output.blocked = true;
        output.blockReason = "[Trident] BLOCKED - Deep Planning is documentation-only.";
      }
    },
    "chat.message": async (input, output) => {
      if (input.agent !== "trident-plan")
        return;
      const parsed = parseCommand(input.message);
      if (!parsed) {
        output.content = 'Say "help" for commands or "start" to begin.';
        return;
      }
      switch (parsed.action) {
        case "status":
          output.content = getStatus();
          break;
        case "help":
          output.content = getHelp();
          break;
        case "start":
          output.content = runStart();
          break;
        case "show_plan":
          output.content = Array.from(state.artifacts.values()).join(`

`) || "No plan yet.";
          break;
        case "reset":
          state.mode = "idle";
          state.currentLayer = 1;
          state.status = "IDLE";
          state.artifacts.clear();
          stateMachine.reset();
          output.content = 'Reset complete. Say "start" to begin.';
          break;
        case "advance":
          output.content = runAdvance();
          break;
      }
    }
  };
}
export {
  TridentDeepPlanningPlugin as default
};
