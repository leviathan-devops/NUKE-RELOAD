/**
 * TRIDENT MULTI-MODE FRAMEWORK
 * 
 * Main entry point - exports all framework components.
 */

export { BaseTridentPlugin, type BasePluginConfig } from './base-plugin.js';
export { StateMachine, type TridentState, type LayerTransition } from './state-machine.js';
export { GateValidator, type ValidationResult } from './gate-validator.js';
export { ArtifactGenerator, type ArtifactConfig } from './artifact-generator.js';
export * from './types.js';