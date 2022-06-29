import { Context } from '../helpers/context'
import { XapiRecord } from '../interfaces/xapiRecord'
import { IXapiRecordSender } from '../interfaces/xapiRecordSender'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { RedisStreamRecordSender } from './redisStreamRecordSender'

const logger = withLogger('RecordSenderAuthTokenDecorator')

export class RecordSenderAuthTokenDecorator implements IXapiRecordSender {
  private readonly roomIdHash = new Set<string>()

  public constructor(private readonly recordSender: RedisStreamRecordSender) {}

  public async sendRecords(
    xapiRecords: readonly XapiRecord[],
    context?: Context,
  ): Promise<boolean> {
    if (xapiRecords.length === 0) {
      return true
    }
    if (
      !context?.roomId ||
      !context?.encodedAuthenticationToken ||
      this.roomIdHash.has(context.roomId)
    ) {
      return this.recordSender.sendRecords(xapiRecords)
    }

    try {
      const recordsCopy = [...xapiRecords]
      const recordWithToken = Object.assign({}, recordsCopy[0], {
        authenticationToken: context.encodedAuthenticationToken,
      })
      recordsCopy[0] = recordWithToken
      const success = await this.recordSender.sendRecords(recordsCopy)
      if (success) {
        this.roomIdHash.add(context.roomId)
      }
      return success
    } catch (e) {
      const message = e instanceof Error ? e.stack : e
      logger.error(message)
      return false
    }
  }
}
