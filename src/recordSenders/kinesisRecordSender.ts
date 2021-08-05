import { XapiRecord } from '../interfaces/xapiRecord'
import { IXapiRecordSender } from '../interfaces/xapiRecordSender'
import {
  PutRecordsCommand,
  PutRecordsCommandInput,
  KinesisClient,
} from '@aws-sdk/client-kinesis'

export class KinesisProducer implements IXapiRecordSender {
  constructor(
    private readonly kinesisClient = new KinesisClient({}),
    private readonly streamName = process.env.KINESIS_STREAM_NAME,
  ) {
    if (!streamName) {
      throw new Error(
        `Kinesis StreamName must be set using KINESIS_STREAM_NAME environment variable`,
      )
    }
  }

  public async sendRecords(xapiRecords: XapiRecord[]): Promise<boolean> {
    try {
      const input: PutRecordsCommandInput = {
        Records: [
          {
            Data: new TextEncoder().encode(JSON.stringify(xapiRecords)),
            PartitionKey: `xapiData`,
          },
        ],

        StreamName: this.streamName,
      }
      const command = new PutRecordsCommand(input)
      const response = await this.kinesisClient.send(command)
      console.log(response)
    } catch (error) {
      console.log(error)
      return false
    }

    return true
  }
}
