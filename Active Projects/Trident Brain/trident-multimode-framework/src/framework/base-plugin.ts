/**
 * TRIDENT MULTI-MODE — BASE PLUGIN CLASS
 * 
 * Provides the base functionality for all Trident plugins.
 * Each plugin extends this class with mode-specific layer logic.
 */

import type { Plugin, PluginInput, Hooks } from '@opencode-ai/plugin';
import { StateMachine, type TridentState, type LayerTransition } from './state-machine.js';
import { GateValidator, type GateRequirement } from './gate-validator.js';
import { ArtifactGenerator, type ArtifactConfig } from './artifact-generator.js';
import type { LayerConfig, Severity } from './types.js';

export interface BasePluginConfig {
  name: string;
  version: string;
  mode: string;
  layers: LayerConfig[];
  corePrinciple: string;
}

export abstract class BaseTridentPlugin {
  protected name: string;
  protected version: string;
  protected mode: string;
  protected layers: LayerConfig[];
  protected corePrinciple: string;
  protected stateMachine: StateMachine;
  protected gateValidator: GateValidator;
  protected artifactGenerator: ArtifactGenerator;
  protected initialized: boolean = false;

  constructor(config: BasePluginConfig) {
    this.name = config.name;
    this.version = config.version;
    this.mode = config.mode;
    this.layers = config.layers;
    this.corePrinciple = config.corePrinciple;

    this.stateMachine = new StateMachine(config.layers);
    this.gateValidator = new GateValidator();
    this.artifactGenerator = new ArtifactGenerator();
  }

  /**
   * Get the OpenCode plugin hooks
   */
  abstract getHooks(): Hooks;

  /**
   * Get current status of the plugin
   */
  getStatus(): string {
    const state = this.stateMachine.getState();
    const currentLayer = this.layers.find(l => l.number === state.currentLayer);

    return `## ${this.name} v${this.version} STATUS

**Mode:** ${this.mode}
**Current Layer:** ${currentLayer?.name || 'N/A'} (${state.currentLayer}/${this.layers.length})
**State:** ${state.status}
**Initialized:** ${this.initialized ? '✅' : '❌'}

---

## CORE PRINCIPLE: "${this.corePrinciple}"

${this.mode} NEVER EDITS CODE. It only:
- Generates structured reasoning artifacts
- Enforces mechanical gate transitions
- Documents findings for human review

---

**Layers:**
${this.layers.map(l => `- Layer ${l.number}: ${l.name}`).join('\n')}

**Say "help" or "status" for more information.**`;
  }

  /**
   * Get help text
   */
  getHelp(): string {
    return `## ${this.name} v${this.version}

**Mode:** ${this.mode}

**CORE PRINCIPLE:** "${this.corePrinciple}"

This plugin enforces structured reasoning through mechanical gates.

**Commands:**
- "start" - Begin the ${this.mode} process
- "status" - Show current state
- "help" - Show this help
- "show artifact" - Display latest artifact
- "reset" - Reset to initial state

**Gate Enforcement:**
${this.layers.map(l => `- Layer ${l.number} (${l.name}): ${l.thinking}`).join('\n')}

**Anti-Derailment:**
- THEATRICAL CODE IS BANNED - claims without proof are blocked
- No mocking/stubbing - real evidence required
- No model switching - solve with current model
- No scope creep - stay on current task

**Report Format:**
Artifacts are named semantically and contain WHY/HOW structure.`;
  }

  /**
   * Attempt to advance to next layer
   */
  canAdvanceLayer(artifacts: Map<string, string>): { canAdvance: boolean; reason?: string } {
    const state = this.stateMachine.getState();
    const currentLayer = this.layers.find(l => l.number === state.currentLayer);

    if (!currentLayer) {
      return { canAdvance: false, reason: 'No current layer found' };
    }

    if (currentLayer.number >= this.layers.length) {
      return { canAdvance: false, reason: 'Already at final layer' };
    }

    const nextLayer = this.layers.find(l => l.number === currentLayer.number + 1);
    if (!nextLayer) {
      return { canAdvance: false, reason: 'No next layer found' };
    }

    const validation = this.gateValidator.validate(nextLayer.requires, artifacts);

    if (!validation.valid) {
      return { canAdvance: false, reason: `Gate requirements not met: ${validation.missing.join(', ')}` };
    }

    return { canAdvance: true };
  }

  /**
   * Reset the state machine
   */
  reset(): void {
    this.stateMachine.reset();
    this.artifactGenerator.clear();
  }

  /**
   * Get the state machine for external access
   */
  getStateMachine(): StateMachine {
    return this.stateMachine;
  }

  /**
   * Get the artifact generator for external access
   */
  getArtifactGenerator(): ArtifactGenerator {
    return this.artifactGenerator;
  }
}