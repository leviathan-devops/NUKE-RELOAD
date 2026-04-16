/**
 * Mechanical Output Verification - V2.0
 * 
 * Key innovation: fs.existsSync() checkpoint system
 * No trust - every output must be mechanically verified.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface OutputCheckpoint {
  taskId: string;
  containerPath: string;
  hostPath: string;
  type: 'file' | 'directory';
  required: boolean;
  retrieved: boolean;
  verified: boolean;
  verifiedAt?: Date;
  size?: number;
}

export interface OutputDeclaration {
  containerPath: string;
  hostPath: string;
  type: 'file' | 'directory';
  required: boolean;
  size?: number;
}

export interface OutputEvidence {
  taskId: string;
  checkpointCount: number;
  verifiedCount: number;
  checkpoints: {
    containerPath: string;
    hostPath: string;
    verified: boolean;
    verifiedAt?: string;
  }[];
  canComplete: boolean;
}

export class OutputVerifier {
  private checkpoints: Map<string, OutputCheckpoint[]> = new Map();
  
  registerOutputs(taskId: string, outputs: OutputDeclaration[]): void {
    const checkpoints: OutputCheckpoint[] = outputs.map(out => ({
      taskId,
      containerPath: out.containerPath,
      hostPath: out.hostPath,
      type: out.type,
      required: out.required,
      retrieved: false,
      verified: false,
    }));
    
    this.checkpoints.set(taskId, checkpoints);
  }
  
  getCheckpoints(taskId: string): OutputCheckpoint[] {
    return this.checkpoints.get(taskId) ?? [];
  }
  
  async claimRetrieved(taskId: string, hostPaths: string[]): Promise<void> {
    const checkpoints = this.checkpoints.get(taskId);
    if (!checkpoints) {
      throw new Error(`No checkpoints registered for task ${taskId}`);
    }
    
    for (const hostPath of hostPaths) {
      const checkpoint = checkpoints.find(c => c.hostPath === hostPath);
      
      if (!checkpoint) {
        throw new Error(
          `L2_OUTPUT_NOT_DECLARED: ${hostPath} not in checkpoint registry`
        );
      }
      
      // MECHANICAL VERIFICATION - fs.existsSync
      if (!fs.existsSync(hostPath)) {
        throw new Error(
          `L2_OUTPUT_NOT_RETRIEVED: ${checkpoint.containerPath} → ${hostPath}`
        );
      }
      
      checkpoint.retrieved = true;
      checkpoint.verified = true;
      checkpoint.verifiedAt = new Date();
    }
  }
  
  canComplete(taskId: string): boolean {
    const checkpoints = this.checkpoints.get(taskId);
    if (!checkpoints) return false;
    
    // ALL required checkpoints must be verified
    return checkpoints
      .filter(c => c.required)
      .every(c => c.verified);
  }
  
  collectEvidence(taskId: string): OutputEvidence {
    const checkpoints = this.checkpoints.get(taskId) ?? [];
    
    return {
      taskId,
      checkpointCount: checkpoints.length,
      verifiedCount: checkpoints.filter(c => c.verified).length,
      checkpoints: checkpoints.map(c => ({
        containerPath: c.containerPath,
        hostPath: c.hostPath,
        verified: c.verified,
        verifiedAt: c.verifiedAt?.toISOString(),
      })),
      canComplete: this.canComplete(taskId),
    };
  }
  
  clearTask(taskId: string): void {
    this.checkpoints.delete(taskId);
  }
}
