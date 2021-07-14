import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { XAPIRecord } from './xapiRecord';
import { XAPIRecordSender } from './xapiRecordSender';

const docClient = new DocumentClient({
  apiVersion: '2012-08-10',
});

export class DynamoDBSender implements XAPIRecordSender {
  public static async create(TableName: string): Promise<DynamoDBSender> {
    try {
      return new DynamoDBSender(TableName);
    } catch (e) {
      throw new Error(`❌ Unable to query DynamoDB table' ${TableName}: ${e}`);
    }
  }
  private TableName: string;
  private constructor(TableName: string) {
    this.TableName = TableName;
  }
  public async send(xAPIRecords: XAPIRecord[]): Promise<boolean> {
    try {
      const RequestItems: DocumentClient.BatchWriteItemRequestMap = {};
      RequestItems[
        this.TableName
      ] = xAPIRecords.map<DocumentClient.WriteRequest>((xAPIRecord) => ({
        PutRequest: {
          Item: xAPIRecord,
        },
      }));
      await docClient
        .batchWrite({
          RequestItems,
        })
        .promise();
    } catch (e) {
      console.error(
        `Could not write batch to dynamodb: ${e}\nNow attempting to send one at a time...`,
      );
      this.sendLoop(xAPIRecords);
    }
    return true;
  }
  private async sendLoop(xAPIRecords: XAPIRecord[]) {
    for (const xAPIRecord of xAPIRecords) {
      try {
        await docClient
          .put({
            TableName: this.TableName,
            Item: xAPIRecord,
          })
          .promise();
      } catch (e) {
        console.error(
          `Could not write event for user(${xAPIRecord.userId}) with server timestamp (${xAPIRecord.serverTimestamp}) to dynamodb: ${e}`,
        );
      }
    }
  }
}
