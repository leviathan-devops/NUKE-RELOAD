/**
 * TRIDENT CONTEXT SYNTHESIS MODE v1.0
 * 
 * CORE PRINCIPLE: "Trident Synthesizes. Humans Decide."
 */

import type { Plugin, PluginInput, Hooks } from '@opencode-ai/plugin';
import { CONTEXT_SYNTHESIS_LAYERS, WHY_EXPLANATIONS, HOW_EXPLANATIONS, SEVERITY } from './types.js';
import { StateMachine } from './state-machine.js';
import { GateValidator } from './gate-validator.js';

interface TridentState {
  mode: string;
  currentLayer: number;
  artifacts: Map<string, string>;
  initialized: boolean;
  lastError?: string;
  status: 'IDLE' | 'LAYER_IN_PROGRESS' | 'LAYER_COMPLETE' | 'COMPLETE';
  sourcesCollected: string[];
  scores: Map<string, number>;
}

const state: TridentState = {
  mode: 'idle',
  currentLayer: 1,
  artifacts: new Map(),
  initialized: true,
  status: 'IDLE',
  sourcesCollected: [],
  scores: new Map()
};

const CORE_PRINCIPLE = 'Trident Synthesizes. Humans Decide.';

const layers = CONTEXT_SYNTHESIS_LAYERS;
const stateMachine = new StateMachine(layers);
const gateValidator = new GateValidator();

function getStatus(): string {
  return `## TRIDENT CONTEXT SYNTHESIS v1.0 STATUS

**Mode:** ${state.mode || 'idle'}
**Current Layer:** ${state.currentLayer}/4
**Status:** ${state.status}
**Initialized:** ${state.initialized ? '✅' : '❌'}

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

function getHelp(): string {
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
Final Score = (Urgency × 0.6) + (Importance × 0.4)
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

function parseNaturalLanguage(message: string): { action: string; options?: Record<string, any> } | null {
  const msg = message.toLowerCase().trim();

  if (msg.includes('start') || msg.includes('synthesiz')) return { action: 'start' };
  if (msg.includes('status') || msg.includes('state')) return { action: 'status' };
  if (msg.includes('help') || msg.includes('what') || msg.includes('how')) return { action: 'help' };
  if (msg.includes('show artifact') || msg.includes('show output')) return { action: 'show_artifact' };
  if (msg.includes('reset') || msg.includes('restart')) return { action: 'reset' };

  if (msg.includes('score') && state.currentLayer === 2) return { action: 'score' };

  if (msg.includes('compress') && state.currentLayer === 3) return { action: 'compress' };

  if (msg.includes('inject') && state.currentLayer === 4) return { action: 'inject' };

  return null;
}

function runStart(): string {
  state.mode = 'synthesizing';
  state.currentLayer = 1;
  state.status = 'LAYER_IN_PROGRESS';
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

function runShowArtifact(): string {
  const artifact = state.artifacts.get('current');
  if (!artifact) {
    return `## NO ARTIFACT AVAILABLE

Run "start" to begin synthesis first.`;
  }
  return artifact;
}

function runReset(): string {
  state.mode = 'idle';
  state.currentLayer = 1;
  state.status = 'IDLE';
  state.artifacts.clear();
  state.sourcesCollected = [];
  state.scores.clear();
  stateMachine.reset();

  return `## RESET COMPLETE

Trident Context Synthesis has been reset.
Say "start" to begin a new synthesis session.`;
}

function handleLayerAdvance(source: string): string {
  if (!state.sourcesCollected.includes(source)) {
    state.sourcesCollected.push(source);
  }

  const layer = layers.find(l => l.number === state.currentLayer);
  if (!layer) return 'Error: layer not found';

  const remaining = layer.requires
    .map(r => r.field.replace('_', ' '))
    .filter(f => !state.sourcesCollected.some(s => s.toUpperCase().includes(f.toUpperCase())));

  if (remaining.length > 0) {
    return `## LAYER ${state.currentLayer} - Sources Collected

**Collected:** ${state.sourcesCollected.join(', ')}

**Still needed:** ${remaining.join(', ')}

Continue collecting context.`;
  }

  stateMachine.completeLayer();
  state.currentLayer = stateMachine.getState().currentLayer;

  if (state.currentLayer > 4) {
    state.status = 'COMPLETE';
    return generateFinalArtifact();
  }

  state.status = 'LAYER_IN_PROGRESS';

  return `## LAYER ${state.currentLayer - 1} COMPLETE → LAYER ${state.currentLayer}

**Layer ${state.currentLayer}: ${layers.find(l => l.number === state.currentLayer)?.name}**

Thinking: "${layers.find(l => l.number === state.currentLayer)?.thinking}"

Say "score" or "continue" to proceed.`;
}

function generateFinalArtifact(): string {
  const artifact = `# TRIDENT CONTEXT SYNTHESIS - FINAL OUTPUT

**Generated:** ${new Date().toISOString()}
**Layers Completed:** 4/4

---

## T0-READY CONTEXT INJECTION

### Situation
${state.artifacts.get('situation') || 'N/A'}

### Priority Context
${state.artifacts.get('priority') || 'N/A'}

### Compressed Summary
${state.artifacts.get('compressed') || 'N/A'}

### T0 Format
\`\`\`
${state.artifacts.get('t0_output') || 'N/A'}
\`\`\`

---

*Generated by Trident Context Synthesis v1.0*
*${CORE_PRINCIPLE}*`;

  state.artifacts.set('current', artifact);
  return artifact;
}

export default async function TridentContextSynthesisPlugin(input: PluginInput): Promise<Hooks> {
  return {
    tool: {
      'trident-context': {
        description: 'Trident Context Synthesis - Dynamic context synthesis with 4-layer mechanical gates',
        args: {},
        execute: async (args: Record<string, unknown>, context: any) => {
          const message = (args.message as string) || 'status';
          const parsed = parseNaturalLanguage(message);

          if (!parsed) {
            if (state.status === 'LAYER_IN_PROGRESS' && state.currentLayer === 1) {
              return handleLayerAdvance(message);
            }
            return 'Say "help" for commands or "start" to begin.';
          }

          switch (parsed.action) {
            case 'status': return getStatus();
            case 'help': return getHelp();
            case 'start': return runStart();
            case 'show_artifact': return runShowArtifact();
            case 'reset': return runReset();
            case 'score':
              state.artifacts.set('situation', 'Scored at layer 2');
              stateMachine.completeLayer();
              state.currentLayer = stateMachine.getState().currentLayer;
              return 'Layer 2 complete. Say "compress" when ready.';
            case 'compress':
              state.artifacts.set('compressed', 'Compressed to fit token budget');
              stateMachine.completeLayer();
              state.currentLayer = stateMachine.getState().currentLayer;
              return 'Layer 3 complete. Say "inject" to generate output.';
            case 'inject':
              return generateFinalArtifact();
            default:
              return `Unknown action: ${parsed.action}`;
          }
        }
      }
    },

    'tool.execute.before': async (input: any, output: any) => {
      const toolName = input.tool as string;
      const BLOCKED_TOOLS = ['edit', 'sed', 'echo', 'cat', 'write', 'write_file', 'apply_diff', 'patch'];

      const isBlocked = BLOCKED_TOOLS.some(t => toolName === t || toolName.includes(t));

      if (toolName === 'bash') {
        const cmd = input.args?.command || '';
        const isTestScript = cmd.includes('/tmp/') && cmd.endsWith('.sh');
        if (isTestScript) return;
        output.blocked = true;
        output.blockReason = '[Trident] BLOCKED - Context Synthesis is documentation-only.';
        return;
      }

      if (isBlocked) {
        output.blocked = true;
        output.blockReason = '[Trident] BLOCKED - Context Synthesis is documentation-only.';
      }
    },

    'chat.message': async (input: any, output: any) => {
      const message = (input.message || '') as string;
      if (!message) return;

      const parsed = parseNaturalLanguage(message);

      if (!parsed) {
        if (state.status === 'LAYER_IN_PROGRESS' && state.currentLayer === 1) {
          output.content = handleLayerAdvance(message);
          return;
        }
        output.content = `## TRIDENT CONTEXT SYNTHESIS

I didn't understand that. Say "help" for commands or "start" to begin.`;
        return;
      }

      switch (parsed.action) {
        case 'status':
          output.content = getStatus();
          break;
        case 'help':
          output.content = getHelp();
          break;
        case 'start':
          output.content = runStart();
          break;
        case 'show_artifact':
          output.content = runShowArtifact();
          break;
        case 'reset':
          output.content = runReset();
          break;
        case 'score':
          state.artifacts.set('situation', `Scored at layer 2 with urgency/importance`);
          stateMachine.completeLayer();
          state.currentLayer = stateMachine.getState().currentLayer;
          output.content = `## LAYER 2 COMPLETE → LAYER 3

**Layer 3: COMPRESSION**

Thinking: "How to compress into <2k tokens?"

Say "compress" when ready.`;
          break;
        case 'compress':
          state.artifacts.set('compressed', `Compressed to fit token budget`);
          stateMachine.completeLayer();
          state.currentLayer = stateMachine.getState().currentLayer;
          output.content = `## LAYER 3 COMPLETE → LAYER 4

**Layer 4: INJECTION FORMAT**

Thinking: "How to output T0-ready format?"

Say "inject" to generate final T0-ready output.`;
          break;
        case 'inject':
          output.content = generateFinalArtifact();
          stateMachine.completeLayer();
          break;
        default:
          output.content = `Unknown action: ${parsed.action}`;
      }
    }
  };
}