export type LogLevel = "debug" | "info" | "warning" | "error";

export interface LogRecord {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: number;
  readonly context?: Readonly<Record<string, unknown>>;
}

export type LogSink = (record: LogRecord) => void;

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warning: 30,
  error: 40,
};

/**
 * Structured logger. Prefer injected sinks in production;
 * default sink uses console methods (never raw console.log).
 */
export class Logger {
  constructor(
    private readonly minimumLevel: LogLevel = "info",
    private readonly sink: LogSink = defaultSink,
  ) {}

  debug(message: string, context?: Record<string, unknown>): void {
    this.write("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.write("info", message, context);
  }

  warning(message: string, context?: Record<string, unknown>): void {
    this.write("warning", message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.write("error", message, context);
  }

  private write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (levelOrder[level] < levelOrder[this.minimumLevel]) {
      return;
    }
    this.sink({
      level,
      message,
      timestamp: Date.now(),
      context,
    });
  }
}

function defaultSink(record: LogRecord): void {
  const payload = record.context
    ? `${record.message} ${JSON.stringify(record.context)}`
    : record.message;
  switch (record.level) {
    case "debug":
      console.debug(payload);
      break;
    case "info":
      console.info(payload);
      break;
    case "warning":
      console.warn(payload);
      break;
    case "error":
      console.error(payload);
      break;
  }
}

export const logger = new Logger("info");
