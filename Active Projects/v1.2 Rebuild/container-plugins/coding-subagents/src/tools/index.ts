/**
 * src/tools/index.ts
 *
 * Tool registry - exports all CLI tools.
 */

import { createGemmaTool } from './gemma.js';
import { createQwenTool } from './qwen.js';
import { createRouteTool } from './route.js';

export { createGemmaTool, createQwenTool, createRouteTool };

export function createToolRegistry() {
  return {
    route: createRouteTool(),
    gemma: createGemmaTool(),
    qwen: createQwenTool(),
  };
}
