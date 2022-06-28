import { KinesisClient, PutRecordsCommand } from '@aws-sdk/client-kinesis'
import { XapiRecord } from '../interfaces/xapiRecord'
import { IXapiRecordSender } from '../interfaces/xapiRecordSender'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { Context } from '../helpers/context'

const log = withLogger('kinesisDataStreamRecordSender')

export class KinesisDataStreamRecordSender implements IXapiRecordSender {
  public static create(
    dataStreamName: string,
    client: KinesisClient = new KinesisClient({
      endpoint: process.env.LOCALSTACK_ENDPOINT,
    }),
  ): KinesisDataStreamRecordSender {
    return new KinesisDataStreamRecordSender(client, dataStreamName)
  }

  private constructor(
    private readonly client: KinesisClient,
    private readonly dataStreamName: string,
  ) {}

  public async sendRecords(
    xapiRecords: ReadonlyArray<XapiRecord>,
    context?: Context,
  ): Promise<boolean> {
    try {
      const command = new PutRecordsCommand({
        StreamName: this.dataStreamName,
        Records: xapiRecords.map((xapiRecord) => {
          const json = JSON.stringify(xapiRecord) + '\n'
          return {
            PartitionKey: xapiRecord.userId, // UserID is UUID so shoud create appropriate hash.
            Data: Buffer.from(json),
          }
        }),
      })

      const output = await this.client.send(command)

      if (output.$metadata.httpStatusCode != 200) {
        log.error('PutRecordsCommand HTTP Status Code is not 200')
        log.error(`${JSON.stringify(output)}`)
        return false
      } else if (output.FailedRecordCount && output.FailedRecordCount > 0) {
        log.error('PutRecordsCommand FailedRecordCount greater than 0')
        log.error(`${JSON.stringify(output)}`)
        return false
      }
    } catch (e) {
      const message = e instanceof Error ? e.stack : e
      log.error(message)
      return false
    }

    return true
  }
}
