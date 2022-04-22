export class ApplicationError extends Error {
  public readonly innerError?: unknown
  public readonly meta?: unknown

  constructor({
    message,
    innerError,
    meta,
  }: {
    message: string
    innerError?: unknown
    meta?: unknown
  }) {
    super(message)
    this.name = this.constructor.name
    this.innerError = innerError
    this.meta = meta
    // This clips the constructor invocation from the stack trace.
    // It's not absolutely essential, but it does make the stack trace a little nicer.
    Error.captureStackTrace(this, this.constructor)
  }
}
