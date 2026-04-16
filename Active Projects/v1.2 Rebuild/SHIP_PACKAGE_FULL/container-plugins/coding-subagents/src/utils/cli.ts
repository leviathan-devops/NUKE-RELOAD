/**
 * src/utils/cli.ts
 *
 * Generic CLI invocation wrapper using child_process.spawn.
 * Used for Qwen CLI.
 */

import { spawn } from 'child_process';
import { ERROR_CODES, type ErrorCode } from '../tools/types.js';

export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: { code: ErrorCode; message: string };
}

export interface InvokeCliOptions {
  command: string;
  args: string[];
  timeoutMs: number;
  cwd?: string;
}

export function invokeCli(options: InvokeCliOptions): Promise<CliResult> {
  return new Promise((resolve) => {
    const { command, args, timeoutMs, cwd } = options;

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const proc = spawn(command, args, {
      cwd,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGTERM');
      setTimeout(() => {
        if (!proc.killed) proc.kill('SIGKILL');
      }, 2000);
    }, timeoutMs);

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err: Error) => {
      clearTimeout(timeout);
      resolve({
        stdout,
        stderr,
        exitCode: null,
        error: {
          code: ERROR_CODES.INVOCATION_ERROR,
          message: `Failed to spawn ${command}: ${err.message}`,
        },
      });
    });

    proc.on('close', (code: number | null) => {
      clearTimeout(timeout);

      if (timedOut) {
        resolve({
          stdout,
          stderr,
          exitCode: null,
          error: {
            code: ERROR_CODES.TIMEOUT,
            message: `${command} did not complete within ${timeoutMs}ms`,
          },
        });
        return;
      }

      if (code !== 0) {
        resolve({
          stdout,
          stderr,
          exitCode: code,
          error: {
            code: ERROR_CODES.CLI_ERROR,
            message: `${command} exited with code ${code}: ${stderr.trim()}`,
          },
        });
        return;
      }

      resolve({ stdout, stderr, exitCode: code });
    });
  });
}
