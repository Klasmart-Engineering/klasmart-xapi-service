import { Context } from './helpers/context'
import { XapiRecord } from './interfaces/xapiRecord'
import { createHash } from 'crypto'
import { IXapiRecordSender } from './interfaces/xapiRecordSender'
import { IGeolocationProvider } from './interfaces/geolocationProvider'
import { withLogger } from 'kidsloop-nodejs-logger'

const log = withLogger('xapiEventDispatcher')

export class XapiEventDispatcher {
  public constructor(
    private readonly recordSenders: IXapiRecordSender[],
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
      log.warn('User not authenticated, will not dispatch the xapi record.')
      return false
    }
    const roomId = context?.roomId
    const ip = context.ip
    const serverTimestamp = Date.now()
    const geo = this.geolocationProvider.getInfo(ip)
    const ipHash = createHash('sha256').update(ip).digest('hex')

    const xapiRecords: XapiRecord[] = (xapiEvents as string[]).map(
      (xapi: string, index: number) => {
        return {
          xapi: JSON.parse(xapi),
          userId,
          roomId,
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
      (result) => result.status === 'fulfilled',
    )
    return allSucceeded
  }

  private static isArrayOfStrings(value: unknown): boolean {
    return (
      Array.isArray(value) && value.every((item) => typeof item === 'string')
    )
  }
}
