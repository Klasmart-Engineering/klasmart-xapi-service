import { FirehoseClient, PutRecordBatchCommand } from '@aws-sdk/client-firehose'
import { XapiRecord } from '../interfaces/xapiRecord'
import { IXapiRecordSender } from '../interfaces/xapiRecordSender'
import { withLogger } from 'kidsloop-nodejs-logger'
import e from 'express'

const log = withLogger('firehoseRecordSender')

export class FirehoseRecordSender implements IXapiRecordSender {
  public static create(
    client: FirehoseClient = new FirehoseClient({}),
    deliveryStreamName = process.env.FIREHOSE_STREAM_NAME,
  ): FirehoseRecordSender {
    if (typeof deliveryStreamName !== 'string') {
      throw new Error(
        'To use Firehose specify FIREHOSE_STREAM_NAME environment variable',
      )
    }
    return new FirehoseRecordSender(client, deliveryStreamName)
  }

  private constructor(
    private readonly client: FirehoseClient,
    private readonly deliveryStreamName: string,
  ) {}

  public async sendRecords(xapiRecords: XapiRecord[]): Promise<boolean> {
    try {
      const command = new PutRecordBatchCommand({
        DeliveryStreamName: this.deliveryStreamName,
        Records: xapiRecords.map((xapiRecord) => {
          const json = JSON.stringify(xapiRecord) + '\n'
          return { Data: Buffer.from(json) }
        }),
      })
      const output = await this.client.send(command)
    } catch (error) {
      const message = e instanceof Error ? e.stack : e
      log.error(message)
      return false
    }

    return true
  }
}
