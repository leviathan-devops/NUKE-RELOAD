/**
 * src/tools/qwen.ts
 *
 * Qwen Code CLI - natural language to code, prototyping, fast builds.
 */

import { tool as toolFn } from '@opencode-ai/plugin';
import { QwenArgsSchema, ERROR_CODES, type QwenArgs, type QwenResult } from './types.js';
import { invokeCli } from '../utils/cli.js';
import { parseJsonOutput } from '../utils/parse.js';
import { logger } from '../utils/logger.js';

export function createQwenTool() {
  return toolFn({
    description: `Qwen Code CLI for code completion, cursor-style edits, and fast code generation.

USE FOR:
- Code completion and cursor-style edits
- Generating code from natural language descriptions
- Quick prototypes and scaffolding
- Writing code stubs and test foundations
- Search-replace across files
- Simple refactors (under 100 lines)

DO NOT USE FOR:
- Writing documentation or docstrings (use gemma)
- Explaining code or architecture decisions
- Complex multi-file refactoring

COST: FREE (local CLI, no API calls)
SPEED: Instant (~1-5 seconds)
STRENGTHS: Excellent code completion, follows file context, autonomous execution

ROUTING: Always try qwen FIRST for any code generation task. It's free and fast. Use gemma for documentation or when qwen produces poor output.`,
    args: {
      prompt: QwenArgsSchema.shape.prompt,
      yolo: QwenArgsSchema.shape.yolo.optional(),
      model: QwenArgsSchema.shape.model.optional(),
      outputFormat: QwenArgsSchema.shape.outputFormat.optional(),
      timeout: QwenArgsSchema.shape.timeout.optional(),
    },
    execute: async (args: Partial<QwenArgs>): Promise<string> => {
      const parsed = QwenArgsSchema.safeParse(args);
      if (!parsed.success) {
        const result: QwenResult = {
          success: false,
          error: {
            code: ERROR_CODES.INVALID_ARGS,
            message: parsed.error.issues.map((e: any) => e.message).join(', '),
          },
          metadata: { model: args.model ?? 'qwen3-coder' },
        };
        return JSON.stringify(result);
      }

      const { prompt, yolo, model, outputFormat, timeout } = parsed.data;

      const cliArgs: string[] = ['-p', prompt];
      if (yolo) cliArgs.push('--yolo');
      if (model !== 'qwen3-coder') cliArgs.push('-m', model);
      if (outputFormat === 'json') cliArgs.push('--output-format', 'json');

      logger.info('Invoking Qwen CLI', { model, yolo, timeout });

      const cliResult = await invokeCli({
        command: 'qwen',
        args: cliArgs,
        timeoutMs: timeout * 1000,
      });

      if (cliResult.error) {
        const result: QwenResult = {
          success: false,
          error: cliResult.error,
          metadata: { model },
        };
        return JSON.stringify(result);
      }

      if (outputFormat === 'json') {
        const parsed_output = parseJsonOutput(cliResult.stdout);
        if (!parsed_output.success) {
          const result: QwenResult = {
            success: false,
            error: parsed_output.error,
            metadata: { model },
          };
          return JSON.stringify(result);
        }
        const result: QwenResult = {
          success: true,
          response: parsed_output.data as string | Record<string, unknown>,
          metadata: { model },
        };
        return JSON.stringify(result);
      }

      const result: QwenResult = {
        success: true,
        response: cliResult.stdout,
        metadata: { model },
      };
      return JSON.stringify(result);
    },
  });
}
