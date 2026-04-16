/**
 * src/tools/route.ts
 *
 * Task routing tool - recommends which sub-agent to use for a given task.
 */

import { tool as toolFn } from '@opencode-ai/plugin';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

const RouteArgsSchema = z.object({
  task: z.string().min(1, 'Task description is required'),
});

type RouteArgs = z.infer<typeof RouteArgsSchema>;

export function createRouteTool() {
  return toolFn({
    description: `Analyze a coding task and recommend the best sub-agent to use.

INPUT: A natural language description of what you need to accomplish.
OUTPUT: Recommendation with reasoning and cost estimate.

AGENTS:
- qwen: FREE, local CLI, best for code generation and completion
- gemma: Uses Gemini API (free tier), best for documentation and boilerplate

ROUTING LOGIC:
qwen if task involves:
  - Writing or generating code
  - Code completion or cursor-style edits
  - Prototypes or scaffolding
  - Search-replace across files
  - Simple refactors

gemma if task involves:
  - Writing documentation or docstrings
  - Generating boilerplate comments
  - Explaining error messages
  - Regular expressions
  - Small transformations

BOTH might be useful for:
  - Complex tasks (qwen for code, gemma for docs)
  - When qwen fails and you need an alternative

COST: Always free to call this routing tool.`,
    args: {
      task: RouteArgsSchema.shape.task,
    },
    execute: async (args: RouteArgs): Promise<string> => {
      const { task } = args;
      const lowerTask = task.toLowerCase();

      logger.info('Routing task', { task: task.slice(0, 100) });

      // Keywords that strongly suggest qwen
      const qwenKeywords = [
        'write code', 'generate code', 'code completion', 'complete this',
        'implement', 'function', 'class', 'refactor', 'scaffold',
        'prototype', 'search and replace', 'search-replace', 'edit file',
        'cursor', 'autocomplete', 'snippet', 'stub', 'test file',
        'add method', 'add function', 'create component',
      ];

      // Keywords that strongly suggest gemma
      const gemmaKeywords = [
        'documentation', 'docstring', 'comment', 'readme', 'explain this',
        'what does', 'how does', 'regex', 'regular expression',
        'transform', 'parse', 'boilerplate', 'template',
      ];

      // Keywords that suggest NOT to use an agent
      const complexKeywords = [
        'architecture', 'design system', 'multi-file', 'migration',
        'complex', 'debug this bug', 'fix race condition',
      ];

      const qwenScore = qwenKeywords.filter(k => lowerTask.includes(k)).length;
      const gemmaScore = gemmaKeywords.filter(k => lowerTask.includes(k)).length;

      let recommendation: string;
      let reasoning: string;
      let cost: string;
      let confidence: 'high' | 'medium' | 'low';

      if (complexKeywords.some(k => lowerTask.includes(k))) {
        recommendation = 'qwen + gemma';
        reasoning = 'Complex task may benefit from qwen for code generation and gemma for documentation. Consider breaking into smaller subtasks.';
        cost = 'free + free';
        confidence = 'low';
      } else if (qwenScore > gemmaScore) {
        recommendation = 'qwen';
        reasoning = `Task matches qwen strengths (code generation, completion). ${qwenScore >= 2 ? 'High confidence.' : 'Medium confidence.'}`;
        cost = 'free';
        confidence = qwenScore >= 2 ? 'high' : 'medium';
      } else if (gemmaScore > 0) {
        recommendation = 'gemma';
        reasoning = `Task involves documentation, comments, or text generation — gemma's strengths.`;
        cost = 'free';
        confidence = 'high';
      } else if (qwenScore === 0 && gemmaScore === 0) {
        // Default to qwen for unknown tasks
        recommendation = 'qwen';
        reasoning = 'Default to qwen for code generation tasks. Switch to gemma if you need documentation.';
        cost = 'free';
        confidence = 'low';
      } else {
        recommendation = 'qwen';
        reasoning = 'Tasks with mixed needs: try qwen first, then gemma for any documentation.';
        cost = 'free';
        confidence = 'medium';
      }

      const result = {
        recommended: recommendation,
        reasoning,
        estimated_cost: cost,
        confidence,
        tip: confidence === 'low' ? 'Consider trying both and comparing results.' : undefined,
      };

      logger.info('Routing result', result);

      return JSON.stringify(result, null, 2);
    },
  });
}
