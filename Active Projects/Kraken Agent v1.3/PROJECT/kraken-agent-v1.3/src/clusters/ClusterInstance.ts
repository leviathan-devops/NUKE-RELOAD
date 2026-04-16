/**
 * src/clusters/ClusterInstance.ts
 *
 * Cluster Instance for Kraken v1.3
 *
 * Individual cluster runtime with async task queue and parallel execution.
 * Each cluster processes tasks asynchronously with its pool of agents.
 *
 * v1.3 Changes:
 * - Direct spawn() to Python wrapper (no HTTP daemon)
 * - Mechanical output verification via OutputVerifier
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

import type {
  ClusterConfig,
  ClusterLoad,
  KrakenDelegationRequest,
  KrakenDelegationResult,
  ClusterAgentInstance
} from '../factory/kraken-types.js';
import { OutputVerifier, type OutputDeclaration } from '../shared/output-verifier.js';

export class ClusterInstance {
  private config: ClusterConfig;
  private agents: Map<string, ClusterAgentInstance>;
  private taskQueue: Array<{
    request: KrakenDelegationRequest;
    resolve: (result: KrakenDelegationResult) => void;
    reject: (error: Error) => void;
  }>;
  private completedTasks: KrakenDelegationResult[];
  private failedTasks: KrakenDelegationResult[];
  private processing: boolean;
  private load: ClusterLoad;
  private shutdownFlag: boolean;
  private outputVerifier: OutputVerifier;

  constructor(config: ClusterConfig) {
    this.config = config;
    this.agents = new Map();
    this.taskQueue = [];
    this.completedTasks = [];
    this.failedTasks = [];
    this.processing = false;
    this.shutdownFlag = false;
    this.outputVerifier = new OutputVerifier();

    // Initialize load tracking
    this.load = {
      clusterId: config.id,
      activeTasks: 0,
      pendingTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      lastActivity: Date.now(),
    };

    // Initialize agents from config
    this.initializeAgents();

    // Start async processing
    this.startProcessing();
  }

  private initializeAgents(): void {
    for (const agentId of this.config.agents) {
      const agentType = agentId.startsWith('shark-') ? 'shark' : 'manta';
      this.agents.set(agentId, {
        id: agentId,
        agentType,
        busy: false,
        clusterId: this.config.id,
      });
    }
  }

  private startProcessing(): void {
    if (this.processing) return;
    this.processing = true;

    // Non-blocking async processing loop
    this.processLoop();
  }

  private async processLoop(): Promise<void> {
    const pendingOps: Promise<void>[] = [];

    while (!this.shutdownFlag) {
      // Find available agents and dequeue tasks
      const availableAgents = this.getAvailableAgents();
      const tasksToRun = Math.min(availableAgents.length, this.taskQueue.length);

      if (tasksToRun === 0 && pendingOps.length === 0) {
        // No work to do and no pending ops, wait before checking again
        await this.sleep(100);
        continue;
      }

      // Wait for any pending operations if queue is empty but ops are in flight
      if (tasksToRun === 0 && pendingOps.length > 0) {
        await Promise.all(pendingOps);
        pendingOps.length = 0;
        continue;
      }

      // Dequeue tasks and execute
      for (let i = 0; i < tasksToRun; i++) {
        const task = this.taskQueue.shift();
        if (!task) break;

        const agent = availableAgents[i];
        if (agent) {
          // Execute task and track the pending operation
          const op = this.executeTaskAsync(agent, task.request)
            .then(result => {
              task.resolve(result);
            })
            .catch(error => {
              task.reject(error instanceof Error ? error : new Error(String(error)));
            });
          pendingOps.push(op);
        }
      }
    }

    // Wait for all pending operations before exiting
    if (pendingOps.length > 0) {
      await Promise.all(pendingOps);
    }

    this.processing = false;
  }

  private async executeTaskAsync(
    agent: ClusterAgentInstance,
    request: KrakenDelegationRequest
  ): Promise<KrakenDelegationResult> {
    // Mark agent as busy
    agent.busy = true;
    agent.currentTaskId = request.taskId;
    this.load.activeTasks++;
    this.load.pendingTasks = Math.max(0, this.load.pendingTasks - 1);
    this.load.lastActivity = Date.now();

    try {
      // Register output checkpoints BEFORE task starts (V2.0 mechanical verification)
      if (request.outputs && request.outputs.length > 0) {
        this.outputVerifier.registerOutputs(request.taskId, request.outputs);
        console.log(`[ClusterInstance] Registered ${request.outputs.length} output checkpoints for task ${request.taskId}`);
      }

      // Execute task via direct spawn to Python wrapper
      const result = await this.executeOnAgent(agent, request);

      // MECHANICAL OUTPUT VERIFICATION - V2.0
      if (result.success && request.outputs && request.outputs.length > 0) {
        const hostPaths = request.outputs.map(o => o.hostPath);
        try {
          await this.outputVerifier.claimRetrieved(request.taskId, hostPaths);
          console.log(`[ClusterInstance] Output verification PASSED for task ${request.taskId}`);
        } catch (verifyError) {
          // Output verification FAILED - task did NOT actually complete
          console.error(`[ClusterInstance] Output verification FAILED: ${verifyError}`);
          result.success = false;
          result.error = `L2_OUTPUT_NOT_RETRIEVED: ${verifyError}`;
        }
      }

      // Record result
      if (result.success) {
        this.completedTasks.push(result);
        this.load.completedTasks++;
      } else {
        this.failedTasks.push(result);
        this.load.failedTasks++;
      }

      return result;
    } catch (error) {
      const failedResult: KrakenDelegationResult = {
        success: false,
        taskId: request.taskId,
        clusterId: this.config.id,
        agentId: agent.id,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        completedAt: Date.now(),
      };
      this.failedTasks.push(failedResult);
      this.load.failedTasks++;
      return failedResult;
    } finally {
      // Mark agent as available
      agent.busy = false;
      agent.currentTaskId = undefined;
      this.load.activeTasks = Math.max(0, this.load.activeTasks - 1);
      this.load.lastActivity = Date.now();
    }
  }

  /**
   * Execute task on agent via REAL Docker container
   * Uses direct spawn() to Python wrapper (opencode_agent.py)
   * which then spawns a Docker container with opencode-python3:latest
   */
  private async executeOnAgent(
    agent: ClusterAgentInstance,
    request: KrakenDelegationRequest
  ): Promise<KrakenDelegationResult> {
    // Path to Python wrapper script - relative to project root
    // __dirname in bundle is dist/, so ../.. gets to project root
    const wrapperPath = path.join(
      __dirname, '..', '..', 'subagent-manager', 'wrappers', 'opencode_agent.py'
    );

    if (!fs.existsSync(wrapperPath)) {
      console.error(`[ClusterInstance] Wrapper not found at: ${wrapperPath}`);
      return {
        success: false,
        taskId: request.taskId,
        clusterId: this.config.id,
        agentId: agent.id,
        status: 'failed',
        error: `Wrapper not found: ${wrapperPath}`,
        completedAt: Date.now(),
      };
    }

    const finalWrapperPath = wrapperPath;

    console.log(`[ClusterInstance] Delegating to agent ${agent.id} for task ${request.taskId}`);
    console.log(`[ClusterInstance] Wrapper: ${finalWrapperPath}`);

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.error(`[ClusterInstance] Task ${request.taskId} timeout after 120 seconds`);
        resolve({
          success: false,
          taskId: request.taskId,
          clusterId: this.config.id,
          agentId: agent.id,
          status: 'failed',
          error: 'Task execution timeout after 120 seconds',
          completedAt: Date.now(),
        });
      }, 120000);

      const proc = spawn('python3', [
        finalWrapperPath,
        '--task', request.task,
        '--model', 'minimax/MiniMax-M2.7',
        '--timeout', '120',
        '--cleanup',
        '--workspace', process.cwd() || '/workspace',
      ]);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        clearTimeout(timeout);

        if (code === 0) {
          try {
            const result = JSON.parse(stdout);

            console.log(`[ClusterInstance] Task ${request.taskId} completed: ${result.success ? 'SUCCESS' : 'FAILED'}`);

            resolve({
              success: result.success !== false,
              taskId: request.taskId,
              clusterId: this.config.id,
              agentId: agent.id,
              status: result.success ? 'completed' : 'failed',
              error: result.error,
              completedAt: Date.now(),
            });
          } catch (parseError) {
            console.error(`[ClusterInstance] Parse error: ${parseError}`);
            console.error(`[ClusterInstance] Response: ${stdout.substring(0, 500)}`);

            resolve({
              success: false,
              taskId: request.taskId,
              clusterId: this.config.id,
              agentId: agent.id,
              status: 'failed',
              error: `Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
              completedAt: Date.now(),
            });
          }
        } else {
          console.error(`[ClusterInstance] Process exited with code ${code}`);
          console.error(`[ClusterInstance] stderr: ${stderr}`);

          resolve({
            success: false,
            taskId: request.taskId,
            clusterId: this.config.id,
            agentId: agent.id,
            status: 'failed',
            error: stderr || `Exit code: ${code}`,
            completedAt: Date.now(),
          });
        }
      });

      proc.on('error', (error) => {
        clearTimeout(timeout);
        console.error(`[ClusterInstance] Spawn error: ${error.message}`);

        resolve({
          success: false,
          taskId: request.taskId,
          clusterId: this.config.id,
          agentId: agent.id,
          status: 'failed',
          error: `Spawn error: ${error.message}`,
          completedAt: Date.now(),
        });
      });
    });
  }

  private getAvailableAgents(): ClusterAgentInstance[] {
    const available: ClusterAgentInstance[] = [];

    for (const agent of this.agents.values()) {
      if (!agent.busy) {
        available.push(agent);
      }
    }

    return available;
  }

  /**
   * Enqueue a task for async execution
   */
  enqueueTask(request: KrakenDelegationRequest): Promise<KrakenDelegationResult> {
    this.load.pendingTasks++;
    this.load.lastActivity = Date.now();

    return new Promise((resolve, reject) => {
      this.taskQueue.push({ request, resolve, reject });
    });
  }

  /**
   * Get current load
   */
  getLoad(): ClusterLoad {
    return {
      ...this.load,
      clusterId: this.config.id,
    };
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): ClusterAgentInstance | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents in this cluster
   */
  getAllAgents(): ClusterAgentInstance[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get cluster config
   */
  getConfig(): ClusterConfig {
    return this.config;
  }

  /**
   * Get completed tasks
   */
  getCompletedTasks(): KrakenDelegationResult[] {
    return [...this.completedTasks];
  }

  /**
   * Get failed tasks
   */
  getFailedTasks(): KrakenDelegationResult[] {
    return [...this.failedTasks];
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.taskQueue.length;
  }

  /**
   * Get output verifier for external inspection
   */
  getOutputVerifier(): OutputVerifier {
    return this.outputVerifier;
  }

  /**
   * Shutdown the cluster gracefully
   */
  async shutdown(): Promise<void> {
    this.shutdownFlag = true;

    // Wait for active tasks to complete (with timeout)
    const startTime = Date.now();
    const timeout = 5000; // 5 second timeout

    while (this.load.activeTasks > 0 && Date.now() - startTime < timeout) {
      await this.sleep(100);
    }

    // Cancel remaining queued tasks
    for (const task of this.taskQueue) {
      task.reject(new Error('Cluster shutting down'));
    }
    this.taskQueue = [];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
