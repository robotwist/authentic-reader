// Basic logger utility wrapping console
// Allows for potential future enhancements like sending logs to a server,
// different log levels based on environment, etc.

const LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL || 'info'; // Default to info

const levels: { [key: string]: number } = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = levels[LOG_LEVEL.toLowerCase()] ?? levels.info;

export const logger = {
  debug: (...args: any[]) => {
    if (currentLevel <= levels.debug) {
      console.debug('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (currentLevel <= levels.info) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (currentLevel <= levels.warn) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: any[]) => {
    if (currentLevel <= levels.error) {
      console.error('[ERROR]', ...args);
    }
  },
}; 