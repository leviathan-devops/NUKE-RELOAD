/**
 * src/tools/types.ts
 *
 * Zod schemas and TypeScript types for Gemma and Qwen CLI tools.
 */

import { z } from 'zod';

// ─── Error Codes ──────────────────────────────────────────────────────────────

export const ERROR_CODES = {
  TIMEOUT: 'TIMEOUT',
  CLI_ERROR: 'CLI_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  INVALID_ARGS: 'INVALID_ARGS',
  INVOCATION_ERROR: 'INVOCATION_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ─── Shared Types ─────────────────────────────────────────────────────────────

export const OutputFormatSchema = z.enum(['json', 'text']);
export type OutputFormat = z.infer<typeof OutputFormatSchema>;

export const CliErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});
export type CliError = z.infer<typeof CliErrorSchema>;

export const CliMetadataSchema = z.object({
  model: z.string(),
  tokensUsed: z.number().optional(),
  reqCount: z.number().optional(),
  remaining: z.number().optional(),
});
export type CliMetadata = z.infer<typeof CliMetadataSchema>;

// ─── Gemma (Gemini Proxy) ─────────────────────────────────────────────────────
// Gemma-4-31b-it - code review, debugging, test engineering, production verification

export const GemmaArgsSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.enum([
        'gemma-4-31b-it',
        'gemma-4-26b-a4b-it',
        'gemma-3-4b-it',
        'gemma-3-12b-it',
        'gemma-3-27b-it',
      ]).default('gemma-4-31b-it'),
  outputFormat: OutputFormatSchema.default('json'),
  timeout: z.number().min(1).max(600).default(120),
});
export type GemmaArgs = z.infer<typeof GemmaArgsSchema>;

export const GemmaResultSchema = z.object({
  success: z.boolean(),
  response: z.union([z.string(), z.object({}).passthrough()]).optional(),
  error: CliErrorSchema.optional(),
  metadata: CliMetadataSchema,
});
export type GemmaResult = z.infer<typeof GemmaResultSchema>;

// ─── Qwen ─────────────────────────────────────────────────────────────────────
// Natural language to code, prototyping, fast builds

export const QwenArgsSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  yolo: z.boolean().default(false),
  model: z.string().default('qwen3-coder'),
  outputFormat: OutputFormatSchema.default('json'),
  timeout: z.number().min(1).max(600).default(120),
});
export type QwenArgs = z.infer<typeof QwenArgsSchema>;

export const QwenResultSchema = z.object({
  success: z.boolean(),
  response: z.union([z.string(), z.object({}).passthrough()]).optional(),
  error: CliErrorSchema.optional(),
  metadata: CliMetadataSchema,
});
export type QwenResult = z.infer<typeof QwenResultSchema>;
