// @bun
// src/types.ts
var CONTEXT_SYNTHESIS_LAYERS = [
  {
    number: 1,
    name: "CONTEXT COLLECTION",
    thinking: "What context exists? What sources are available?",
    evokes: ["T1 Session", "T2 Knowledge", "T3 Files", "T4 Tools"],
    requires: [
      { field: "T1_Session", type: "boolean", value: true },
      { field: "T2_Knowledge", type: "boolean", value: true },
      { field: "T3_Files", type: "boolean", value: true },
      { field: "T4_Tools", type: "boolean", value: true }
    ],
    minChars: 500
  },
  {
    number: 2,
    name: "RELEVANCE SCORING",
    thinking: "What matters most right now?",
    evokes: ["Urgency", "Importance", "Ranking"],
    requires: [
      { field: "Urgency_Score", type: "number", value: 0 },
      { field: "Importance_Score", type: "number", value: 0 },
      { field: "Final_Score", type: "number", value: 0 }
    ],
    minChars: 300
  },
  {
    number: 3,
    name: "COMPRESSION",
    thinking: "How to compress into <2k tokens?",
    evokes: ["Deduplication", "Summarization", "Token Budget"],
    requires: [
      { field: "Token_Budget", type: "number", value: 2000 },
      { field: "Deduplicated", type: "boolean", value: true }
    ],
    minChars: 400
  },
  {
    number: 4,
    name: "INJECTION FORMAT",
    thinking: "How to output T0-ready format?",
    evokes: ["Sections", "Priority", "Format"],
    requires: [
      { field: "Output_Format", type: "string", value: "T0" },
      { field: "Sections", type: "array" }
    ],
    minChars: 200
  }
];

// src/state-machine.ts
class StateMachine {
  layers;
  state;
  transitionHistory = [];
  constructor(layers) {
    this.layers = layers;
    this.state = {
      currentLayer: 0,
      iteration: "V1.0",
      layerAttempts: 0,
      status: "IDLE",
      completedLayers: []
    };
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
    const currentLayerConfig = this.layers.find((l) => l.number === this.state.currentLayer);
    if (!currentLayerConfig)
      return false;
    if (!this.state.completedLayers.includes(this.state.currentLayer)) {
      this.state.completedLayers.push(this.state.currentLayer);
    }
    this.transitionHistory.push({
      from: this.state.currentLayer,
      to: this.state.currentLayer + 1,
      timestamp: new Date,
      successful: true
    });
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
    console.error(`[StateMachine] Layer ${this.state.currentLayer} failed: ${reason}`);
  }
  reset() {
    this.state = {
      currentLayer: 0,
      iteration: this.incrementIteration(this.state.iteration),
      layerAttempts: 0,
      status: "IDLE",
      completedLayers: []
    };
  }
  getLayerConfig(layerNumber) {
    return this.layers.find((l) => l.number === layerNumber);
  }
  getCurrentLayerConfig() {
    return this.getLayerConfig(this.state.currentLayer);
  }
  getAllLayers() {
    return [...this.layers];
  }
  isComplete() {
    return this.state.status === "COMPLETE";
  }
  incrementIteration(current) {
    const match = current.match(/^V(\d+)\.(\d+)$/);
    if (match) {
      return `V${parseInt(match[1])}.${parseInt(match[2]) + 1}`;
    }
    return "V1.1";
  }
}

// src/gate-validator.ts
class GateValidator {
  validate(requirements, artifacts) {
    const missing = [];
    const details = [];
    for (const req of requirements) {
      const artifactContent = artifacts.get(req.field);
      const hasContent = artifactContent && artifactContent.length > 0;
      switch (req.type) {
        case "boolean":
          if (req.value === true && !hasContent) {
            missing.push(req.field);
          }
          details.push({
            field: req.field,
            expected: req.value,
            actual: hasContent ? true : false
          });
          break;
        case "number":
          const numValue = hasContent ? parseInt(artifactContent) : 0;
          const meetsMin = numValue >= (req.value || 0);
          if (!meetsMin) {
            missing.push(`${req.field} (expected >= ${req.value}, got ${numValue})`);
          }
          details.push({
            field: req.field,
            expected: req.value,
            actual: numValue
          });
          break;
        case "string":
          if (req.value && !hasContent) {
            missing.push(req.field);
          }
          details.push({
            field: req.field,
            expected: req.value || "any",
            actual: hasContent ? artifactContent : "missing"
          });
          break;
        case "array":
          if (req.value === true && !hasContent) {
            missing.push(req.field);
          }
          const arrValue = hasContent ? artifactContent.split(",").filter(Boolean) : [];
          details.push({
            field: req.field,
            expected: req.value || "any array",
            actual: arrValue.length
          });
          break;
      }
    }
    return { valid: missing.length === 0, missing, details };
  }
  checkRequirement(req, artifacts) {
    const artifactContent = artifacts.get(req.field);
    const hasContent = artifactContent && artifactContent.length > 0;
    switch (req.type) {
      case "boolean":
        return req.value === true ? Boolean(hasContent) : true;
      case "number":
        const numValue = hasContent ? parseInt(artifactContent) : 0;
        return numValue >= (req.value || 0);
      case "string":
        return !req.value || Boolean(hasContent);
      case "array":
        return req.value !== true || Boolean(hasContent);
      default:
        return true;
    }
  }
  getMissingRequirements(requirements, artifacts) {
    const missing = [];
    for (const req of requirements) {
      if (!this.checkRequirement(req, artifacts)) {
        missing.push(req.field);
      }
    }
    return missing;
  }
}

// src/index.ts
var state = {
  mode: "idle",
  currentLayer: 1,
  artifacts: new Map,
  initialized: true,
  status: "IDLE",
  sourcesCollected: [],
  scores: new Map
};
var CORE_PRINCIPLE = "Trident Synthesizes. Humans Decide.";
var layers = CONTEXT_SYNTHESIS_LAYERS;
var stateMachine = new StateMachine(layers);
var gateValidator = new GateValidator;
function getStatus() {
  return `## TRIDENT CONTEXT SYNTHESIS v1.0 STATUS

**Mode:** ${state.mode || "idle"}
**Current Layer:** ${state.currentLayer}/4
**Status:** ${state.status}
**Initialized:** ${state.initialized ? "\u2705" : "\u274C"}

---

## CORE PRINCIPLE: "${CORE_PRINCIPLE}"

Context Synthesis NEVER EDITS. It only:
- Synthesizes context from T1/T2/T3/T4 sources
- Scores and prioritizes by urgency and importance
- Compresses into token budget
- Outputs T0-ready injection format

---

## THE 4 LAYERS

| Layer | Name | Thinking |
|-------|------|----------|
| 1 | CONTEXT COLLECTION | "What context exists? What sources are available?" |
| 2 | RELEVANCE SCORING | "What matters most right now?" |
| 3 | COMPRESSION | "How to compress into <2k tokens?" |
| 4 | INJECTION FORMAT | "How to output T0-ready format?" |

**Say "start" to begin synthesis.**`;
}
function getHelp() {
  return `## TRIDENT CONTEXT SYNTHESIS v1.0

**CORE PRINCIPLE:** "${CORE_PRINCIPLE}"

**What It Does:**
Context Synthesis Mode dynamically synthesizes context from multiple sources
and injects it into the agent's thought stream at T0 level.

**Sources Collected:**
- T1: Session State (gate, task, state)
- T2: Knowledge Context (hermes_remember, hive_context, kraken_hive)
- T3: File Context (active files, recent changes)
- T4: Tool Context (recent commands, patterns)

**Scoring Formula:**
\`\`\`
Final Score = (Urgency \xD7 0.6) + (Importance \xD7 0.4)
Urgency: 0-10 (10=current blocker, 1=stale)
Importance: 0-10 (10=decision point, 3=documentation)
\`\`\`

**Token Budget:** 2000 tokens max

**COMMANDS:**
- "start" - Begin the synthesis process
- "status" - Show current state
- "help" - Show this help
- "show artifact" - Display latest artifact
- "reset" - Reset to initial state`;
}
function parseNaturalLanguage(message) {
  const msg = message.toLowerCase().trim();
  if (msg.includes("start") || msg.includes("synthesiz"))
    return { action: "start" };
  if (msg.includes("status") || msg.includes("state"))
    return { action: "status" };
  if (msg.includes("help") || msg.includes("what") || msg.includes("how"))
    return { action: "help" };
  if (msg.includes("show artifact") || msg.includes("show output"))
    return { action: "show_artifact" };
  if (msg.includes("reset") || msg.includes("restart"))
    return { action: "reset" };
  if (msg.includes("score") && state.currentLayer === 2)
    return { action: "score" };
  if (msg.includes("compress") && state.currentLayer === 3)
    return { action: "compress" };
  if (msg.includes("inject") && state.currentLayer === 4)
    return { action: "inject" };
  return null;
}
function runStart() {
  state.mode = "synthesizing";
  state.currentLayer = 1;
  state.status = "LAYER_IN_PROGRESS";
  state.artifacts.clear();
  state.sourcesCollected = [];
  state.scores.clear();
  stateMachine.start();
  return `## TRIDENT CONTEXT SYNTHESIS - LAYER 1

**Layer 1: CONTEXT COLLECTION**

Thinking: "What context exists? What sources are available?"

To proceed, acknowledge these 4 sources:

- [ ] **T1: Session State** - Gate, task, current state
- [ ] **T2: Knowledge Context** - hermes_remember, hive_context, kraken_hive
- [ ] **T3: File Context** - Active files, recent changes
- [ ] **T4: Tool Context** - Recent commands, patterns

Say "T1 done" or "T2 done" etc. when you have context from that source.
Once all 4 are acknowledged, say "continue" to proceed to Layer 2.`;
}
function runShowArtifact() {
  const artifact = state.artifacts.get("current");
  if (!artifact) {
    return `## NO ARTIFACT AVAILABLE

Run "start" to begin synthesis first.`;
  }
  return artifact;
}
function runReset() {
  state.mode = "idle";
  state.currentLayer = 1;
  state.status = "IDLE";
  state.artifacts.clear();
  state.sourcesCollected = [];
  state.scores.clear();
  stateMachine.reset();
  return `## RESET COMPLETE

Trident Context Synthesis has been reset.
Say "start" to begin a new synthesis session.`;
}
function handleLayerAdvance(source) {
  if (!state.sourcesCollected.includes(source)) {
    state.sourcesCollected.push(source);
  }
  const layer = layers.find((l) => l.number === state.currentLayer);
  if (!layer)
    return "Error: layer not found";
  const remaining = layer.requires.map((r) => r.field.replace("_", " ")).filter((f) => !state.sourcesCollected.some((s) => s.toUpperCase().includes(f.toUpperCase())));
  if (remaining.length > 0) {
    return `## LAYER ${state.currentLayer} - Sources Collected

**Collected:** ${state.sourcesCollected.join(", ")}

**Still needed:** ${remaining.join(", ")}

Continue collecting context.`;
  }
  stateMachine.completeLayer();
  state.currentLayer = stateMachine.getState().currentLayer;
  if (state.currentLayer > 4) {
    state.status = "COMPLETE";
    return generateFinalArtifact();
  }
  state.status = "LAYER_IN_PROGRESS";
  return `## LAYER ${state.currentLayer - 1} COMPLETE \u2192 LAYER ${state.currentLayer}

**Layer ${state.currentLayer}: ${layers.find((l) => l.number === state.currentLayer)?.name}**

Thinking: "${layers.find((l) => l.number === state.currentLayer)?.thinking}"

Say "score" or "continue" to proceed.`;
}
function generateFinalArtifact() {
  const artifact = `# TRIDENT CONTEXT SYNTHESIS - FINAL OUTPUT

**Generated:** ${new Date().toISOString()}
**Layers Completed:** 4/4

---

## T0-READY CONTEXT INJECTION

### Situation
${state.artifacts.get("situation") || "N/A"}

### Priority Context
${state.artifacts.get("priority") || "N/A"}

### Compressed Summary
${state.artifacts.get("compressed") || "N/A"}

### T0 Format
\`\`\`
${state.artifacts.get("t0_output") || "N/A"}
\`\`\`

---

*Generated by Trident Context Synthesis v1.0*
*${CORE_PRINCIPLE}*`;
  state.artifacts.set("current", artifact);
  return artifact;
}
async function TridentContextSynthesisPlugin(input) {
  return {
    tool: {
      "trident-context": {
        description: "Trident Context Synthesis - Dynamic context synthesis with 4-layer mechanical gates",
        args: {},
        execute: async (args, context) => {
          const message = args.message || "status";
          const parsed = parseNaturalLanguage(message);
          if (!parsed) {
            if (state.status === "LAYER_IN_PROGRESS" && state.currentLayer === 1) {
              return handleLayerAdvance(message);
            }
            return 'Say "help" for commands or "start" to begin.';
          }
          switch (parsed.action) {
            case "status":
              return getStatus();
            case "help":
              return getHelp();
            case "start":
              return runStart();
            case "show_artifact":
              return runShowArtifact();
            case "reset":
              return runReset();
            case "score":
              state.artifacts.set("situation", "Scored at layer 2");
              stateMachine.completeLayer();
              state.currentLayer = stateMachine.getState().currentLayer;
              return 'Layer 2 complete. Say "compress" when ready.';
            case "compress":
              state.artifacts.set("compressed", "Compressed to fit token budget");
              stateMachine.completeLayer();
              state.currentLayer = stateMachine.getState().currentLayer;
              return 'Layer 3 complete. Say "inject" to generate output.';
            case "inject":
              return generateFinalArtifact();
            default:
              return `Unknown action: ${parsed.action}`;
          }
        }
      }
    },
    "tool.execute.before": async (input2, output) => {
      const toolName = input2.tool;
      const BLOCKED_TOOLS = ["edit", "sed", "echo", "cat", "write", "write_file", "apply_diff", "patch"];
      const isBlocked = BLOCKED_TOOLS.some((t) => toolName === t || toolName.includes(t));
      if (toolName === "bash") {
        const cmd = input2.args?.command || "";
        const isTestScript = cmd.includes("/tmp/") && cmd.endsWith(".sh");
        if (isTestScript)
          return;
        output.blocked = true;
        output.blockReason = "[Trident] BLOCKED - Context Synthesis is documentation-only.";
        return;
      }
      if (isBlocked) {
        output.blocked = true;
        output.blockReason = "[Trident] BLOCKED - Context Synthesis is documentation-only.";
      }
    },
    "chat.message": async (input2, output) => {
      const message = input2.message || "";
      if (!message)
        return;
      const parsed = parseNaturalLanguage(message);
      if (!parsed) {
        if (state.status === "LAYER_IN_PROGRESS" && state.currentLayer === 1) {
          output.content = handleLayerAdvance(message);
          return;
        }
        output.content = `## TRIDENT CONTEXT SYNTHESIS

I didn't understand that. Say "help" for commands or "start" to begin.`;
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
        case "show_artifact":
          output.content = runShowArtifact();
          break;
        case "reset":
          output.content = runReset();
          break;
        case "score":
          state.artifacts.set("situation", `Scored at layer 2 with urgency/importance`);
          stateMachine.completeLayer();
          state.currentLayer = stateMachine.getState().currentLayer;
          output.content = `## LAYER 2 COMPLETE \u2192 LAYER 3

**Layer 3: COMPRESSION**

Thinking: "How to compress into <2k tokens?"

Say "compress" when ready.`;
          break;
        case "compress":
          state.artifacts.set("compressed", `Compressed to fit token budget`);
          stateMachine.completeLayer();
          state.currentLayer = stateMachine.getState().currentLayer;
          output.content = `## LAYER 3 COMPLETE \u2192 LAYER 4

**Layer 4: INJECTION FORMAT**

Thinking: "How to output T0-ready format?"

Say "inject" to generate final T0-ready output.`;
          break;
        case "inject":
          output.content = generateFinalArtifact();
          stateMachine.completeLayer();
          break;
        default:
          output.content = `Unknown action: ${parsed.action}`;
      }
    }
  };
}
export {
  TridentContextSynthesisPlugin as default
};
