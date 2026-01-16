import pino from 'pino';

const isDevelopment = import.meta.env.DEV;
const isTest = import.meta.env.MODE === 'test';

// Create logger configuration
const loggerConfig = {
  level: isDevelopment ? 'debug' : 'info',
  transport: isDevelopment && !isTest ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } : undefined,
  base: {
    pid: undefined,
    hostname: undefined,
  },
  // Suppress logging in test environment
  silent: isTest,
};

// Create and export logger instance
export const logger = pino(loggerConfig);

// Export convenience methods that match console API
export const log = {
  debug: (message: string, ...args: unknown[]) => {
    logger.debug({ args }, message);
  },
  info: (message: string, ...args: unknown[]) => {
    logger.info({ args }, message);
  },
  warn: (message: string, ...args: unknown[]) => {
    logger.warn({ args }, message);
  },
  error: (message: string, error?: Error | unknown, ...args: unknown[]) => {
    if (error instanceof Error) {
      logger.error({ error, args }, message);
    } else {
      logger.error({ error, args }, message);
    }
  },
};

// Export default logger for backward compatibility
export default logger;