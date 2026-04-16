/**
 * src/tools/gemma.ts
 *
 * Gemma-4-31b-it via shark-gemini-proxy.
 * Best for: code review, debugging, test engineering, production verification.
 */

import { tool as toolFn } from '@opencode-ai/plugin';
import { GemmaArgsSchema, ERROR_CODES, type GemmaArgs, type GemmaResult } from './types.js';
import { logger } from '../utils/logger.js';
import https from 'https';

const API_KEY = 'AIzaSyCdzysjAXh0vmzn4vOKuMSWx1dGIjP44Z4';

export function createGemmaTool() {
  return toolFn({
    description: `Gemma-4-31b-it code generation and documentation specialist.

USE FOR:
- Writing docstrings, comments, and documentation
- Generating code boilerplate and scaffolding
- Simple to moderate code generation tasks (under 200 lines)
- Explaining error messages or tracebacks
- Writing regular expressions or simple transforms
- Refactoring small functions

DO NOT USE FOR:
- Complex debugging requiring deep context
- Multi-file architectural changes
- Writing tests from scratch (delegate to qwen instead)

COST: Uses your Gemini API key (free tier, 1500 RPM via shark-gemini-proxy)
SPEED: Fast, ~5-15 seconds for typical prompts
STRENGTHS: Excellent at following instructions, good documentation output

ROUTING: Try qwen first for code completion tasks. Use gemma when qwen fails or for documentation-heavy tasks.`,
    args: {
      prompt: GemmaArgsSchema.shape.prompt,
      model: GemmaArgsSchema.shape.model.optional(),
      outputFormat: GemmaArgsSchema.shape.outputFormat.optional(),
      timeout: GemmaArgsSchema.shape.timeout.optional(),
    },
    execute: async (args: Partial<GemmaArgs>): Promise<string> => {
      const parsed = GemmaArgsSchema.safeParse(args);
      if (!parsed.success) {
        const result: GemmaResult = {
          success: false,
          error: {
            code: ERROR_CODES.INVALID_ARGS,
            message: parsed.error.issues.map((e: any) => e.message).join(', '),
          },
          metadata: { model: args.model ?? 'gemma-4-31b-it' },
        };
        return JSON.stringify(result);
      }

      const { prompt, model, outputFormat, timeout } = parsed.data;
      const timeoutMs = timeout * 1000;

      logger.info('Invoking Gemma via proxy', { model, timeoutMs });

      try {
        const response = await callProxy({
          model: `${model}:generateContent`,
          prompt,
          timeoutMs,
        });

        if (outputFormat === 'json') {
          const result: GemmaResult = {
            success: true,
            response,
            metadata: { model },
          };
          return JSON.stringify(result);
        }

        const result: GemmaResult = {
          success: true,
          response: typeof response === 'string' ? response : JSON.stringify(response),
          metadata: { model },
        };
        return JSON.stringify(result);
      } catch (err: any) {
        const result: GemmaResult = {
          success: false,
          error: {
            code: ERROR_CODES.INVOCATION_ERROR,
            message: err.message,
          },
          metadata: { model },
        };
        return JSON.stringify(result);
      }
    },
  });
}

function callProxy(options: { model: string; prompt: string; timeoutMs: number }): Promise<any> {
  return new Promise((resolve, reject) => {
    const { model, prompt, timeoutMs } = options;

    const postData = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    });

    const modelPath = model.replace(':generateContent', '');
    const fullPath = `/v1beta/models/${modelPath}:generateContent?key=${API_KEY}`;

    const req = https.request(
      {
        hostname: 'shark-gemini-proxy-production.up.railway.app',
        path: fullPath,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'x-goog-api-key': API_KEY,
        },
        timeout: timeoutMs,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              reject(new Error(json.error.message || JSON.stringify(json.error)));
              return;
            }
            // Extract text from response
            const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
            resolve(text || data);
          } catch {
            reject(new Error(`Failed to parse response: ${data.slice(0, 200)}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    });

    req.write(postData);
    req.end();
  });
}
