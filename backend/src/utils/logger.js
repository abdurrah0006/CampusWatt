/* Minimal leveled logger. Quiet during tests unless LOG_LEVEL is set. */
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };
const defaultLevel = process.env.NODE_ENV === 'test' ? 'silent' : 'info';
const threshold = LEVELS[process.env.LOG_LEVEL] ?? LEVELS[defaultLevel];

const COLORS = { debug: '\x1b[90m', info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m' };
const RESET = '\x1b[0m';

function write(level, message, ...rest) {
  if (LEVELS[level] < threshold) return;
  const time = new Date().toISOString();
  const line = `${COLORS[level]}[${time}] ${level.toUpperCase().padEnd(5)}${RESET} ${message}`;
  const out = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  out(line, ...rest);
}

export const logger = {
  debug: (msg, ...rest) => write('debug', msg, ...rest),
  info: (msg, ...rest) => write('info', msg, ...rest),
  warn: (msg, ...rest) => write('warn', msg, ...rest),
  error: (msg, ...rest) => write('error', msg, ...rest),
};
