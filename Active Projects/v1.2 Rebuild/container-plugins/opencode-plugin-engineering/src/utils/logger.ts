/**
 * src/utils/logger.ts
 *
 * Simple logger for plugin
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  const entry: LogEntry = {
    timestamp: formatTimestamp(),
    level,
    message,
    ...(data && { data }),
  };

  const prefix = `[${entry.timestamp}] ${level.toUpperCase()}`;

  switch (level) {
    case 'error':
      console.error(prefix, message, data ?? '');
      break;
    case 'warn':
      console.warn(prefix, message, data ?? '');
      break;
    case 'debug':
      if (process.env.NODE_DEBUG) {
        console.log(prefix, message, data ?? '');
      }
      break;
    default:
      console.log(prefix, message, data ?? '');
  }
}

export const logger = {
  debug: (message: string, data?: Record<string, unknown>) => log('debug', message, data),
  info: (message: string, data?: Record<string, unknown>) => log('info', message, data),
  warn: (message: string, data?: Record<string, unknown>) => log('warn', message, data),
  error: (message: string, data?: Record<string, unknown>) => log('error', message, data),
};
