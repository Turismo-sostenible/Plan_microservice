// application/ports/LoggerPort.ts

export interface LogContext {
  [key: string]: any
}

export interface LoggerPort {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, error?: Error, context?: LogContext): void

  /**
   * Crea un child logger con contexto compartido
   * Útil para tracing de requests
   */
  child(context: LogContext): LoggerPort
}
