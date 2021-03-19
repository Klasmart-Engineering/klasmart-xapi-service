import {
  FirehoseClient,
  PutRecordBatchCommand,
} from '@aws-sdk/client-firehose';
import { getEnvironmentVariableOrDefault } from './envUtil';
import { XAPIRecord } from './xapiRecord';
import { XAPIRecordSender } from './xapiRecordSender';

export class Firehose implements XAPIRecordSender {
  public static create(
    client: FirehoseClient = new FirehoseClient({}),
    deliveryStreamName = getDefaultDeliveryStreamName(),
  ): Firehose {
    return new Firehose(client || new FirehoseClient({}), deliveryStreamName);
  }

  private client: FirehoseClient;
  private deliveryStreamName: string | undefined;

  private constructor(client: FirehoseClient, deliveryStreamName?: string) {
    this.client = client;
    this.deliveryStreamName = deliveryStreamName;
  }

  public async send(xAPIRecords: XAPIRecord[]): Promise<boolean> {
    try {
      const command = new PutRecordBatchCommand({
        DeliveryStreamName: this.deliveryStreamName,
        Records: xAPIRecords.map((xAPIRecord) => {
          const json = JSON.stringify(xAPIRecord) + '\n';
          return { Data: Buffer.from(json) };
        }),
      });
      const output = await this.client.send(command);
    } catch (error) {
      console.log(error);
      return false;
    }

    return true;
  }
}
function getDefaultDeliveryStreamName() {
  return getEnvironmentVariableOrDefault('FIREHOSE_STREAM_NAME');
}
