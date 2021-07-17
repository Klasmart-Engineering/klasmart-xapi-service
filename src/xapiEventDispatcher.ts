import { Context } from './helpers/context'
import { XapiRecord } from './interfaces/xapiRecord'
import geoip from 'geoip-lite'
import { createHash } from 'crypto'
import { IXapiRecordSender } from './interfaces/xapiRecordSender'

export class XapiEventDispatcher {
  private recordSenders: IXapiRecordSender[]

  public constructor(recordSenders: IXapiRecordSender[]) {
    this.recordSenders = recordSenders
  }

  public async dispatchEvents(
    { xAPIEvents }: any,
    context: Context,
  ): Promise<boolean> {
    const userId = context?.token?.id || 'unauthenticated'
    const ip = context.ip
    const serverTimestamp = Date.now()
    const geo = geoip.lookup(ip)
    const ipHash = createHash('sha256').update(ip).digest('hex')

    const xapiRecords: XapiRecord[] = xAPIEvents.map(
      (xapi: any, index: number) => {
        return {
          xapi: JSON.parse(xapi),
          userId,
          ipHash,
          geo,
          serverTimestamp: serverTimestamp + index,
        }
      },
    )
    await Promise.allSettled(
      this.recordSenders.map((x) => x.sendRecords(xapiRecords)),
    )

    return true
  }
}
