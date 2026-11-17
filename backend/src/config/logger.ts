import pino from "pino";

/**
 * Cloudflare Workers has no process.stdout stream that pino can use, so fall
 * back to structured console output there. Node keeps pino unchanged.
 */
const isWorker = typeof process !== "undefined" && process.env.WORKERS === "1";

interface LogFn {
  (obj: unknown, msg?: string, ...args: unknown[]): void;
  (msg: string, ...args: unknown[]): void;
}

export interface LoggerLike {
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  debug: LogFn;
}

function consoleLogger(): LoggerLike {
  const emit =
    (level: string): LogFn =>
    (...args: unknown[]) => {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ level, args }));
    };
  return {
    info: emit("info"),
    warn: emit("warn"),
    error: emit("error"),
    debug: emit("debug"),
  };
}

export const logger: LoggerLike = isWorker
  ? consoleLogger()
  : pino({
      level: process.env.LOG_LEVEL ?? "info",
      transport:
        process.env.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
    });
