/**
 * Logger utility
 *
 * A simple logging utility that provides consistent logging with different
 * log levels and optional metadata. Useful for debugging and tracking application
 * behavior in both development and production environments.
 */
// Environment settings
const isDev = import.meta.env.DEV || false;
const minLevel = isDev ? 'debug' : 'info'; // Lower level in development
// Log level hierarchy
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};
// Determine if a log should be shown based on its level
const shouldLog = (level) => {
    return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
};
// Format the log message with timestamp and level
const formatMessage = (level, message) => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};
// Generic log function with optional metadata
const log = (level, message, metadata) => {
    if (!shouldLog(level))
        return;
    const formattedMessage = formatMessage(level, message);
    switch (level) {
        case 'debug':
            if (metadata) {
                console.debug(formattedMessage, metadata);
            }
            else {
                console.debug(formattedMessage);
            }
            break;
        case 'info':
            if (metadata) {
                console.info(formattedMessage, metadata);
            }
            else {
                console.info(formattedMessage);
            }
            break;
        case 'warn':
            if (metadata) {
                console.warn(formattedMessage, metadata);
            }
            else {
                console.warn(formattedMessage);
            }
            break;
        case 'error':
            if (metadata) {
                console.error(formattedMessage, metadata);
            }
            else {
                console.error(formattedMessage);
            }
            break;
    }
};
// Export logger functions
export const logger = {
    debug: (message, metadata) => log('debug', message, metadata),
    info: (message, metadata) => log('info', message, metadata),
    warn: (message, metadata) => log('warn', message, metadata),
    error: (message, metadata) => log('error', message, metadata)
};
