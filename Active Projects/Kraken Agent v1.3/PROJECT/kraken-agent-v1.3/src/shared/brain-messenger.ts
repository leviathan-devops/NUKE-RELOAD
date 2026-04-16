/**
 * Brain Messenger - V2.0
 * 
 * Structured message schema - no natural language overrides.
 */

export type OverrideAction =
  | 'ABORT'
  | 'CLAIM_COMPLETE'
  | 'REASSIGN'
  | 'RETRIEVE_OUTPUTS'
  | 'RETRY'
  | 'SUSPEND'
  | 'RESUME';

export type OverridePriority = 'critical' | 'high';

export interface OverrideTarget {
  brainId?: string;
  taskId?: string;
  clusterId?: string;
}

export interface OverridePayload {
  reason?: string;
  force?: boolean;
  evidence?: string[];
  verifyOutputs?: boolean;
  targetCluster?: 'alpha' | 'beta' | 'gamma';
  reassignReason?: string;
}

export interface OverrideConstraints {
  requiresEvidence?: string[];
  evidenceCheck?: string;
  maxRetries?: number;
  timeout?: number;
}

export interface OverrideCommand {
  id: string;
  type: 'OVERRIDE';
  action: OverrideAction;
  target: OverrideTarget;
  payload: OverridePayload;
  constraints?: OverrideConstraints;
  priority: OverridePriority;
  requiresAck: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export type OverrideStatus = 'acknowledged' | 'executing' | 'completed' | 'rejected' | 'failed';

export interface OverrideResult {
  action: OverrideAction;
  outputs?: string[];
  evidence?: { path: string }[];
  reassignedTo?: string;
}

export interface OverrideError {
  code: string;
  message: string;
  constraintFailed?: string;
  canRetry: boolean;
}

export interface OverrideResponse {
  commandId: string;
  status: OverrideStatus;
  result?: OverrideResult;
  error?: OverrideError;
  respondedAt: Date;
}

export interface BrainMessage {
  id: string;
  from: string;
  to: string;
  type: 'context-inject' | 'gate-failure' | 'checkpoint' | 'override' | 'sync';
  payload: Record<string, unknown>;
  priority: 'critical' | 'high' | 'normal' | 'low';
  requiresAck: boolean;
  createdAt: Date;
}

export class BrainMessenger {
  private commandId = 0;
  private pendingCommands: Map<string, OverrideCommand> = new Map();
  private messageQueue: BrainMessage[] = [];
  
  generateCommandId(): string {
    return `ovr-${++this.commandId}`;
  }
  
  createOverrideCommand(params: {
    action: OverrideAction;
    target: OverrideTarget;
    payload?: OverridePayload;
    constraints?: OverrideConstraints;
    priority?: OverridePriority;
  }): OverrideCommand {
    const command: OverrideCommand = {
      id: this.generateCommandId(),
      type: 'OVERRIDE',
      action: params.action,
      target: params.target,
      payload: params.payload || {},
      constraints: params.constraints,
      priority: params.priority || 'high',
      requiresAck: true,
      createdAt: new Date(),
    };
    
    this.pendingCommands.set(command.id, command);
    return command;
  }
  
  async send(command: OverrideCommand): Promise<void> {
    this.messageQueue.push({
      id: command.id,
      from: 'system',
      to: command.target.brainId || command.target.clusterId || 'unknown',
      type: 'override',
      payload: command as unknown as Record<string, unknown>,
      priority: command.priority,
      requiresAck: command.requiresAck,
      createdAt: command.createdAt,
    });
  }
  
  async waitForAck(commandId: string, timeoutMs: number = 30000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Command ${commandId} ack timeout`));
      }, timeoutMs);
      
      // In real implementation, this would wait for actual ack
      clearTimeout(timeout);
      resolve();
    });
  }
  
  getPendingCommand(id: string): OverrideCommand | undefined {
    return this.pendingCommands.get(id);
  }
  
  removePendingCommand(id: string): void {
    this.pendingCommands.delete(id);
  }
  
  createOverrideResponse(
    commandId: string,
    status: OverrideStatus,
    result?: OverrideResult,
    error?: OverrideError
  ): OverrideResponse {
    return {
      commandId,
      status,
      result,
      error,
      respondedAt: new Date(),
    };
  }
}
