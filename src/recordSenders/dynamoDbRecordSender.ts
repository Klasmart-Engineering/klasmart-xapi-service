import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { XapiRecord } from '../interfaces/xapiRecord'
import { IXapiRecordSender } from '../interfaces/xapiRecordSender'

const docClient = new DocumentClient({
  apiVersion: '2012-08-10',
})

export class DynamoDbRecordSender implements IXapiRecordSender {
  public static async create(TableName: string): Promise<DynamoDbRecordSender> {
    try {
      return new DynamoDbRecordSender(TableName)
    } catch (e) {
      throw new Error(`❌ Unable to query DynamoDB table' ${TableName}: ${e}`)
    }
  }
  private TableName: string
  private constructor(TableName: string) {
    this.TableName = TableName
  }
  public async sendRecords(xapiRecords: XapiRecord[]): Promise<boolean> {
    try {
      const RequestItems: DocumentClient.BatchWriteItemRequestMap = {}
      RequestItems[
        this.TableName
      ] = xapiRecords.map<DocumentClient.WriteRequest>((xapiRecord) => ({
        PutRequest: {
          Item: xapiRecord,
        },
      }))
      await docClient
        .batchWrite({
          RequestItems,
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
        await docClient
          .put({
            TableName: this.TableName,
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
}
