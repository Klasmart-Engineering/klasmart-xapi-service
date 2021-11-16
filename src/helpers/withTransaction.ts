import newrelic from 'newrelic'

export function withTransaction<T>(path: string, f: () => T): Promise<T> {
  return newrelic.startWebTransaction(path, async () => f())
}
