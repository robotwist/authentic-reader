/**
 * Logger utility
 * 
 * A simple logging utility that provides consistent logging with different
 * log levels and optional metadata. Useful for debugging and tracking application
 * behavior in both development and production environments.
 */

// Define log level type
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Environment settings
const isDev = import.meta.env.DEV || false;
const minLevel: LogLevel = isDev ? 'debug' : 'info'; // Lower level in development

// Log level hierarchy
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Determine if a log should be shown based on its level
const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
};

// Format the log message with timestamp and level
const formatMessage = (level: LogLevel, message: string): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

// Generic log function with optional metadata
const log = (level: LogLevel, message: string, metadata?: any): void => {
  if (!shouldLog(level)) return;
  
  const formattedMessage = formatMessage(level, message);
  
  switch (level) {
    case 'debug':
      if (metadata) {
        console.debug(formattedMessage, metadata);
      } else {
        console.debug(formattedMessage);
      }
      break;
    case 'info':
      if (metadata) {
        console.info(formattedMessage, metadata);
      } else {
        console.info(formattedMessage);
      }
      break;
    case 'warn':
      if (metadata) {
        console.warn(formattedMessage, metadata);
      } else {
        console.warn(formattedMessage);
      }
      break;
    case 'error':
      if (metadata) {
        console.error(formattedMessage, metadata);
      } else {
        console.error(formattedMessage);
      }
      break;
  }
};

// Export logger functions
export const logger = {
  debug: (message: string, metadata?: any) => log('debug', message, metadata),
  info: (message: string, metadata?: any) => log('info', message, metadata),
  warn: (message: string, metadata?: any) => log('warn', message, metadata),
  error: (message: string, metadata?: any) => log('error', message, metadata)
}; 