/**
 * src/utils/parse.ts
 *
 * JSON output parser for CLI tool responses.
 */

import { ERROR_CODES } from '../tools/types.js';

export interface ParseResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export function parseJsonOutput<T = unknown>(output: string): ParseResult<T> {
  const trimmed = output.trim();

  if (!trimmed) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.PARSE_ERROR,
        message: 'Empty output received',
      },
    };
  }

  try {
    const data = JSON.parse(trimmed) as T;
    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: ERROR_CODES.PARSE_ERROR,
        message: `Failed to parse JSON: ${message}`,
      },
    };
  }
}
