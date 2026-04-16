/**
 * System Brain - V2.0
 * 
 * Owns: workflow-state, security-state, compaction-state
 * 
 * Key V2.0 Components:
 * - Two-Layer Guardian (Tool + Message enforcement)
 * - Gate Manager (Explicit criteria)
 * - Compaction Manager (Four-tier system)
 */

import type { Hooks } from '@opencode-ai/plugin';
import { TwoLayerGuardian, createToolGuardianHook, createMessageGuardianHook } from './two-layer-guardian.js';
import { GateManager, type GateId } from './gate-manager.js';
import { CompactionManager } from './compaction-manager.js';

import type { InjectionFile } from './compaction-manager.js';

export class SystemBrain {
  private initialized = false;
  private guardian: TwoLayerGuardian;
  private gateManager: GateManager;
  private compactionManager: CompactionManager;
  private recentDecisionPoints: { description: string; type: string; contextFiles: string[] }[] = [];
  private completedTasks: string[] = [];
  private activeTask: string = '';
  
  constructor() {
    this.guardian = new TwoLayerGuardian();
    this.gateManager = new GateManager();
    this.compactionManager = new CompactionManager();
  }
  
  initialize(): void {
    this.guardian.initialize();
    this.initialized = true;
    console.log('[SystemBrain] Initialized with Two-Layer Guardian + Compaction Manager');
  }
  
  isInitialized(): boolean {
    return this.initialized;
  }
  
  // =========================================================================
  // DECISION & TASK TRACKING
  // =========================================================================
  
  recordDecision(decision: { description: string; type: string; contextFiles: string[] }): void {
    this.recentDecisionPoints.unshift(decision);
    if (this.recentDecisionPoints.length > 20) {
      this.recentDecisionPoints.pop();
    }
  }
  
  getRecentDecisionPoints(): { description: string; type: string; contextFiles: string[] }[] {
    return [...this.recentDecisionPoints];
  }
  
  recordTaskStart(taskId: string): void {
    this.activeTask = taskId;
  }
  
  recordTaskComplete(taskId: string): void {
    this.completedTasks.push(taskId);
    if (this.activeTask === taskId) {
      this.activeTask = '';
    }
  }
  
  getCompletedTasks(): string[] {
    return [...this.completedTasks];
  }
  
  getActiveTask(): string {
    return this.activeTask;
  }
  
  // =========================================================================
  // TWO-LAYER GUARDIAN
  // =========================================================================
  
  checkTool(tool: string, args: Record<string, unknown>): void {
    const result = this.guardian.checkTool(tool, args);
    if (result.blocked) {
      throw new Error(`[SystemBrain] ${result.reason}`);
    }
  }
  
  checkMessage(message: string): void {
    const result = this.guardian.checkMessage(message);
    if (result.blocked) {
      throw new Error(`[SystemBrain] ${result.reason}`);
    }
  }
  
  // =========================================================================
  // GATE MANAGEMENT
  // =========================================================================
  
  getCurrentGate(): GateId {
    return this.gateManager.getCurrentGate();
  }
  
  registerBrainCompletion(brainId: 'planning' | 'execution' | 'system', criterion: string): void {
    this.gateManager.registerCompletion(brainId, criterion);
  }
  
  evaluateGateEntry(gateId: GateId) {
    return this.gateManager.evaluateGateEntry(gateId);
  }
  
  tryAdvanceGate(gateId: GateId): boolean {
    return this.gateManager.advanceGate(gateId) as unknown as boolean;
  }
  
  // =========================================================================
  // COMPACTION MANAGEMENT
  // =========================================================================
  
  updateTokenCount(tokens: number): void {
    this.compactionManager.updateTokens(tokens);
  }
  
  shouldTriggerPreCompaction(): boolean {
    return this.compactionManager.shouldTriggerPreCompaction();
  }
  
  async triggerPreCompaction(
    chatContent: string,
    phase: string,
    decisionPoints: { description: string; type: string; contextFiles: string[] }[],
    brainState: Record<string, unknown>
  ): Promise<void> {
    const lines = chatContent.split('\n').length;
    await this.compactionManager.triggerPreCompaction(
      lines,
      phase,
      decisionPoints,
      brainState
    );
  }
  
  checkForRecoveryData(): { chatContent: string; phase: string; decisions: any[]; state: any } | null {
    return this.compactionManager.getPreCompactionData();
  }
  
  async synthesizeRecovery(
    recoveryData: { chatContent: string; phase: string; decisions: any[]; state: any },
    currentFiles: Map<string, string>
  ): Promise<InjectionFile | null> {
    return this.compactionManager.synthesizeRecovery(recoveryData, currentFiles);
  }
  
  async synthesizePostCompaction(
    contextFiles: Map<string, string>
  ): Promise<{ injection: unknown } | null> {
    const injection = await this.compactionManager.synthesizePostCompaction(contextFiles);
    return injection ? { injection } : null;
  }
  
  registerContextForCompaction(
    id: string,
    priority: 'critical' | 'high' | 'medium' | 'low'
  ): void {
    this.compactionManager.registerContext(id, priority);
  }
  
  // =========================================================================
  // HOOKS
  // =========================================================================
  
  createHooks(): Hooks {
    return {
      'tool.execute.before': createToolGuardianHook(this.guardian),
      'chat.message': createMessageGuardianHook(this.guardian),
    };
  }
}

// Singleton instance
let systemBrainInstance: SystemBrain | null = null;

export function getSystemBrain(): SystemBrain {
  if (!systemBrainInstance) {
    systemBrainInstance = new SystemBrain();
  }
  return systemBrainInstance;
}

export function createSystemBrain(): SystemBrain {
  const brain = new SystemBrain();
  systemBrainInstance = brain;
  return brain;
}
