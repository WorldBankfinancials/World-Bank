export const packageName = 'logging';
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export function log(level: LogLevel, message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message, data };
  if (level === 'error') console.error(JSON.stringify(logEntry));
  else if (level === 'warn') console.warn(JSON.stringify(logEntry));
  else console.info(JSON.stringify(logEntry));
}
export const logger = {
  debug: (msg: string, data?: unknown) => log('debug', msg, data),
  info: (msg: string, data?: unknown) => log('info', msg, data),
  warn: (msg: string, data?: unknown) => log('warn', msg, data),
  error: (msg: string, data?: unknown) => log('error', msg, data),
};
