import { Context } from './helpers/context'
import { XapiRecord } from './interfaces/xapiRecord'
import { createHash } from 'crypto'
import { IXapiRecordSender } from './interfaces/xapiRecordSender'
import { IGeolocationProvider } from './interfaces/geolocationProvider'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'

const log = withLogger('xapiEventDispatcher')

export class XapiEventDispatcher {
  public constructor(
    private readonly recordSenders: ReadonlyArray<IXapiRecordSender>,
    private readonly geolocationProvider: IGeolocationProvider,
  ) {}

  public async dispatchEvents(
    { xAPIEvents: xapiEvents }: { xAPIEvents: unknown },
    context: Context,
  ): Promise<boolean> {
    if (!XapiEventDispatcher.isArrayOfStrings(xapiEvents)) {
      const dataString =
        typeof xapiEvents === 'object' ? JSON.stringify(xapiEvents) : xapiEvents

      log.error(
        `Expected xapiEvents to be of type string[], but got ${dataString}.`,
      )
      return false
    }

    const userId = context?.authenticationToken?.id
    if (!userId) {
      log.debug('User not authenticated, will not dispatch the xapi record.')
      return false
    }
    const roomId = context?.roomId
    const isReview = context?.isReview ?? false
    const ip = context.ip ?? '127.0. 0.1'
    const serverTimestamp = Date.now()
    const geo = this.geolocationProvider.getInfo(ip)
    const ipHash = createHash('sha256').update(ip).digest('hex')

    const xapiRecords: XapiRecord[] = xapiEvents.map(
      (xapi: string, index: number) => {
        const xapiObject = JSON.parse(xapi)
        const studentId = xapiObject.userId
        log.silly(`studentId: ${studentId}`)
        // xapiObject.userId isn't part of the default xAPI event.
        // It's injected by the xAPI uploader, which it gets from Live (optional).
        // So we delete it from the event and add it below (if not undefined).
        delete xapiObject.userId
        return {
          xapi: xapiObject,
          userId: studentId ?? userId,
          roomId,
          isReview,
          ipHash,
          geo,
          serverTimestamp: serverTimestamp + index,
        }
      },
    )
    const results = await Promise.allSettled(
      this.recordSenders.map((x) => x.sendRecords(xapiRecords)),
    )
    const allSucceeded = results.every(
      (result) => result.status === 'fulfilled' && result.value === true,
    )
    log.silly(
      `allSucceeded: ${allSucceeded}; userId: ${userId}; roomId: ${roomId}`,
    )
    return allSucceeded
  }

  private static isArrayOfStrings(value: unknown): value is string[] {
    return (
      Array.isArray(value) && value.every((item) => typeof item === 'string')
    )
  }
}
