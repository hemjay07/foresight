/**
 * Logging Utility
 *
 * Provides structured logging with different levels.
 * In production, you can configure this to send logs to a service
 * like CloudWatch, Datadog, or disable certain levels.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  context?: string;
  data?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isTest = process.env.NODE_ENV === 'test';

  /**
   * Format log message with timestamp and context
   */
  private format(level: LogLevel, message: string, options?: LogOptions): string {
    const timestamp = new Date().toISOString();
    const context = options?.context ? `[${options.context}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${context} ${message}`;
  }

  /**
   * Debug - verbose logging for development
   * Disabled in production unless DEBUG env var is set
   */
  debug(message: string, options?: LogOptions): void {
    if (this.isDevelopment || process.env.DEBUG === 'true') {
      console.debug(this.format('debug', message, options), options?.data || '');
    }
  }

  /**
   * Info - general informational messages
   */
  info(message: string, options?: LogOptions): void {
    if (!this.isTest) {
      console.info(this.format('info', message, options), options?.data || '');
    }
  }

  /**
   * Warn - warning messages
   */
  warn(message: string, options?: LogOptions): void {
    if (!this.isTest) {
      console.warn(this.format('warn', message, options), options?.data || '');
    }
  }

  /**
   * Error - error messages (always logged)
   */
  error(message: string, error?: Error | unknown, options?: LogOptions): void {
    console.error(this.format('error', message, options), {
      ...options?.data,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export default for convenience
export default logger;
