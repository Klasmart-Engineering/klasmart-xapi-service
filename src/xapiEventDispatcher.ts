import { Context } from './helpers/context'
import { XapiRecord } from './interfaces/xapiRecord'
import { createHash } from 'crypto'
import { IXapiRecordSender } from './interfaces/xapiRecordSender'
import { IGeolocationProvider } from './interfaces/geolocationProvider'

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
      console.error(
        `Expected xapiEvents to be of type string[], but got ${xapiEvents}.`,
      )
      return false
    }

    const userId = context?.token?.id
    if (!userId) {
      console.warn('User not authenticated, will not dispatch the xapi record.')
      return false
    }

    const ip = context.ip
    const serverTimestamp = Date.now()
    const geo = this.geolocationProvider.getInfo(ip)
    const ipHash = createHash('sha256').update(ip).digest('hex')

    const xapiRecords: XapiRecord[] = (xapiEvents as string[]).map(
      (xapi: string, index: number) => {
        return {
          xapi: JSON.parse(xapi),
          userId,
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
