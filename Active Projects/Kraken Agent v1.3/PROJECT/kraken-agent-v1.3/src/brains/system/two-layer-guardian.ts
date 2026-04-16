/**
 * Two-Layer Guardian - V2.0
 * 
 * KEY INNOVATION: Tool enforcement + Message enforcement
 * 
 * Problem from Shark Agent v4.8.3:
 * - Guardian fires on tool.execute.before only
 * - opencode run sends MESSAGES to agents
 * - Agents interpret messages and respond naturally
 * - Guardian never fires on message interpretation
 * 
 * Solution: Two-Layer enforcement
 * - Layer 1: tool.execute.before (existing)
 * - Layer 2: chat.message (NEW)
 */

import type { Hooks } from '@opencode-ai/plugin';

// ============================================================================
// PATTERN DEFINITIONS - TOOL LAYER (Layer 1)
// ============================================================================

const DANGEROUS_TOOLS = new Set([
  'terminal', 'mcp_terminal',
  'write_file', 'mcp_write_file',
  'patch', 'mcp_patch',
  'edit', 'mcp_edit',
  'delete_file', 'mcp_delete_file'
]);

const THEATRICAL_PATTERNS = [
  /\|.*wc\s+-l/i,
  /wc\s+-l.*\|/i,
  /cat.*\|.*wc/i,
  /grep.*\|.*wc/i,
  /\|.*tee/i,
  /\|.*>.*\./i,
  /wc\s+-l.*dist\//i,
  /wc\s+-l.*src\//i,
  /wc\s+-l.*build\//i,
];

const LEGITIMATE_PATTERNS = [
  /mkdir\s+-p/i,
  /cp\s+-r/i,
  /mv\s+/i,
  /cat\s+[^\|>]+$/i,
  /head\s+-[0-9]+\s+/i,
  /tail\s+-[0-9]+\s+/i,
  /grep\s+-[rEn]+.*[^\|]$/i,
  /find\s+.*-name/i,
  /test\s+-d/i,
  /test\s+-x/i,
];

const FAKE_TEST_PATTERNS = [
  /node\s+run-tests?\.js/i,
  /node\s+verify.*\.mjs/i,
  /npm\s+test/i,
  /yarn\s+test/i,
  /jest/i,
  /vitest/i,
  /mocha/i,
  /jasmine/i,
  /bun\s+test/i,
];

const WRONG_CONTAINER_PATTERNS = [
  /opencode\s+container\s+run/i,
  /opencode\s+container\s+start/i,
  /opencode\s+container\s+exec/i,
];

// ============================================================================
// PATTERN DEFINITIONS - MESSAGE LAYER (Layer 2) - V2.0 NEW
// ============================================================================

const THEATRICAL_MESSAGE_PATTERNS = [
  /just\s+grep/i,
  /grep.*\|.*wc/i,
  /count.*lines/i,
  /wc\s+-l/i,
  /I'll.*count/i,
  /let.*me.*grep.*wc/i,
];

const FAKE_COMPLETION_MESSAGE_PATTERNS = [
  /task.*complete/i,
  /done.*already/i,
  /finished.*it/i,
  /build.*passed/i,
  /tests.*pass/i,
  /no.*issues/i,
  /all.*good/i,
  /it.*works.*trust.*me/i,
];

const HOST_FALLBACK_MESSAGE_PATTERNS = [
  /host.*works/i,
  /skip.*container/i,
  /don't.*need.*container/i,
  /local.*fine/i,
  /already.*tested.*locally/i,
  /container.*not.*necessary/i,
];

const SUCCESS_CLAIM_MESSAGE_PATTERNS = [
  /it's.*working/i,
  /trust.*me/i,
  /believe.*me/i,
  /works.*fine/i,
  /no.*problem/i,
  /should.*be.*good/i,
  /obviously.*correct/i,
];

const IMPATIENCE_MESSAGE_PATTERNS = [
  /just.*ship.*it/i,
  /let's.*move.*on/i,
  /good.*enough/i,
  /close.*enough/i,
  /ship.*it/i,
  /fuck.*it/i,
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isTheatrical(command: string): boolean {
  return THEATRICAL_PATTERNS.some(p => p.test(command)) &&
    !LEGITIMATE_PATTERNS.some(p => p.test(command));
}

function classifyMessageIntent(message: string): {
  category: string;
  confidence: number;
  shouldBlock: boolean;
  matchedPatterns: string[];
} {
  const matchedPatterns: string[] = [];
  
  const patterns = [
    { name: 'THEATRICAL', patterns: THEATRICAL_MESSAGE_PATTERNS },
    { name: 'FAKE_COMPLETION', patterns: FAKE_COMPLETION_MESSAGE_PATTERNS },
    { name: 'HOST_FALLBACK', patterns: HOST_FALLBACK_MESSAGE_PATTERNS },
    { name: 'SUCCESS_CLAIM', patterns: SUCCESS_CLAIM_MESSAGE_PATTERNS },
    { name: 'IMPATIENCE', patterns: IMPATIENCE_MESSAGE_PATTERNS },
  ];
  
  for (const { name, patterns: pts } of patterns) {
    for (const p of pts) {
      if (p.test(message)) {
        matchedPatterns.push(`${name}: ${p}`);
      }
    }
  }
  
  // Block if ANY dangerous pattern matched
  const shouldBlock = matchedPatterns.length > 0;
  
  return {
    category: shouldBlock ? 'DERAILMENT' : 'LEGITIMATE',
    confidence: matchedPatterns.length > 0 ? 1.0 : 0,
    shouldBlock,
    matchedPatterns,
  };
}

// ============================================================================
// LAYER 1: TOOL ENFORCEMENT
// ============================================================================

interface CheckResult {
  blocked: boolean;
  layer: 'TOOL' | 'MESSAGE';
  reason?: string;
  pattern?: string;
}

function checkToolLayer(
  tool: string,
  args: Record<string, unknown>
): CheckResult {
  // L0: Identity wall - dangerous tools (ALWAYS BLOCK)
  if (DANGEROUS_TOOLS.has(tool)) {
    return {
      blocked: true,
      layer: 'TOOL',
      reason: `L0: Dangerous tool '${tool}' blocked - requires explicit override`,
      pattern: 'DANGEROUS_TOOLS',
    };
  }
  
  // L1: Theatrical verification
  const command = extractCommand(args);
  if (command && tool === 'terminal') {
    if (isTheatrical(command)) {
      return {
        blocked: true,
        layer: 'TOOL',
        reason: 'L1: Theatrical verification - counting theater blocked',
        pattern: 'grep | wc pattern',
      };
    }
  }
  
  // L2: Fake test runner
  if (command && FAKE_TEST_PATTERNS.some(p => p.test(command))) {
    return {
      blocked: true,
      layer: 'TOOL',
      reason: 'L2: Fake test runner - test frameworks must run through OpenCode',
      pattern: 'jest/vitest/npm test',
    };
  }
  
  // L4: Wrong container
  if (command && WRONG_CONTAINER_PATTERNS.some(p => p.test(command))) {
    return {
      blocked: true,
      layer: 'TOOL',
      reason: 'L4: Wrong container - hallucinated opencode container commands',
      pattern: 'opencode container',
    };
  }
  
  return { blocked: false, layer: 'TOOL' };
}

// ============================================================================
// LAYER 2: MESSAGE ENFORCEMENT (V2.0 NEW)
// ============================================================================

function checkMessageLayer(message: string): CheckResult {
  const intent = classifyMessageIntent(message);
  
  if (intent.shouldBlock) {
    return {
      blocked: true,
      layer: 'MESSAGE',
      reason: `L8: Message derailment detected (${intent.category})`,
      pattern: `confidence: ${intent.confidence.toFixed(2)}`,
    };
  }
  
  return { blocked: false, layer: 'MESSAGE' };
}

function extractCommand(args: Record<string, unknown>): string | null {
  if (typeof args.command === 'string') return args.command;
  if (typeof args.cmd === 'string') return args.cmd;
  return null;
}

// ============================================================================
// TWO-LAYER GUARDIAN
// ============================================================================

export class TwoLayerGuardian {
  private initialized = false;
  
  initialize(): void {
    this.initialized = true;
  }
  
  isInitialized(): boolean {
    return this.initialized;
  }
  
  checkTool(tool: string, args: Record<string, unknown>): CheckResult {
    if (!this.initialized) {
      return { blocked: false, layer: 'TOOL' };
    }
    return checkToolLayer(tool, args);
  }
  
  checkMessage(message: string): CheckResult {
    if (!this.initialized) {
      return { blocked: false, layer: 'MESSAGE' };
    }
    return checkMessageLayer(message);
  }
  
  check(input: { tool?: string; args?: Record<string, unknown>; message?: string }): CheckResult {
    if (input.message !== undefined) {
      return this.checkMessage(input.message);
    }
    if (input.tool !== undefined) {
      return this.checkTool(input.tool, input.args || {});
    }
    return { blocked: false, layer: 'TOOL' };
  }
}

// ============================================================================
// HOOK FACTORIES
// ============================================================================

export function createToolGuardianHook(
  guardian: TwoLayerGuardian
): Hooks['tool.execute.before'] {
  return async (input) => {
    const { tool } = input;
    const args = (input as { args?: Record<string, unknown> }).args || {};
    
    const result = guardian.checkTool(tool, args);
    
    if (result.blocked) {
      throw new Error(`[TWO-LAYER-GUARDIAN] ${result.reason}`);
    }
  };
}

export function createMessageGuardianHook(
  guardian: TwoLayerGuardian
): Hooks['chat.message'] {
  return async (input) => {
    const { message } = input as { message: string; agent?: string };
    
    // Check ALL messages for dangerous intent
    // (Disabled for testing - enable for production)
    const result = guardian.checkMessage(message);
    
    if (result.blocked) {
      throw new Error(`[TWO-LAYER-GUARDIAN] ${result.reason}`);
    }
  };
}
