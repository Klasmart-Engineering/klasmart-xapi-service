import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { XapiRecord } from '../interfaces/xapiRecord'
import { IXapiRecordSender } from '../interfaces/xapiRecordSender'

export class DynamoDbRecordSender implements IXapiRecordSender {
  public static create(
    documentClient = DynamoDbRecordSender.getDefaultClient(),
    tableName = process.env.DYNAMODB_TABLE_NAME,
  ): DynamoDbRecordSender {
    if (typeof tableName !== 'string') {
      throw new Error(
        `To use DynamoDB record sender use DYNAMODB_TABLE_NAME environment variable`,
      )
    }
    return new DynamoDbRecordSender(documentClient, tableName)
  }

  private constructor(
    private readonly documentClient: DocumentClient,
    private readonly tableName: string,
  ) {}

  public async sendRecords(xapiRecords: XapiRecord[]): Promise<boolean> {
    try {
      const requestItems: DocumentClient.BatchWriteItemRequestMap = {}
      requestItems[
        this.tableName
      ] = xapiRecords.map<DocumentClient.WriteRequest>((xapiRecord) => ({
        PutRequest: {
          Item: xapiRecord,
        },
      }))
      await this.documentClient
        .batchWrite({
          RequestItems: requestItems,
        })
        .promise()
    } catch (e) {
      console.error(
        `Could not write batch to dynamodb: ${e}\nNow attempting to send one at a time...`,
      )
      this.sendLoop(xapiRecords)
    }
    return true
  }
  private async sendLoop(xapiRecords: XapiRecord[]) {
    for (const xapiRecord of xapiRecords) {
      try {
        await this.documentClient
          .put({
            TableName: this.tableName,
            Item: xapiRecord,
          })
          .promise()
      } catch (e) {
        console.error(
          `Could not write event for user(${xapiRecord.userId}) with server timestamp (${xapiRecord.serverTimestamp}) to dynamodb: ${e}`,
        )
      }
    }
  }

  private static getDefaultClient() {
    return new DocumentClient({
      apiVersion: '2012-08-10',
    })
  }
}
