import { getRepository } from 'typeorm'
import { XapiRecord } from '../../interfaces/xapiRecord'
import { IXapiRecordSender } from '../../interfaces/xapiRecordSender'
import { XapiDbRecord } from './entities/xapiDbRecord'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { Context } from '../../helpers/context'

const log = withLogger('typeoOrmRecordSender')

export class TypeOrmRecordSender implements IXapiRecordSender {
  public constructor(private repository = getRepository(XapiDbRecord)) {}

  public async sendRecords(
    xapiRecords: ReadonlyArray<XapiRecord>,
    context?: Context,
  ): Promise<boolean> {
    try {
      const dbRecords = this.mapToDbRecords(xapiRecords)
      await this.repository
        .createQueryBuilder()
        .insert()
        .into(XapiDbRecord)
        .values(dbRecords)
        .execute()
      return true
    } catch (e) {
      const error = e instanceof Error ? e.stack : e
      log.error(`Failed to save records to SQL database: ${error}`)
    }
    return false
  }

  private mapToDbRecords(
    xapiRecords: ReadonlyArray<XapiRecord>,
  ): XapiDbRecord[] {
    return xapiRecords.map((x) => {
      const record = this.repository.create()
      record.userId = x.userId
      record.roomId = x.roomId
      record.isReview = x.isReview
      record.serverTimestamp = x.serverTimestamp
      record.xapi = x.xapi
      record.ipHash = x.ipHash
      record.geo = x.geo
      return record
    })
  }
}
