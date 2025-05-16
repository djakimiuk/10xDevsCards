import { LogLevel } from "./types";

export class Logger {
  private readonly context: string;

  constructor(context: string) {
    this.context = context;
  }

  private formatMessage(level: LogLevel, message: string, data?: Record<string, unknown>, error?: Error): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      context: this.context,
      message,
      ...data,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    // In development, we'll console.log for better DevTools formatting
    if (import.meta.env.DEV) {
      const logFn = this.getConsoleMethod(level);
      logFn(`[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}`, data || "", error || "");
    } else {
      // In production, we'll JSON.stringify for better log aggregation
      console.log(JSON.stringify(logData));
    }
  }

  private getConsoleMethod(level: LogLevel): typeof console.log {
    switch (level) {
      case LogLevel.ERROR:
        return console.error;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.DEBUG:
        return console.debug;
      default:
        return console.log;
    }
  }

  error(message: string, data?: Record<string, unknown>, error?: Error): void {
    this.formatMessage(LogLevel.ERROR, message, data, error);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.formatMessage(LogLevel.WARN, message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.formatMessage(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (import.meta.env.DEV) {
      console.debug(`[${this.context}] ${message}`, data || "");
    }
  }
}

// Export a default logger instance for convenience
export const logger = new Logger("App");
