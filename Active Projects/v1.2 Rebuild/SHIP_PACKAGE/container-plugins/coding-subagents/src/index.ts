/**
 * src/index.ts
 *
 * Coding Subagents - OpenCode Plugin Entry Point
 *
 * Two specialized coding agents:
 * - gemma: Code review, debugging, test engineering (Gemma-4-31b-it)
 * - qwen: Natural language to code, prototyping, fast builds (Qwen Code CLI)
 */

import type { Hooks } from '@opencode-ai/plugin';
import { createToolRegistry } from './tools/index.js';
import { logger } from './utils/logger.js';

const PLUGIN_NAME = 'CodingSubagents';
const PLUGIN_VERSION = '1.0.0';

export default async function CodingSubagents(): Promise<Hooks> {
  logger.info(`${PLUGIN_NAME} v${PLUGIN_VERSION} initializing`);

  const tools = createToolRegistry();

  logger.info(`${PLUGIN_NAME} initialized`, {
    toolCount: Object.keys(tools).length,
    tools: Object.keys(tools),
    route: 'task routing - use when unsure which sub-agent to use',
    gemma: 'gemma-4-31b-it (documentation, boilerplate, explanations)',
    qwen: 'qwen3-coder (code completion, prototypes, free)',
  });

  return {
    tool: tools,
  };
}
