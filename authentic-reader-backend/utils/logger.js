import winston from 'winston';

// Determine if we're in production (Heroku sets NODE_ENV=production)
const isProduction = process.env.NODE_ENV === 'production';

// Create transports array
const transports = [];

// Always add console transport (required for Heroku logs)
transports.push(
  new winston.transports.Console({
    format: isProduction
      ? winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
  })
);

// Only add file transports in development (files don't persist on Heroku)
if (!isProduction) {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}

// Create logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'authentic-reader-backend' },
  transports
});

export default logger;
