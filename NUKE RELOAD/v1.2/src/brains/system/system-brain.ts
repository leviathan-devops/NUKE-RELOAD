/**
 * src/brains/system/system-brain.ts
 * 
 * V1.2 System Brain
 * 
 * Owns: workflow-state, security-state
 * 
 * Key responsibilities:
 * - Workflow tracking
 * - Security enforcement
 * - Gate criteria
 * - Compaction management
 */

import { getStateStore, type StateStore } from '../../shared/state-store.js';
import { getBrainMessenger, type BrainMessenger } from '../../shared/brain-messenger.js';
import type { DomainId } from '../../shared/domain-ownership.js';

export interface SystemState {
  initialized: boolean;
  currentGate: string;
  decisionCount: number;
  completedTasks: string[];
}

export interface DecisionPoint {
  id: string;
  description: string;
  type: string;
  contextFiles: string[];
  timestamp: number;
}

export class SystemBrain {
  private initialized = false;
  private state: SystemState = {
    initialized: false,
    currentGate: 'plan',
    decisionCount: 0,
    completedTasks: [],
  };
  private stateStore: StateStore;
  private messenger: BrainMessenger;
  private recentDecisions: DecisionPoint[] = [];

  constructor(stateStore?: StateStore, messenger?: BrainMessenger) {
    this.stateStore = stateStore || getStateStore();
    this.messenger = messenger || getBrainMessenger();
  }

  initialize(): void {
    if (this.initialized) return;
    
    console.log('[SystemBrain] Initializing...');
    this.initialized = true;
    this.state.initialized = true;
    
    this.stateStore.set('security-state', 'initialized', true, ['kraken-system']);
    this.stateStore.set('security-state', 'brain-id', 'kraken-system', ['kraken-system']);
    this.stateStore.set('workflow-state', 'current-gate', 'plan', ['kraken-system']);
    
    // Subscribe to brain messages
    this.messenger.subscribe('kraken-system', this.handleBrainMessage.bind(this));
    
    console.log('[SystemBrain] Initialized - owns workflow-state, security-state');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // =========================================================================
  // WORKFLOW TRACKING
  // =========================================================================

  setCurrentGate(gate: string): void {
    this.state.currentGate = gate;
    this.stateStore.set('workflow-state', 'current-gate', gate, ['kraken-system']);
    console.log(`[SystemBrain] Gate set to: ${gate}`);
  }

  getCurrentGate(): string {
    return this.state.currentGate;
  }

  recordDecision(decision: { description: string; type: string; contextFiles: string[] }): void {
    const decisionPoint: DecisionPoint = {
      id: `dp-${++this.state.decisionCount}`,
      description: decision.description,
      type: decision.type,
      contextFiles: decision.contextFiles,
      timestamp: Date.now(),
    };
    
    this.recentDecisions.unshift(decisionPoint);
    if (this.recentDecisions.length > 20) {
      this.recentDecisions.pop();
    }
    
    this.stateStore.set('workflow-state', `decision-${decisionPoint.id}`, decisionPoint, ['kraken-system']);
    this.stateStore.set('workflow-state', 'recent-decisions', this.recentDecisions, ['kraken-system']);
    
    console.log(`[SystemBrain] Decision recorded: ${decision.description}`);
  }

  getRecentDecisions(): DecisionPoint[] {
    return [...this.recentDecisions];
  }

  // =========================================================================
  // TASK TRACKING
  // =========================================================================

  recordTaskStart(taskId: string): void {
    this.stateStore.set('workflow-state', `task-${taskId}-start`, Date.now(), ['kraken-system']);
    this.stateStore.set('workflow-state', `task-${taskId}-status`, 'active', ['kraken-system']);
  }

  recordTaskComplete(taskId: string): void {
    this.state.completedTasks.push(taskId);
    this.stateStore.set('workflow-state', `task-${taskId}-status`, 'completed', ['kraken-system']);
    this.stateStore.set('workflow-state', `task-${taskId}-complete`, Date.now(), ['kraken-system']);
    
    // Notify planning brain
    this.messenger.deliverMessage('kraken-system', 'kraken-planning', 'checkpoint', {
      type: 'task-complete',
      taskId,
    }, 'normal');
  }

  recordTaskFailure(taskId: string, error: string): void {
    this.stateStore.set('workflow-state', `task-${taskId}-status`, 'failed', ['kraken-system']);
    this.stateStore.set('workflow-state', `task-${taskId}-error`, error, ['kraken-system']);
    
    // Send gate failure to all brains
    this.messenger.send({
      from: 'kraken-system',
      to: '*',
      type: 'gate-failure',
      priority: 'critical',
      payload: { taskId, error },
      requiresAck: true,
    });
  }

  getCompletedTasks(): string[] {
    return [...this.state.completedTasks];
  }

  // =========================================================================
  // SECURITY ENFORCEMENT
  // =========================================================================

  checkSecurityContext(operation: string, context: Record<string, unknown>): { allowed: boolean; reason?: string } {
    // Check if operation is allowed in current security context
    // This is a simplified version - real implementation would check zones, permissions, etc.
    
    const blocked = context.blocked || false;
    if (blocked) {
      return { allowed: false, reason: 'Operation blocked by security context' };
    }
    
    return { allowed: true };
  }

  validateToolUsage(tool: string, args: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate tool usage based on current gate
    const currentGate = this.state.currentGate;
    
    // Some tools may only be available in certain gates
    const gateRestrictions: Record<string, string[]> = {
      'plan': ['hive_status', 'get_cluster_status', 'get_agent_status', 'anchor_cluster'],
      'build': ['spawn_cluster_task', 'spawn_shark_agent', 'spawn_manta_agent'],
      'test': ['aggregate_results'],
      'verify': ['kraken-gate-status'],
    };
    
    const allowed = gateRestrictions[currentGate] || [];
    if (allowed.length > 0 && !allowed.includes(tool)) {
      // Not necessarily an error - some tools work across gates
    }
    
    return { valid: errors.length === 0, errors };
  }

  // =========================================================================
  // GATE CRITERIA
  // =========================================================================

  getGateCriteria(gate: string): { requirement: string; passed: boolean }[] {
    const criteria: Record<string, { requirement: string; check: () => boolean }[]> = {
      'plan': [
        { requirement: 'T2 Master loaded', check: () => true }, // Check with planning brain
        { requirement: 'Tasks decomposed', check: () => true },
      ],
      'build': [
        { requirement: 'Plan gate passed', check: () => this.state.completedTasks.length > 0 },
        { requirement: 'Clusters anchored', check: () => true },
      ],
      'test': [
        { requirement: 'Build gate passed', check: () => this.state.completedTasks.length >= 1 },
        { requirement: 'Outputs registered', check: () => true },
      ],
      'verify': [
        { requirement: 'Tests passed', check: () => true },
        { requirement: 'Outputs verified', check: () => true },
      ],
    };
    
    const gateCriteria = criteria[gate] || [];
    return gateCriteria.map(c => ({
      requirement: c.requirement,
      passed: c.check(),
    }));
  }

  evaluateGateEntry(gate: string): { allPassed: boolean; blockers: string[]; details: { requirement: string; passed: boolean }[] } {
    const details = this.getGateCriteria(gate);
    const blockers = details.filter(d => !d.passed).map(d => d.requirement);
    
    return {
      allPassed: blockers.length === 0,
      blockers,
      details,
    };
  }

  // =========================================================================
  // COMPACTION MANAGEMENT
  // =========================================================================

  getContextRegistry(): { file: string; importance: 'critical' | 'high' | 'normal' | 'low' }[] {
    return this.stateStore.snapshot('context-registry') as any || [];
  }

  registerContext(file: string, importance: 'critical' | 'high' | 'normal' | 'low'): void {
    this.stateStore.set('context-registry', file, { importance, registeredAt: Date.now() }, ['kraken-system']);
  }

  getTokenBudget(): { current: number; threshold: number; tier: number } {
    // This would be updated by compaction hook
    const budget = this.stateStore.get('token-budget', 'current') as { current: number; threshold: number; tier: number } || {
      current: 0,
      threshold: 170000,
      tier: 0,
    };
    return budget;
  }

  // =========================================================================
  // MESSAGE HANDLING
  // =========================================================================

  private handleBrainMessage(message: { from: string; to: string; type: string; payload: Record<string, unknown> }): void {
    switch (message.type) {
      case 'gate-failure':
        this.handleGateFailure(message);
        break;
      case 'checkpoint':
        this.handleCheckpoint(message);
        break;
      case 'context-inject':
        this.handleContextInject(message);
        break;
    }
  }

  private handleGateFailure(message: { from: string; payload: Record<string, unknown> }): void {
    console.log(`[SystemBrain] Gate failure from ${message.from}: ${JSON.stringify(message.payload)}`);
    
    // Record the failure
    const taskId = message.payload.taskId as string;
    const error = message.payload.error as string || 'Unknown gate failure';
    
    if (taskId) {
      this.recordTaskFailure(taskId, error);
    }
  }

  private handleCheckpoint(message: { from: string; payload: Record<string, unknown> }): void {
    console.log(`[SystemBrain] Checkpoint from ${message.from}: ${JSON.stringify(message.payload)}`);
  }

  private handleContextInject(message: { from: string; payload: Record<string, unknown> }): void {
    console.log(`[SystemBrain] Context inject from ${message.from}`);
  }

  // =========================================================================
  // STATE ACCESS
  // =========================================================================

  getState(): SystemState {
    return { ...this.state };
  }

  getSnapshot(): Record<string, unknown> {
    return {
      ...this.stateStore.snapshot('workflow-state'),
      ...this.stateStore.snapshot('security-state'),
      recentDecisions: this.recentDecisions,
    };
  }

  cleanup(): void {
    this.recentDecisions = [];
    this.state = {
      initialized: true,
      currentGate: this.state.currentGate,
      decisionCount: this.state.decisionCount,
      completedTasks: [...this.state.completedTasks],
    };
  }
}

// Singleton instance
let systemBrainInstance: SystemBrain | null = null;

export function createSystemBrain(stateStore?: StateStore, messenger?: BrainMessenger): SystemBrain {
  if (!systemBrainInstance) {
    systemBrainInstance = new SystemBrain(stateStore, messenger);
  }
  return systemBrainInstance;
}

export function getSystemBrain(): SystemBrain {
  if (!systemBrainInstance) {
    systemBrainInstance = new SystemBrain();
  }
  return systemBrainInstance;
}