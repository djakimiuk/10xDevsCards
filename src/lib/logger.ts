import { LogLevel } from "./types";

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = "info";

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
    const levels: LogLevel[] = ["error", "warn", "info", "debug"];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  error(message: string, meta?: unknown) {
    if (this.shouldLog("error")) {
      const formattedMessage = this.formatMessage("error", message, meta);
      // Use console.error for errors as they need to be visible in production
      console.error(formattedMessage);
    }
  }

  warn(message: string, meta?: unknown) {
    if (this.shouldLog("warn")) {
      const formattedMessage = this.formatMessage("warn", message, meta);
      // Use console.warn for warnings as they might be important in production
      console.warn(formattedMessage);
    }
  }

  info(message: string, meta?: unknown) {
    if (this.shouldLog("info")) {
      const formattedMessage = this.formatMessage("info", message, meta);
      // Use console.info for informational messages
      console.info(formattedMessage);
    }
  }

  debug(message: string, meta?: unknown) {
    if (this.shouldLog("debug")) {
      const formattedMessage = this.formatMessage("debug", message, meta);
      // Use console.debug for debug messages that should be hidden in production
      console.debug(formattedMessage);
    }
  }
}

export const logger = Logger.getInstance();
