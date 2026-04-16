/**
 * Override Command Handler - V2.0
 * 
 * KEY INNOVATION: Structured override commands with typed schema
 * 
 * Problem: Natural language overrides had interpretation risk
 * Solution: Typed schema with explicit actions, constraints, responses
 */

import {
  type OverrideCommand,
  type OverrideAction,
  type OverrideResponse,
  type OverrideResult,
  type OverrideError,
  type OverrideTarget,
  type OverridePayload,
  type OverrideConstraints,
} from '../../shared/brain-messenger.js';
import { OutputVerifier } from '../../shared/output-verifier.js';

export class OverrideHandler {
  private pendingCommands: Map<string, OverrideCommand> = new Map();
  private outputVerifier: OutputVerifier;
  
  constructor(outputVerifier: OutputVerifier) {
    this.outputVerifier = outputVerifier;
  }
  
  // =========================================================================
  // COMMAND CREATION (for Execution Brain to send)
  // =========================================================================
  
  createAbortCommand(
    taskId: string,
    reason: string,
    priority: 'critical' | 'high' = 'critical'
  ): OverrideCommand {
    return {
      id: this.generateId(),
      type: 'OVERRIDE',
      action: 'ABORT',
      target: { taskId },
      payload: { reason },
      priority,
      requiresAck: true,
      createdAt: new Date(),
    };
  }
  
  createClaimCompleteCommand(
    taskId: string,
    evidence: string[],
    verifyOutputs: boolean = true
  ): OverrideCommand {
    return {
      id: this.generateId(),
      type: 'OVERRIDE',
      action: 'CLAIM_COMPLETE',
      target: { taskId },
      payload: { evidence, verifyOutputs },
      constraints: {
        requiresEvidence: evidence,
        evidenceCheck: 'passRate >= 0.96',
      },
      priority: 'critical',
      requiresAck: true,
      createdAt: new Date(),
    };
  }
  
  createRetrieveOutputsCommand(
    taskId: string,
    timeout: number = 30000
  ): OverrideCommand {
    return {
      id: this.generateId(),
      type: 'OVERRIDE',
      action: 'RETRIEVE_OUTPUTS',
      target: { taskId },
      payload: {},
      constraints: { timeout },
      priority: 'high',
      requiresAck: true,
      createdAt: new Date(),
    };
  }
  
  createReassignCommand(
    taskId: string,
    targetCluster: 'alpha' | 'beta' | 'gamma',
    reason: string
  ): OverrideCommand {
    return {
      id: this.generateId(),
      type: 'OVERRIDE',
      action: 'REASSIGN',
      target: { taskId },
      payload: { targetCluster, reassignReason: reason },
      priority: 'high',
      requiresAck: true,
      createdAt: new Date(),
    };
  }
  
  // =========================================================================
  // COMMAND EXECUTION (for Subagent-Manager to handle)
  // =========================================================================
  
  async executeCommand(command: OverrideCommand): Promise<OverrideResponse> {
    this.pendingCommands.set(command.id, command);
    
    try {
      // Validate command
      if (!this.validateCommand(command)) {
        return this.createErrorResponse(
          command.id,
          'INVALID_COMMAND',
          'Malformed command structure',
          false
        );
      }
      
      // Check constraints
      if (command.constraints?.requiresEvidence) {
        for (const path of command.constraints.requiresEvidence) {
          if (!this.checkEvidenceExists(path)) {
            return this.createErrorResponse(
              command.id,
              'CONSTRAINT_NOT_MET',
              `Required evidence not found: ${path}`,
              true
            );
          }
        }
      }
      
      // Execute based on action
      let result: OverrideResult;
      
      switch (command.action) {
        case 'ABORT':
          result = await this.executeAbort(command);
          break;
        case 'CLAIM_COMPLETE':
          result = await this.executeClaimComplete(command);
          break;
        case 'RETRIEVE_OUTPUTS':
          result = await this.executeRetrieveOutputs(command);
          break;
        case 'REASSIGN':
          result = await this.executeReassign(command);
          break;
        default:
          return this.createErrorResponse(
            command.id,
            'UNKNOWN_ACTION',
            `Unknown action: ${command.action}`,
            false
          );
      }
      
      return {
        commandId: command.id,
        status: 'completed',
        result,
        respondedAt: new Date(),
      };
      
    } catch (error) {
      return this.createErrorResponse(
        command.id,
        'EXECUTION_FAILED',
        error instanceof Error ? error.message : 'Unknown error',
        true
      );
    } finally {
      this.pendingCommands.delete(command.id);
    }
  }
  
  private validateCommand(command: OverrideCommand): boolean {
    if (!command.id || !command.type || !command.action) return false;
    if (command.type !== 'OVERRIDE') return false;
    if (!command.target || (!command.target.taskId && !command.target.brainId)) return false;
    return true;
  }
  
  private checkEvidenceExists(path: string): boolean {
    // In real implementation, use fs.existsSync
    return path.length > 0;
  }
  
  // =========================================================================
  // ACTION EXECUTORS
  // =========================================================================
  
  private async executeAbort(command: OverrideCommand): Promise<OverrideResult> {
    const { taskId } = command.target;
    const { reason, force } = command.payload;
    
    // In real implementation, actually abort the task
    console.log(`[OverrideHandler] ABORT task ${taskId}: ${reason}`);
    
    return { action: 'ABORT' };
  }
  
  private async executeClaimComplete(command: OverrideCommand): Promise<OverrideResult> {
    const { taskId } = command.target;
    const { evidence, verifyOutputs } = command.payload;
    
    // Check if outputs can be verified
    if (verifyOutputs) {
      if (!this.outputVerifier.canComplete(taskId)) {
        throw new Error('CONSTRAINT_NOT_MET: Not all outputs verified');
      }
    }
    
    return {
      action: 'CLAIM_COMPLETE',
      evidence: evidence?.map(e => ({ path: e })),
    };
  }
  
  private async executeRetrieveOutputs(command: OverrideCommand): Promise<OverrideResult> {
    const { taskId } = command.target;
    
    // Get declared outputs
    const checkpoints = this.outputVerifier.getCheckpoints(taskId);
    const hostPaths = checkpoints.map(c => c.hostPath);
    
    // In real implementation, actually retrieve from container
    console.log(`[OverrideHandler] RETRIEVE_OUTPUTS for ${taskId}: ${hostPaths.length} files`);
    
    return {
      action: 'RETRIEVE_OUTPUTS',
      outputs: hostPaths,
    };
  }
  
  private async executeReassign(command: OverrideCommand): Promise<OverrideResult> {
    const { taskId } = command.target;
    const { targetCluster, reassignReason } = command.payload;
    
    console.log(`[OverrideHandler] REASSIGN ${taskId} to ${targetCluster}: ${reassignReason}`);
    
    return {
      action: 'REASSIGN',
      reassignedTo: targetCluster,
    };
  }
  
  // =========================================================================
  // RESPONSE HELPERS
  // =========================================================================
  
  private createErrorResponse(
    commandId: string,
    code: string,
    message: string,
    canRetry: boolean
  ): OverrideResponse {
    return {
      commandId,
      status: 'failed',
      error: { code, message, canRetry },
      respondedAt: new Date(),
    };
  }
  
  private generateId(): string {
    return `ovr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
