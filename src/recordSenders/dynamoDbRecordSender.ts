import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { XapiRecord } from '../interfaces/xapiRecord'
import { IXapiRecordSender } from '../interfaces/xapiRecordSender'
import { withLogger } from 'kidsloop-nodejs-logger'

const log = withLogger('dynamoDbRecordSender')

export class DynamoDbRecordSender implements IXapiRecordSender {
  public static create(
    tableName: string,
    documentClient = DynamoDbRecordSender.getDefaultClient(),
  ): DynamoDbRecordSender {
    return new DynamoDbRecordSender(documentClient, tableName)
  }

  private constructor(
    private readonly documentClient: DocumentClient,
    private readonly tableName: string,
  ) {}

  public async sendRecords(xapiRecords: XapiRecord[]): Promise<boolean> {
    try {
      const requestItems: DocumentClient.BatchWriteItemRequestMap = {}
      requestItems[this.tableName] =
        xapiRecords.map<DocumentClient.WriteRequest>((xapiRecord) => ({
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
      if (e instanceof Error) {
        log.error(
          `Could not write batch to dynamodb: ${e.message}\nNow attempting to send one at a time...`,
        )
      } else {
        log.error(
          `Could not write batch to dynamodb: ${e}\nNow attempting to send one at a time...`,
        )
      }
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
        const message = e instanceof Error ? e.stack : e
        log.error(
          `Could not write event for user(${xapiRecord.userId}) with server timestamp (${xapiRecord.serverTimestamp}) to dynamodb: ${message}`,
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
