import winston from 'winston'

export function logError(
  logger: winston.Logger,
  error: unknown,
  message: string,
): void {
  if (error instanceof Error) {
    logger.error(`${message}: ${error.stack}`)
  } else {
    logger.error(`${message}: ${error}`)
  }
}
