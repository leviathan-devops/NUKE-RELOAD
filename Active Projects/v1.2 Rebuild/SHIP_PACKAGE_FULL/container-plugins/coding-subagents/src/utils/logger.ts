/**
 * src/utils/logger.ts
 *
 * Observable logging utility - Agent CLI Tools pattern.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const PREFIX = 'AgentCLITools';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] [${PREFIX}] ${message}${metaStr}`;
}

export function debug(message: string, meta?: Record<string, unknown>): void {
  if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.debug) {
    console.log(formatMessage('debug', message, meta));
  }
}

export function info(message: string, meta?: Record<string, unknown>): void {
  if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.info) {
    console.log(formatMessage('info', message, meta));
  }
}

export function warn(message: string, meta?: Record<string, unknown>): void {
  if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.warn) {
    console.warn(formatMessage('warn', message, meta));
  }
}

export function error(message: string, meta?: Record<string, unknown>): void {
  if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.error) {
    console.error(formatMessage('error', message, meta));
  }
}

export function createLogger(prefix: string): {
  debug: (msg: string, meta?: Record<string, unknown>) => void;
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
} {
  return {
    debug: (msg: string, m?: Record<string, unknown>) => debug(`[${prefix}] ${msg}`, m),
    info: (msg: string, m?: Record<string, unknown>) => info(`[${prefix}] ${msg}`, m),
    warn: (msg: string, m?: Record<string, unknown>) => warn(`[${prefix}] ${msg}`, m),
    error: (msg: string, m?: Record<string, unknown>) => error(`[${prefix}] ${msg}`, m),
  };
}

export const logger = createLogger('AgentCLITools');
