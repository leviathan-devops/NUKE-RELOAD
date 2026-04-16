/**
 * src/brains/planning/planning-brain.ts
 * 
 * V1.2 Planning Brain
 * 
 * Owns: planning-state, context-bridge
 * 
 * Responsibilities:
 * - T2 Master context loading
 * - T1 dynamic generation from SPEC.md
 * - Task decomposition for cluster assignment
 * - Domain designation
 */

import { getStateStore, type StateStore } from '../../shared/state-store.js';
import { getBrainMessenger, type BrainMessenger } from '../../shared/brain-messenger.js';
import type { DomainId } from '../../shared/domain-ownership.js';

export interface TaskSpec {
  id: string;
  type: 'build' | 'debug' | 'test' | 'refactor' | 'analyze' | 'audit';
  description: string;
  targetCluster: 'alpha' | 'beta' | 'gamma';
  outputs?: { path: string; type: 'file' | 'directory'; required: boolean }[];
  priority?: 'critical' | 'high' | 'normal' | 'low';
}

export interface PlanningState {
  t2MasterLoaded: boolean;
  t1Generated: boolean;
  tasksDecomposed: boolean;
  domainsDesignated: boolean;
}

export class PlanningBrain {
  private initialized = false;
  private state: PlanningState = {
    t2MasterLoaded: false,
    t1Generated: false,
    tasksDecomposed: false,
    domainsDesignated: false,
  };
  private stateStore: StateStore;
  private messenger: BrainMessenger;

  constructor(stateStore?: StateStore, messenger?: BrainMessenger) {
    this.stateStore = stateStore || getStateStore();
    this.messenger = messenger || getBrainMessenger();
  }

  initialize(): void {
    if (this.initialized) return;
    
    console.log('[PlanningBrain] Initializing...');
    this.initialized = true;
    
    // Set initial state
    this.stateStore.set('planning-state', 'initialized', true, ['kraken-planning']);
    this.stateStore.set('planning-state', 'brain-id', 'kraken-planning', ['kraken-planning']);
    
    console.log('[PlanningBrain] Initialized - owns planning-state, context-bridge');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // =========================================================================
  // T2 MASTER CONTEXT
  // =========================================================================

  async loadT2Master(): Promise<void> {
    console.log('[PlanningBrain] Loading T2 Master context...');
    
    // Load T2 Master context from kraken-context
    // In real implementation, this loads from kraken-context library
    const t2Context = await this.loadKrakenContext();
    
    this.stateStore.set('planning-state', 't2-master', t2Context, ['kraken-planning']);
    this.state.t2MasterLoaded = true;
    
    // Notify other brains that T2 is loaded
    this.messenger.deliverMessage('kraken-planning', 'kraken-execution', 'context-inject', {
      type: 't2-master-loaded',
      data: { t2MasterLoaded: true }
    }, 'high');
    
    console.log('[PlanningBrain] T2 Master loaded');
  }

  isT2MasterLoaded(): boolean {
    return this.state.t2MasterLoaded;
  }

  private async loadKrakenContext(): Promise<Record<string, unknown>> {
    // This would load from kraken-context library in real implementation
    // For now, return a minimal context structure
    return {
      version: '1.2',
      loadedAt: Date.now(),
      capabilities: ['planning', 'execution', 'system', 'hive'],
      clusterTypes: ['alpha', 'beta', 'gamma'],
    };
  }

  // =========================================================================
  // T1 DYNAMIC GENERATION
  // =========================================================================

  async generateT1(specPath: string = 'SPEC.md'): Promise<{
    tasks: TaskSpec[];
    context: Record<string, unknown>;
  }> {
    if (!this.state.t2MasterLoaded) {
      throw new Error('[PlanningBrain] T2 Master must be loaded before T1 generation');
    }
    
    console.log('[PlanningBrain] Generating T1 from SPEC.md...');
    
    // In real implementation:
    // 1. Read SPEC.md from workspace
    // 2. Analyze requirements
    // 3. Generate task structure
    // 4. Create context bridge
    
    const t1 = {
      tasks: [] as TaskSpec[],
      context: {
        specPath,
        generatedAt: new Date().toISOString(),
        phases: ['PLAN', 'BUILD', 'TEST', 'VERIFY', 'AUDIT', 'DELIVERY'],
        planningBrain: 'kraken-planning',
      },
    };
    
    this.state.t1Generated = true;
    this.stateStore.set('planning-state', 't1-generated', true, ['kraken-planning']);
    this.stateStore.set('planning-state', 't1-context', t1, ['kraken-planning']);
    
    console.log('[PlanningBrain] T1 generated');
    
    return t1;
  }

  isT1Generated(): boolean {
    return this.state.t1Generated;
  }

  // =========================================================================
  // TASK DECOMPOSITION
  // =========================================================================

  async decomposeTasks(tasks: TaskSpec[]): Promise<TaskSpec[]> {
    console.log('[PlanningBrain] Decomposing tasks for cluster assignment...');
    
    const decomposed = tasks.map(task => ({
      ...task,
      // V1.2: Output declarations are REQUIRED for execution verification
      outputs: task.outputs || [],
      // Assign to cluster based on task type
      targetCluster: this.assignCluster(task.type),
    }));
    
    this.state.tasksDecomposed = true;
    this.stateStore.set('planning-state', 'decomposed-tasks', decomposed, ['kraken-planning']);
    
    console.log(`[PlanningBrain] Decomposed ${decomposed.length} tasks`);
    
    return decomposed;
  }

  assignCluster(taskType: TaskSpec['type']): 'alpha' | 'beta' | 'gamma' {
    // Alpha: steamroll builds - from-scratch, feature, implement
    // Beta: precision tasks - debug, fix, refactor, patch, analyze
    // Gamma: testing - test, verify, audit, integration
    
    const clusterMap: Record<TaskSpec['type'], 'alpha' | 'beta' | 'gamma'> = {
      'build': 'alpha',
      'test': 'gamma',
      'audit': 'gamma',
      'debug': 'beta',
      'refactor': 'beta',
      'analyze': 'beta',
    };
    
    return clusterMap[taskType] || 'alpha';
  }

  isTasksDecomposed(): boolean {
    return this.state.tasksDecomposed;
  }

  // =========================================================================
  // DOMAIN DESIGNATION
  // =========================================================================

  async designateDomains(tasks: TaskSpec[]): Promise<void> {
    console.log('[PlanningBrain] Designating domains for task execution...');
    
    const domainMap: Record<string, DomainId> = {
      'build': 'execution-state',
      'debug': 'thinking-state',
      'test': 'quality-state',
      'refactor': 'execution-state',
      'analyze': 'thinking-state',
      'audit': 'security-state',
    };
    
    const designations = tasks.map(task => ({
      taskId: task.id,
      primaryDomain: domainMap[task.type] || 'execution-state',
      secondaryDomain: 'workflow-state' as DomainId,
    }));
    
    this.state.domainsDesignated = true;
    this.stateStore.set('planning-state', 'domain-designations', designations, ['kraken-planning']);
    
    console.log(`[PlanningBrain] Designated domains for ${designations.length} tasks`);
  }

  isDomainsDesignated(): boolean {
    return this.state.domainsDesignated;
  }

  // =========================================================================
  // CONTEXT BRIDGE
  // =========================================================================

  async createContextBridge(sourceTask: string, targetTask: string): Promise<void> {
    console.log(`[PlanningBrain] Creating context bridge: ${sourceTask} → ${targetTask}`);
    
    const bridge = {
      source: sourceTask,
      target: targetTask,
      createdAt: Date.now(),
      type: 'planning-context',
    };
    
    this.stateStore.set('context-bridge', `${sourceTask}-${targetTask}`, bridge, ['kraken-planning']);
    
    // Inject context into target task's planning
    this.messenger.deliverMessage('kraken-planning', 'kraken-execution', 'context-inject', {
      type: 'context-bridge',
      sourceTask,
      targetTask,
      bridge,
    }, 'normal');
  }

  // =========================================================================
  // STATE ACCESS
  // =========================================================================

  getState(): PlanningState {
    return { ...this.state };
  }

  getSnapshot(): Record<string, unknown> {
    return this.stateStore.snapshot('planning-state');
  }
}

// Singleton instance
let planningBrainInstance: PlanningBrain | null = null;

export function createPlanningBrain(stateStore?: StateStore, messenger?: BrainMessenger): PlanningBrain {
  if (!planningBrainInstance) {
    planningBrainInstance = new PlanningBrain(stateStore, messenger);
  }
  return planningBrainInstance;
}

export function getPlanningBrain(): PlanningBrain {
  if (!planningBrainInstance) {
    planningBrainInstance = new PlanningBrain();
  }
  return planningBrainInstance;
}