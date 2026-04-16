/**
 * Gate Manager - V2.0
 * 
 * KEY INNOVATION: Explicit gate entry criteria per brain
 * 
 * Problem: "Sync at gates" was ambiguous - no explicit criteria
 * Solution: Each brain declares completed criteria + evidence requirements
 */

import * as fs from 'fs';

export type GateId = 'PLAN' | 'BUILD' | 'TEST' | 'VERIFY' | 'AUDIT' | 'DELIVERY';

export interface EvidenceRequirement {
  path: string;
  type: 'file' | 'directory';
  check?: string; // e.g., 'passRate >= 0.96'
}

export interface BrainCriteria {
  completed: string[];
  evidence: EvidenceRequirement[];
}

export interface GateCriteria {
  gateId: GateId;
  description: string;
  planningBrain: BrainCriteria;
  executionBrain: BrainCriteria;
  systemBrain: BrainCriteria;
}

export interface BrainCriteriaResult {
  brainId: string;
  passed: boolean;
  completed: string[];
  missing: string[];
  evidenceResults: {
    path: string;
    exists: boolean;
    checkPassed: boolean;
  }[];
}

export interface GateEntryResult {
  gateId: GateId;
  allPassed: boolean;
  details: {
    planning: BrainCriteriaResult;
    execution: BrainCriteriaResult;
    system: BrainCriteriaResult;
  };
  blockers: string[];
}

// ============================================================================
// GATE DEFINITIONS
// ============================================================================

export const GATE_DEFINITIONS: Record<GateId, GateCriteria> = {
  PLAN: {
    gateId: 'PLAN',
    description: 'Planning complete, ready to build',
    planningBrain: {
      completed: ['T2_master_loaded', 'T1_generated', 'tasks_decomposed', 'domain_designated'],
      evidence: [
        { path: 'SPEC.md', type: 'file' },
        { path: 'plan.md', type: 'file' },
      ],
    },
    executionBrain: {
      completed: ['containers_ready', 'clusters_available'],
      evidence: [],
    },
    systemBrain: {
      completed: ['firewall_initialized', 'gate_manager_ready'],
      evidence: [],
    },
  },
  
  BUILD: {
    gateId: 'BUILD',
    description: 'Build execution in progress',
    planningBrain: {
      completed: ['context_injected'],
      evidence: [],
    },
    executionBrain: {
      completed: ['tasks_spawned', 'alpha_build_started', 'progress_tracked'],
      evidence: [],
    },
    systemBrain: {
      completed: ['orchestration_theater_blocked', 'false_completion_blocked'],
      evidence: [],
    },
  },
  
  TEST: {
    gateId: 'TEST',
    description: 'Testing phase - container tests required',
    planningBrain: {
      completed: ['test_plan_generated'],
      evidence: [],
    },
    executionBrain: {
      completed: ['build_complete', 'outputs_retrieved', 'test_task_spawned'],
      evidence: [
        { path: 'dist/index.js', type: 'file' },
      ],
    },
    systemBrain: {
      completed: ['container_test_required', 'test_verification_active'],
      evidence: [
        { 
          path: 'ContainerTestResult.json', 
          type: 'file',
          check: 'passRate >= 0.96',
        },
      ],
    },
  },
  
  VERIFY: {
    gateId: 'VERIFY',
    description: 'Verification phase - integration tests',
    planningBrain: {
      completed: ['verification_plan_generated'],
      evidence: [],
    },
    executionBrain: {
      completed: ['integration_tests_spawned'],
      evidence: [],
    },
    systemBrain: {
      completed: ['verification_patterns_active'],
      evidence: [
        { path: 'IntegrationTestResult.json', type: 'file' },
      ],
    },
  },
  
  AUDIT: {
    gateId: 'AUDIT',
    description: 'Code review and audit',
    planningBrain: {
      completed: ['audit_criteria_defined'],
      evidence: [],
    },
    executionBrain: {
      completed: ['all_outputs_merged'],
      evidence: [],
    },
    systemBrain: {
      completed: ['security_scan_passed', 'linter_passed'],
      evidence: [
        { path: 'AuditReport.json', type: 'file' },
      ],
    },
  },
  
  DELIVERY: {
    gateId: 'DELIVERY',
    description: 'Final delivery - ship package',
    planningBrain: {
      completed: ['delivery_package_prepared'],
      evidence: [
        { path: 'ship-package/', type: 'directory' },
      ],
    },
    executionBrain: {
      completed: ['all_tasks_complete', 'outputs_verified'],
      evidence: [],
    },
    systemBrain: {
      completed: ['all_gates_passed', 'ship_package_verified'],
      evidence: [
        { path: '.shark/evidence/ship/ContainerTestResult.json', type: 'file' },
      ],
    },
  },
};

// ============================================================================
// GATE MANAGER
// ============================================================================

export class GateManager {
  private currentGate: GateId = 'PLAN';
  private brainStates: Map<string, Set<string>> = new Map();
  
  getCurrentGate(): GateId {
    return this.currentGate;
  }
  
  setCurrentGate(gate: GateId): void {
    this.currentGate = gate;
  }
  
  registerCompletion(brainId: string, criterion: string): void {
    if (!this.brainStates.has(brainId)) {
      this.brainStates.set(brainId, new Set());
    }
    this.brainStates.get(brainId)!.add(criterion);
  }
  
  getCompleted(brainId: string): string[] {
    return Array.from(this.brainStates.get(brainId) || []);
  }
  
  evaluateGateEntry(gateId: GateId): GateEntryResult {
    const criteria = GATE_DEFINITIONS[gateId];
    
    const planningResult = this.evaluateBrainCriteria(
      'planning', criteria.planningBrain
    );
    const executionResult = this.evaluateBrainCriteria(
      'execution', criteria.executionBrain
    );
    const systemResult = this.evaluateBrainCriteria(
      'system', criteria.systemBrain
    );
    
    const allPassed = planningResult.passed && 
      executionResult.passed && 
      systemResult.passed;
    
    return {
      gateId,
      allPassed,
      details: {
        planning: planningResult,
        execution: executionResult,
        system: systemResult,
      },
      blockers: this.getBlockers(criteria, planningResult, executionResult, systemResult),
    };
  }
  
  private evaluateBrainCriteria(
    brainId: string,
    criteria: BrainCriteria
  ): BrainCriteriaResult {
    const state = this.brainStates.get(brainId) || new Set();
    
    const completed = criteria.completed.filter(c => state.has(c));
    const missing = criteria.completed.filter(c => !state.has(c));
    
    // Check evidence
    const evidenceResults = criteria.evidence.map(e => ({
      path: e.path,
      exists: fs.existsSync(e.path),
      checkPassed: e.check ? this.evaluateCheck(e.path, e.check) : true,
    }));
    
    const evidencePassed = evidenceResults.every(e => e.exists && e.checkPassed);
    
    return {
      brainId,
      passed: missing.length === 0 && evidencePassed,
      completed,
      missing,
      evidenceResults,
    };
  }
  
  private evaluateCheck(filePath: string, check: string): boolean {
    if (!fs.existsSync(filePath)) return false;
    
    // Simple passRate check for test results
    if (check.includes('passRate')) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        const passRate = data.passRate ?? 0;
        
        // Parse 'passRate >= 0.96'
        const match = check.match(/passRate\s*>=\s*([\d.]+)/);
        if (match) {
          return passRate >= parseFloat(match[1]);
        }
      } catch {
        return false;
      }
    }
    
    return true;
  }
  
  private getBlockers(
    criteria: GateCriteria,
    planning: BrainCriteriaResult,
    execution: BrainCriteriaResult,
    system: BrainCriteriaResult
  ): string[] {
    const blockers: string[] = [];
    
    for (const m of planning.missing) {
      blockers.push(`planning: ${m} not complete`);
    }
    for (const e of planning.evidenceResults.filter(e => !e.checkPassed)) {
      blockers.push(`planning: evidence ${e.path} failed check`);
    }
    
    for (const m of execution.missing) {
      blockers.push(`execution: ${m} not complete`);
    }
    for (const e of execution.evidenceResults.filter(e => !e.checkPassed)) {
      blockers.push(`execution: evidence ${e.path} failed check`);
    }
    
    for (const m of system.missing) {
      blockers.push(`system: ${m} not complete`);
    }
    for (const e of system.evidenceResults.filter(e => !e.checkPassed)) {
      blockers.push(`system: evidence ${e.path} failed check`);
    }
    
    return blockers;
  }
  
  async advanceGate(gateId: GateId): Promise<boolean> {
    const result = this.evaluateGateEntry(gateId);
    
    if (!result.allPassed) {
      console.log(`Gate ${gateId} blocked:`);
      for (const blocker of result.blockers) {
        console.log(`  - ${blocker}`);
      }
      return false;
    }
    
    // Advance to next gate
    const gateOrder: GateId[] = ['PLAN', 'BUILD', 'TEST', 'VERIFY', 'AUDIT', 'DELIVERY'];
    const currentIndex = gateOrder.indexOf(gateId);
    if (currentIndex < gateOrder.length - 1) {
      this.currentGate = gateOrder[currentIndex + 1];
    }
    
    return true;
  }
}
