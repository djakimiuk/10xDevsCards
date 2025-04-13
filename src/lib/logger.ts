type LogLevel = "error" | "warn" | "info" | "debug";

interface LogMetadata {
  timestamp: string;
  level: LogLevel;
  context?: string;
  [key: string]: unknown;
}

interface LogEntry {
  message: string;
  metadata: LogMetadata;
  error?: Error;
}

const SENSITIVE_PATTERNS = [
  /bearer\s+[a-zA-Z0-9._-]+/gi,
  /api[_-]?key[=:]\s*[a-zA-Z0-9._-]+/gi,
  /password[=:]\s*[^\s&]+/gi,
  /authorization[=:]\s*[^\s&]+/gi,
];

export class Logger {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  private formatMessage(entry: LogEntry): string {
    const { message, metadata, error } = entry;
    const { timestamp, level, ...rest } = metadata;

    // Remove undefined and null values from metadata
    const cleanMetadata = Object.entries(rest).reduce(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, unknown>
    );

    const metadataStr = Object.keys(cleanMetadata).length ? ` | ${JSON.stringify(cleanMetadata)}` : "";

    const errorStr = error ? ` | ${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ""}` : "";

    return `[${timestamp}] ${level.toUpperCase()} ${message}${metadataStr}${errorStr}`;
  }

  private sanitize(message: string): string {
    let sanitized = message;
    for (const pattern of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, "[REDACTED]");
    }
    return sanitized;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata: Record<string, unknown> = {},
    error?: Error
  ): LogEntry {
    return {
      message: this.sanitize(message),
      metadata: {
        timestamp: new Date().toISOString(),
        level,
        context: this.context,
        ...metadata,
      },
      error,
    };
  }

  private log(entry: LogEntry): void {
    const formattedMessage = this.formatMessage(entry);

    switch (entry.metadata.level) {
      case "error":
        console.error(formattedMessage);
        break;
      case "warn":
        console.warn(formattedMessage);
        break;
      case "info":
        console.info(formattedMessage);
        break;
      case "debug":
        console.debug(formattedMessage);
        break;
    }
  }

  error(message: string, metadata: Record<string, unknown> = {}, error?: Error): void {
    this.log(this.createLogEntry("error", message, metadata, error));
  }

  warn(message: string, metadata: Record<string, unknown> = {}): void {
    this.log(this.createLogEntry("warn", message, metadata));
  }

  info(message: string, metadata: Record<string, unknown> = {}): void {
    this.log(this.createLogEntry("info", message, metadata));
  }

  debug(message: string, metadata: Record<string, unknown> = {}): void {
    this.log(this.createLogEntry("debug", message, metadata));
  }

  child(context: string): Logger {
    return new Logger(`${this.context ? `${this.context}:` : ""}${context}`);
  }
}
