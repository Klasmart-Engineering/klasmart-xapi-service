import { FirehoseClient, PutRecordBatchCommand } from '@aws-sdk/client-firehose'
import { getEnvironmentVariableOrDefault } from '../helpers/envUtil'
import { XapiRecord } from '../interfaces/xapiRecord'
import { IXapiRecordSender } from '../interfaces/xapiRecordSender'

export class FirehoseRecordSender implements IXapiRecordSender {
  public static create(
    client: FirehoseClient = new FirehoseClient({}),
    deliveryStreamName = getEnvironmentVariableOrDefault(
      'FIREHOSE_STREAM_NAME',
    ),
  ): FirehoseRecordSender {
    if (!deliveryStreamName) {
      throw new Error(
        'To use firehose specify FIREHOSE_STREAM_NAME env variable',
      )
    }
    return new FirehoseRecordSender(
      client || new FirehoseClient({}),
      deliveryStreamName,
    )
  }

  private client: FirehoseClient
  private deliveryStreamName: string | undefined

  private constructor(client: FirehoseClient, deliveryStreamName?: string) {
    this.client = client
    this.deliveryStreamName = deliveryStreamName
  }

  public async sendRecords(xAPIRecords: XapiRecord[]): Promise<boolean> {
    try {
      const command = new PutRecordBatchCommand({
        DeliveryStreamName: this.deliveryStreamName,
        Records: xAPIRecords.map((xAPIRecord) => {
          const json = JSON.stringify(xAPIRecord) + '\n'
          return { Data: Buffer.from(json) }
        }),
      })
      const output = await this.client.send(command)
    } catch (error) {
      console.log(error)
      return false
    }

    return true
  }
}
