import pino, { Logger as PinoLoggerInstance } from "pino";
import { LoggerPort, LogContext } from "../../../application/ports/LoggerPort";

export class PinoLogger implements LoggerPort {
  private logger: PinoLoggerInstance;

  constructor(logLevel: string = "info") {
    const isDevelopment = process.env.NODE_ENV !== "production";

    this.logger = pino({
      level: logLevel,
      // Solo usar pino-pretty en desarrollo
      ...(isDevelopment && {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }),
    });
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(context || {}, message);
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(context || {}, message);
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(context || {}, message);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.logger.error(
      {
        ...context,
        error: {
          message: error?.message,
          stack: error?.stack,
          name: error?.name,
        },
      },
      message,
    );
  }

  child(context: LogContext): LoggerPort {
    const childLogger = this.logger.child(context);
    return new PinoLoggerWrapper(childLogger);
  }
}

// Wrapper para child loggers
class PinoLoggerWrapper implements LoggerPort {
  constructor(private logger: PinoLoggerInstance) {}

  debug(message: string, context?: LogContext): void {
    this.logger.debug(context || {}, message);
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(context || {}, message);
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(context || {}, message);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.logger.error(
      {
        ...context,
        error: {
          message: error?.message,
          stack: error?.stack,
        },
      },
      message,
    );
  }

  child(context: LogContext): LoggerPort {
    return new PinoLoggerWrapper(this.logger.child(context));
  }
}
