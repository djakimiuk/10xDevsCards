import { LogLevel } from "./types";

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;

  // Private constructor to enforce singleton pattern
  private constructor() {
    // No initialization needed
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  }

  error(message: string, meta?: unknown) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const formattedMessage = this.formatMessage(LogLevel.ERROR, message, meta);
      // Use console.error for errors as they need to be visible in production
      console.error(formattedMessage);
    }
  }

  warn(message: string, meta?: unknown) {
    if (this.shouldLog(LogLevel.WARN)) {
      const formattedMessage = this.formatMessage(LogLevel.WARN, message, meta);
      // Use console.warn for warnings as they might be important in production
      console.warn(formattedMessage);
    }
  }

  info(message: string, meta?: unknown) {
    if (this.shouldLog(LogLevel.INFO)) {
      const formattedMessage = this.formatMessage(LogLevel.INFO, message, meta);
      // Use console.info for informational messages
      console.info(formattedMessage);
    }
  }

  debug(message: string, meta?: unknown) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const formattedMessage = this.formatMessage(LogLevel.DEBUG, message, meta);
      // Use console.debug for debug messages that should be hidden in production
      console.debug(formattedMessage);
    }
  }
}

export const logger = Logger.getInstance();
