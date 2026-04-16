/**
 * Hook Registration - V2.0
 * 
 * Registers all hooks for Kraken V2.0:
 * - event: Session lifecycle (session.created, session.compacting)
 * - chat.message: Message enforcement (Layer 2)
 * - tool.execute.before: Tool enforcement (Layer 1)
 * - tool.execute.after: Gate evaluation
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Hooks } from '@opencode-ai/plugin';
import { createSystemBrain, getSystemBrain } from '../brains/system/system-brain.js';
import { createExecutionBrain, getExecutionBrain } from '../brains/execution/execution-brain.js';
import { createPlanningBrain, getPlanningBrain } from '../brains/planning/planning-brain.js';
import { CouncilCoordinator } from '../brains/council/roundtable-council.js';

export { getSystemBrain, createSystemBrain };
export { getExecutionBrain, createExecutionBrain };
export { getPlanningBrain, createPlanningBrain };

const LAUNCHPAD_PATH = path.join(process.cwd(), 'CONTEXT', 'LAUNCHPAD.md');
const COMPACTION_CONTEXT_DIR = path.join(process.cwd(), '.kraken-compaction');

let council: CouncilCoordinator | null = null;

export function getCouncil(): CouncilCoordinator {
  if (!council) {
    council = new CouncilCoordinator();
  }
  return council;
}

// ============================================================================
// SESSION LIFECYCLE HOOK (event hook for session.created, session.compacting)
// ============================================================================

export function createEventHook(): Hooks['event'] {
  return async ({ event }) => {
    // Handle session.created - initialize brains and check for recovery
    if (event.type === 'session.created') {
      console.log('[Kraken] Session created, initializing brains...');
      
      const systemBrain = createSystemBrain();
      systemBrain.initialize();
      
      const executionBrain = createExecutionBrain();
      executionBrain.initialize();
      
      const planningBrain = createPlanningBrain();
      planningBrain.initialize();
      
      const c = getCouncil();
      c.initialize();
      
      console.log('[Kraken] All brains initialized');
      
      // Check for compaction recovery data
      const recoveryPath = path.join(COMPACTION_CONTEXT_DIR, 'LATEST', 'INJECTION.md');
      if (fs.existsSync(recoveryPath)) {
        const recoveryContent = fs.readFileSync(recoveryPath, 'utf-8');
        console.log('[Kraken] Compaction recovery file found, context restored');
        console.log(`[Kraken] Recovery file size: ${recoveryContent.length} chars`);
      }
      
      return;
    }
    
    // Handle session.compacting - inject context into compaction prompt
    if (event.type === 'session.compacting') {
      console.log('[Kraken] Session compacting, preparing context...');
      
      const systemBrain = getSystemBrain();
      if (!systemBrain.isInitialized()) {
        console.log('[Kraken] SystemBrain not initialized, skipping context injection');
        return;
      }
      
      // Read the launchpad file for current context
      let launchpadContent = '';
      if (fs.existsSync(LAUNCHPAD_PATH)) {
        launchpadContent = fs.readFileSync(LAUNCHPAD_PATH, 'utf-8');
        console.log(`[Kraken] Launchpad loaded: ${launchpadContent.length} chars`);
      }
      
      // Get recent decisions and brain state
      const recentDecisions = systemBrain.getRecentDecisionPoints();
      const currentGate = systemBrain.getCurrentGate();
      const completedTasks = systemBrain.getCompletedTasks();
      const activeTask = systemBrain.getActiveTask();
      
      // Build context string to inject
      const compactionContext = buildCompactionContext({
        launchpadContent,
        recentDecisions,
        currentGate,
        completedTasks,
        activeTask,
        sessionId: (event.properties as { sessionId?: string })?.sessionId || 'unknown'
      });
      
      // Write to compaction context file for retrieval
      const contextDir = path.join(COMPACTION_CONTEXT_DIR, 'LATEST');
      fs.mkdirSync(contextDir, { recursive: true });
      fs.writeFileSync(path.join(contextDir, 'INJECTION.md'), compactionContext);
      fs.writeFileSync(path.join(contextDir, 'LAUNCHPAD.md'), launchpadContent);
      
      console.log('[Kraken] Compaction context written to:', contextDir);
      console.log(`[Kraken] Context includes: ${recentDecisions.length} decisions, gate=${currentGate}`);
      
      return;
    }
  };
}

interface CompactionContextParams {
  launchpadContent: string;
  recentDecisions: { description: string; type: string; contextFiles: string[] }[];
  currentGate: string;
  completedTasks: string[];
  activeTask: string;
  sessionId: string;
}

function buildCompactionContext(params: CompactionContextParams): string {
  const { launchpadContent, recentDecisions, currentGate, completedTasks, activeTask, sessionId } = params;
  
  return `
================================================================================
KRAKEN V2.0 — COMPACTION CONTEXT INJECTION
================================================================================

**Session:** ${sessionId}
**Timestamp:** ${new Date().toISOString()}
**Gate:** ${currentGate}

---

## CURRENT MISSION

${launchpadContent.split('## CURRENT MISSION')[1]?.split('---')[0]?.trim() || 'Building Kraken V2.0 multi-brain orchestrator'}

---

## RECENT DECISIONS (${recentDecisions.length})

${recentDecisions.slice(0, 10).map((d, i) => 
  `${i + 1}. [${d.type}] ${d.description}`
).join('\n')}

---

## TASK STATE

**Active Task:** ${activeTask || 'None'}
**Completed Tasks:** ${completedTasks.length > 0 ? completedTasks.join(', ') : 'None'}

---

## STREAM ANCHOR

Current phase: BUILD
Current gate: ${currentGate}
Active task: ${activeTask || 'None'}

**Next immediate action:** Continue from where we left off in the Kraken V2.0 build.
Read the LAUNCHPAD.md file for full context.

================================================================================
`;
}

// ============================================================================
// CHAT MESSAGE HOOK (Layer 2 - Message Enforcement)
// ============================================================================

export function createChatMessageHook(): Hooks['chat.message'] {
  return async (input, output) => {
    const { message, agent } = input as { message: string; agent?: string };
    
    // IDENTITY WALL: Only process if this is Kraken's agent
    if (agent !== 'kraken') {
      return; // Not Kraken's message, don't touch
    }
    
    const systemBrain = getSystemBrain();
    if (!systemBrain.isInitialized()) return;
    
    // Layer 2: Message enforcement
    try {
      systemBrain.checkMessage(message);
    } catch (error) {
      console.error(`[Kraken] Message blocked: ${error}`);
      throw error;
    }
  };
}

// ============================================================================
// TOOL GUARDIAN HOOK (Layer 1 - Tool Enforcement)
// ============================================================================

export function createToolGuardianHook(): Hooks['tool.execute.before'] {
  return async (input, output) => {
    const { tool } = input as { tool: string };
    const args = output?.args as Record<string, unknown> || {};
    
    const systemBrain = getSystemBrain();
    if (!systemBrain.isInitialized()) return;
    
    // Layer 1: Tool enforcement
    try {
      systemBrain.checkTool(tool, args);
    } catch (error) {
      console.error(`[Kraken] Tool blocked: ${error}`);
      throw error;
    }
  };
}

// ============================================================================
// TOOL OUTPUT SUMMARIZER
// Summarizes large tool outputs to prevent token bloat
// ============================================================================

const TOOL_SUMMARIZE_THRESHOLD = 5000;
const TOOL_SUMMARIZE_MAX_OUTPUT = 500;

function summarizeToolOutput(tool: string, output: unknown): { original: string; summarized: string; wasSummarized: boolean } {
  const outputStr = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
  
  if (outputStr.length < TOOL_SUMMARIZE_THRESHOLD) {
    return { original: outputStr, summarized: outputStr, wasSummarized: false };
  }
  
  const lines = outputStr.split('\n');
  const firstLines = lines.slice(0, 30).join('\n');
  const summary = `[TOOL: ${tool}] OUTPUT SUMMARIZED: ${outputStr.length} chars → ${TOOL_SUMMARIZE_MAX_OUTPUT} chars max. First ${Math.min(30, lines.length)} lines:\n${firstLines}\n... [${lines.length - 30} more lines truncated by Kraken Tool Guardian]`;
  
  return { original: outputStr, summarized: summary, wasSummarized: true };
}

// ============================================================================
// GATE HOOK (Post-tool execution with summarization)
// ============================================================================

export function createGateHook(): Hooks['tool.execute.after'] {
  return async (input, output) => {
    const systemBrain = getSystemBrain();
    if (!systemBrain.isInitialized()) return;
    
    // Tool summarization - summarize large outputs
    const toolResult = output?.result;
    const tool = (input as { tool?: string })?.tool || 'unknown';
    
    if (toolResult) {
      const { summarized, wasSummarized, original } = summarizeToolOutput(tool, toolResult);
      if (wasSummarized) {
        console.log(`[Kraken] Tool summarization: ${tool} output ${original.length} → ${summarized.length} chars`);
        output.result = summarized;
      }
    }
    
    // Gate evaluation
    const currentGate = systemBrain.getCurrentGate();
    const result = systemBrain.evaluateGateEntry(currentGate);
    
    if (result.allPassed) {
      console.log(`[Kraken] Gate ${currentGate} criteria met, ready to advance`);
    }
  };
}

// ============================================================================
// COMPACTION HOOK - writes to FILE only, NOT to output.context
// NOTE: output.context causes 100K token bloat. Compaction should write to FILE.
// ============================================================================

export function createCompactionHook(): Hooks['event'] {
  return async ({ event }) => {
    if (event.type !== 'session.compacting') return;
    
    const { sessionID } = event.properties as { sessionID?: string };
    const sessionId = sessionID || 'unknown';
    
    console.log('[Kraken] Compaction hook fired for session:', sessionId);
    
    const systemBrain = getSystemBrain();
    if (!systemBrain.isInitialized()) {
      console.log('[Kraken] SystemBrain not initialized');
      return;
    }
    
    // Build context to inject into compaction prompt
    const recentDecisions = systemBrain.getRecentDecisionPoints();
    const currentGate = systemBrain.getCurrentGate();
    const completedTasks = systemBrain.getCompletedTasks();
    const activeTask = systemBrain.getActiveTask();
    
    // Read launchpad
    let launchpadContent = '';
    if (fs.existsSync(LAUNCHPAD_PATH)) {
      launchpadContent = fs.readFileSync(LAUNCHPAD_PATH, 'utf-8');
    }
    
    // Build the context string
    const contextStr = buildCompactionContext({
      launchpadContent,
      recentDecisions,
      currentGate,
      completedTasks,
      activeTask,
      sessionId: sessionId
    });
    
    // Write to FILE only for session.created recovery (NOT to output.context)
    const contextDir = path.join(COMPACTION_CONTEXT_DIR, sessionId);
    fs.mkdirSync(contextDir, { recursive: true });
    fs.writeFileSync(path.join(contextDir, 'INJECTION.md'), contextStr);
    
    console.log('[Kraken] Compaction context written to FILE only (not output.context)');
    console.log(`[Kraken] Decisions captured: ${recentDecisions.length}`);
  };
}

// ============================================================================
// LEGACY SESSION CREATED HOOK (if needed)
// ============================================================================

export function createSessionHook(): Hooks['event'] {
  return createEventHook();
}
