import { FirehoseClient, PutRecordBatchCommand } from '@aws-sdk/client-firehose'
import { XapiRecord } from '../interfaces/xapiRecord'
import { IXapiRecordSender } from '../interfaces/xapiRecordSender'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { Context } from '../helpers/context'

const log = withLogger('firehoseRecordSender')

export class FirehoseRecordSender implements IXapiRecordSender {
  public static create(
    deliveryStreamName: string,
    client: FirehoseClient = new FirehoseClient({
      endpoint: process.env.LOCALSTACK_ENDPOINT,
    }),
  ): FirehoseRecordSender {
    return new FirehoseRecordSender(client, deliveryStreamName)
  }

  private constructor(
    private readonly client: FirehoseClient,
    private readonly deliveryStreamName: string,
  ) {}

  public async sendRecords(
    xapiRecords: ReadonlyArray<XapiRecord>,
    context?: Context,
  ): Promise<boolean> {
    try {
      const command = new PutRecordBatchCommand({
        DeliveryStreamName: this.deliveryStreamName,
        Records: xapiRecords.map((xapiRecord) => {
          const json = JSON.stringify(xapiRecord) + '\n'
          return { Data: Buffer.from(json) }
        }),
      })
      const output = await this.client.send(command)
      log.silly(`PutRecordBatchCommandOutput: ${JSON.stringify(output)}`)
    } catch (e) {
      const message = e instanceof Error ? e.stack : e
      log.error(message)
      return false
    }

    return true
  }
}
