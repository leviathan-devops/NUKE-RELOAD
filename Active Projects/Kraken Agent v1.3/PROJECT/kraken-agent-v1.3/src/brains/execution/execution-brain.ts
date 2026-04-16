/**
 * Execution Brain - V2.0
 * 
 * Owns: execution-state, quality-state
 * 
 * Key V2.0 Components:
 * - Override Handler (Structured commands)
 * - Output Verifier integration (Mechanical verification)
 * - Subagent supervision
 */

import { OutputVerifier } from '../../shared/output-verifier.js';
import { OverrideHandler } from './override-handler.js';
import type { OverrideCommand, OverrideAction } from '../../shared/brain-messenger.js';

export class ExecutionBrain {
  private initialized = false;
  private outputVerifier: OutputVerifier;
  private overrideHandler: OverrideHandler;
  private activeTasks: Map<string, { cluster: string; status: string }> = new Map();
  
  constructor() {
    this.outputVerifier = new OutputVerifier();
    this.overrideHandler = new OverrideHandler(this.outputVerifier);
  }
  
  initialize(): void {
    this.initialized = true;
    console.log('[ExecutionBrain] Initialized with Override Handler + Output Verifier');
  }
  
  isInitialized(): boolean {
    return this.initialized;
  }
  
  // =========================================================================
  // OUTPUT VERIFICATION (V2.0 KEY FEATURE)
  // =========================================================================
  
  registerTaskOutputs(
    taskId: string,
    outputs: {
      containerPath: string;
      hostPath: string;
      type: 'file' | 'directory';
      required: boolean;
    }[]
  ): void {
    this.outputVerifier.registerOutputs(taskId, outputs);
    console.log(`[ExecutionBrain] Registered ${outputs.length} outputs for task ${taskId}`);
  }
  
  async claimOutputsRetrieved(taskId: string, hostPaths: string[]): Promise<void> {
    await this.outputVerifier.claimRetrieved(taskId, hostPaths);
    console.log(`[ExecutionBrain] Verified ${hostPaths.length} outputs for task ${taskId}`);
  }
  
  canCompleteTask(taskId: string): boolean {
    return this.outputVerifier.canComplete(taskId);
  }
  
  getOutputEvidence(taskId: string) {
    return this.outputVerifier.collectEvidence(taskId);
  }
  
  // =========================================================================
  // OVERRIDE COMMANDS (V2.0 KEY FEATURE)
  // =========================================================================
  
  sendOverride(params: {
    action: OverrideAction;
    target: { taskId?: string; brainId?: string; clusterId?: string };
    payload?: Record<string, unknown>;
    constraints?: { requiresEvidence?: string[]; evidenceCheck?: string; timeout?: number };
    priority?: 'critical' | 'high';
  }): OverrideCommand {
    const command = this.overrideHandler.createAbortCommand(
      params.target.taskId || 'unknown',
      params.payload?.reason as string || 'Override command'
    );
    return command;
  }
  
  async abortTask(taskId: string, reason: string): Promise<void> {
    const command = this.overrideHandler.createAbortCommand(taskId, reason);
    const response = await this.overrideHandler.executeCommand(command);
    
    if (response.status === 'failed') {
      throw new Error(`Abort failed: ${response.error?.message}`);
    }
    
    this.activeTasks.delete(taskId);
  }
  
  async enforceOutputRetrieval(taskId: string): Promise<void> {
    const command = this.overrideHandler.createRetrieveOutputsCommand(taskId);
    const response = await this.overrideHandler.executeCommand(command);
    
    if (response.status === 'failed') {
      throw new Error(`Output retrieval failed: ${response.error?.message}`);
    }
  }
  
  async verifyCompletion(
    taskId: string,
    evidencePaths: string[]
  ): Promise<void> {
    const command = this.overrideHandler.createClaimCompleteCommand(
      taskId,
      evidencePaths,
      true
    );
    const response = await this.overrideHandler.executeCommand(command);
    
    if (response.status === 'failed') {
      throw new Error(`Completion verification failed: ${response.error?.message}`);
    }
  }
  
  // =========================================================================
  // TASK MANAGEMENT
  // =========================================================================
  
  registerTask(taskId: string, cluster: string): void {
    this.activeTasks.set(taskId, { cluster, status: 'running' });
  }
  
  getTaskStatus(taskId: string) {
    return this.activeTasks.get(taskId);
  }
  
  completeTask(taskId: string): void {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.status = 'completed';
    }
  }
  
  // =========================================================================
  // SUPERVISION
  // =========================================================================
  
  async superviseTask(taskId: string): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (!task) return;
    
    if (task.status === 'completed' && !this.canCompleteTask(taskId)) {
      await this.enforceOutputRetrieval(taskId);
    }
  }
}

// ============================================================================
// SINGLETON FACTORY
// ============================================================================

let executionBrainInstance: ExecutionBrain | null = null;

export function createExecutionBrain(): ExecutionBrain {
  if (!executionBrainInstance) {
    executionBrainInstance = new ExecutionBrain();
  }
  return executionBrainInstance;
}

export function getExecutionBrain(): ExecutionBrain {
  if (!executionBrainInstance) {
    executionBrainInstance = new ExecutionBrain();
  }
  return executionBrainInstance;
}
