import { getRepository } from 'typeorm'
import { XapiRecord } from '../../interfaces/xapiRecord'
import { IXapiRecordSender } from '../../interfaces/xapiRecordSender'
import { XapiDbRecord } from './entities/xapiDbRecord'
import { withLogger } from 'kidsloop-nodejs-logger'

const log = withLogger('typeoOrmRecordSender')
export class TypeOrmRecordSender implements IXapiRecordSender {
  public constructor(private repository = getRepository(XapiDbRecord)) { }

  public async sendRecords(xapiRecords: XapiRecord[]): Promise<boolean> {
    const promises = xapiRecords.map(async (x) => {
      try {
        const record = this.repository.create()
        record.userId = x.userId || 'undefined'
        record.serverTimestamp = x.serverTimestamp
        record.xapi = x.xapi
        record.ipHash = x.ipHash
        record.geo = x.geo
        await this.repository.save(x)
      } catch (e) {
        if (e instanceof Error) {
          log.error(e.stack)
        } else {
          log.error(`Error adding DynamoDB record sender: ${e}`)
        }
        throw e
      }
    })
    const results = await Promise.allSettled(promises)
    const everyPromiseSuceeded = results.every(
      (result) => result.status === 'fulfilled',
    )
    return everyPromiseSuceeded
  }
}
