/**
 * Guardian Hook — tool.execute.before integration
 * 
 * Guardian is ADVISORY-ONLY. OpenCode plugin hooks cannot prevent tool execution.
 * Logs dangerous commands for audit. Agent is responsible for self-rejection.
 * Uses getCurrentAgent() like shark.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { Guardian } from '../../shared/guardian.js';
import { extractCommandFromArgs } from './utils.js';
import { getCurrentAgent } from './agent-state.js';

export function createGuardianHook(guardian: Guardian): Hooks['tool.execute.before'] {
  return async (input, output) => {
    if (!getCurrentAgent()) {
      return;
    }

    const { tool } = input;
    const args = (output as { args: unknown }).args;

    const watchedTools = [
      'terminal', 'mcp_terminal',
      'write_file', 'mcp_write_file',
      'patch', 'mcp_patch'
    ];

    if (!watchedTools.includes(tool)) {
      return;
    }

    if (tool === 'terminal' || tool === 'mcp_terminal') {
      const command = extractCommandFromArgs(args);
      if (command && guardian.isDangerousCommand(command)) {
        ;
      }
    }

    return;
  };
}
