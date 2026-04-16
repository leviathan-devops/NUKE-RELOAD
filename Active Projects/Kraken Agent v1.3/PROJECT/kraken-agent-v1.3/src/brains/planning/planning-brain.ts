/**
 * Planning Brain - V2.0
 *
 * Owns: planning-state, context-bridge
 *
 * Responsibilities:
 * - T2 Master context loading
 * - T1 dynamic generation from SPEC.md
 * - Task decomposition for cluster assignment
 * - Domain designation
 */

import * as fs from 'fs';
import * as path from 'path';

interface T2Context {
  patterns: string;
  buildChain: string;
  failureModes: string;
}

export class PlanningBrain {
  private initialized = false;
  private t2MasterLoaded = false;
  private t1Generated = false;
  private tasksDecomposed = false;
  private domainsDesignated = false;
  private t2Context: T2Context = { patterns: '', buildChain: '', failureModes: '' };

  initialize(): void {
    this.initialized = true;
    console.log('[PlanningBrain] Initialized');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // =========================================================================
  // T2 MASTER CONTEXT
  // =========================================================================

  async loadT2Master(): Promise<void> {
    console.log('[PlanningBrain] Loading T2 Master context...');

    const contextDir = path.join(process.cwd(), 'kraken-context');
    const files = ['T2_PATTERNS.md', 'T2_BUILD_CHAIN.md', 'T2_FAILURE_MODES.md'];

    for (const file of files) {
      const filePath = path.join(contextDir, file);
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const key = file.replace('T2_', '').replace('.md', '').toLowerCase() as keyof T2Context;
          this.t2Context[key] = content;
          console.log(`[PlanningBrain] Loaded ${file}: ${content.length} chars`);
        } else {
          console.log(`[PlanningBrain] T2 file not found: ${filePath}`);
        }
      } catch (err) {
        console.error(`[PlanningBrain] Error loading ${file}: ${err}`);
      }
    }

    this.t2MasterLoaded = true;
    console.log('[PlanningBrain] T2 Master loaded');
  }

  isT2MasterLoaded(): boolean {
    return this.t2MasterLoaded;
  }

  getT2Context(): T2Context {
    return this.t2Context;
  }

  // =========================================================================
  // T1 DYNAMIC GENERATION
  // =========================================================================

  async generateT1(specPath: string = 'SPEC.md'): Promise<{
    tasks: TaskSpec[];
    context: Record<string, unknown>;
  }> {
    if (!this.t2MasterLoaded) {
      throw new Error('T2 Master must be loaded before T1 generation');
    }

    console.log('[PlanningBrain] Generating T1 from SPEC.md...');

    let specContent = '';
    try {
      const specFilePath = path.join(process.cwd(), specPath);
      if (fs.existsSync(specFilePath)) {
        specContent = fs.readFileSync(specFilePath, 'utf-8');
        console.log(`[PlanningBrain] Read SPEC.md: ${specContent.length} chars`);
      } else {
        console.log(`[PlanningBrain] SPEC.md not found at ${specFilePath}, using default`);
      }
    } catch (err) {
      console.error(`[PlanningBrain] Error reading SPEC.md: ${err}`);
    }

    const tasks = this.parseSpecToTasks(specContent);
    const t1 = {
      tasks,
      context: {
        specPath,
        specContent,
        t2Patterns: this.t2Context.patterns,
        t2BuildChain: this.t2Context.buildChain,
        t2FailureModes: this.t2Context.failureModes,
        generatedAt: new Date().toISOString(),
        phases: ['PLAN', 'BUILD', 'TEST', 'VERIFY', 'AUDIT', 'DELIVERY'],
      },
    };

    this.t1Generated = true;
    console.log(`[PlanningBrain] T1 generated with ${tasks.length} tasks`);

    return t1;
  }

  private parseSpecToTasks(specContent: string): TaskSpec[] {
    if (!specContent) {
      return [];
    }

    const tasks: TaskSpec[] = [];
    const taskRegex =/#{1,3}\s*\[?([^\]]+)\]?\s*(.+?)(?=\n#{1,3}\s|$)/gs;
    let match;

    while ((match = taskRegex.exec(specContent)) !== null) {
      const type = match[1].toLowerCase().trim();
      const description = match[2].trim();
      const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      tasks.push({
        taskId,
        type: this.normalizeTaskType(type),
        description,
        cluster: this.designateCluster(this.normalizeTaskType(type)),
        outputs: [],
      });
    }

    return tasks;
  }

  private normalizeTaskType(type: string): string {
    const typeMap: Record<string, string> = {
      'feature': 'feature',
      'new feature': 'feature',
      'build': 'build',
      'implementation': 'implement',
      'implement': 'implement',
      'debug': 'debug',
      'fix': 'fix',
      'bug fix': 'fix',
      'refactor': 'refactor',
      'patch': 'patch',
      'test': 'test',
      'testing': 'test',
      'verify': 'verify',
      'verification': 'verify',
      'audit': 'audit',
      'analysis': 'analyze',
      'analyze': 'analyze',
    };

    return typeMap[type.toLowerCase()] || type.toLowerCase();
  }
  
  isT1Generated(): boolean {
    return this.t1Generated;
  }
  
  // =========================================================================
  // TASK DECOMPOSITION
  // =========================================================================
  
  async decomposeTasks(t1: { tasks: TaskSpec[] }): Promise<TaskSpec[]> {
    console.log('[PlanningBrain] Decomposing tasks for cluster assignment...');
    
    const decomposed = t1.tasks.map(task => ({
      ...task,
      // V2.0: Output declarations are REQUIRED
      outputs: task.outputs || [],
      cluster: this.designateCluster(task.type),
    }));
    
    this.tasksDecomposed = true;
    console.log('[PlanningBrain] Tasks decomposed');
    
    return decomposed;
  }
  
  isTasksDecomposed(): boolean {
    return this.tasksDecomposed;
  }
  
  // =========================================================================
  // DOMAIN DESIGNATION
  // =========================================================================
  
  /**
   * Designate cluster based on task type
   * V2.0: Mechanical - no guesswork
   */
  designateCluster(taskType: string): 'alpha' | 'beta' | 'gamma' {
    const designations: Record<string, 'alpha' | 'beta' | 'gamma'> = {
      'build': 'alpha',
      'feature': 'alpha',
      'implement': 'alpha',
      'from-scratch': 'alpha',
      
      'debug': 'beta',
      'fix': 'beta',
      'refactor': 'beta',
      'patch': 'beta',
      'analyze': 'beta',
      
      'test': 'gamma',
      'verify': 'gamma',
      'audit': 'gamma',
      'integration': 'gamma',
    };
    
    const cluster = designations[taskType.toLowerCase()] || 'alpha';
    console.log(`[PlanningBrain] Task type "${taskType}" → Cluster ${cluster}`);
    
    return cluster;
  }
  
  isDomainsDesignated(): boolean {
    return this.domainsDesignated;
  }
  
  // =========================================================================
  // WORKFLOW
  // =========================================================================
  
  async doPlanning(): Promise<{
    t2Loaded: boolean;
    t1Generated: boolean;
    tasksDecomposed: boolean;
    domainsDesignated: boolean;
  }> {
    await this.loadT2Master();
    const t1 = await this.generateT1();
    await this.decomposeTasks(t1);
    
    this.domainsDesignated = true;
    
    return {
      t2Loaded: this.t2MasterLoaded,
      t1Generated: this.t1Generated,
      tasksDecomposed: this.tasksDecomposed,
      domainsDesignated: this.domainsDesignated,
    };
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// SINGLETON FACTORY
// ============================================================================

let planningBrainInstance: PlanningBrain | null = null;

export function createPlanningBrain(): PlanningBrain {
  if (!planningBrainInstance) {
    planningBrainInstance = new PlanningBrain();
  }
  return planningBrainInstance;
}

export function getPlanningBrain(): PlanningBrain {
  if (!planningBrainInstance) {
    planningBrainInstance = new PlanningBrain();
  }
  return planningBrainInstance;
}

// ============================================================================
// TASK SPEC (V2.0)
// ============================================================================

export interface TaskSpec {
  taskId: string;
  type: string;
  description: string;
  cluster: 'alpha' | 'beta' | 'gamma';
  outputs: OutputDeclaration[];
  dependencies?: string[];
}

interface OutputDeclaration {
  containerPath: string;
  hostPath: string;
  type: 'file' | 'directory';
  required: boolean;
}
