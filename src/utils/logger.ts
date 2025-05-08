// Basic logger utility wrapping console
// Allows for potential future enhancements like sending logs to a server,
// different log levels based on environment, etc.

// Get log level from environment variables with fallbacks
// Handle both Vite and browser window.env formats
const getLogLevel = (): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.VITE_LOG_LEVEL || 'info';
    } else if (typeof window !== 'undefined' && window.env) {
      return window.env.REACT_APP_LOG_LEVEL || 'info';
    }
  } catch (e) {
    console.warn('Error accessing environment variables:', e);
  }
  return 'info'; // Default fallback
};

const LOG_LEVEL = getLogLevel();

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