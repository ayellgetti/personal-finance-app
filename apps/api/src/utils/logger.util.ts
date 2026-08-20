type LogLevel = "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

export class Logger {
  private write(level: LogLevel, message: string, context: LogContext = {}): void {
    const entry = JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    });

    if (level === "error") {
      console.error(entry);
      return;
    }

    if (level === "warn") {
      console.warn(entry);
      return;
    }

    console.info(entry);
  }

  info(message: string, context?: LogContext): void {
    this.write("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.write("warn", message, context);
  }

  error(message: string, context?: LogContext): void {
    this.write("error", message, context);
  }
}

export const logger = new Logger();
