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

  public async sendRecords(
    xapiRecords: ReadonlyArray<XapiRecord>,
  ): Promise<boolean> {
    try {
      const requestItems: DocumentClient.BatchWriteItemRequestMap = {}
      requestItems[this.tableName] =
        xapiRecords.map<DocumentClient.WriteRequest>((xapiRecord) => ({
          PutRequest: {
            Item: xapiRecord,
          },
        }))
      // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.Errors.html#Programming.Errors.BatchOperations
      // "A batch operation can tolerate the failure of individual requests in the batch."
      const response = await this.documentClient
        .batchWrite({
          RequestItems: requestItems,
        })
        .promise()
      log.debug(`BatchWriteItemOutput: ${JSON.stringify(response)}`)
      if (
        response.UnprocessedItems &&
        Object.keys(response.UnprocessedItems).length > 0
      ) {
        const unprocessedXapiRecords = response.UnprocessedItems[
          this.tableName
        ].map((x) => x.PutRequest?.Item as XapiRecord)
        await this.sendOneAtATime(unprocessedXapiRecords)
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : e
      log.error(
        `Could not write batch to dynamodb: ${message}\nNow attempting to send one at a time...`,
      )
      await this.sendOneAtATime(xapiRecords)
    }
    return true
  }

  private async sendOneAtATime(xapiRecords: ReadonlyArray<XapiRecord>) {
    for (const xapiRecord of xapiRecords) {
      try {
        const response = await this.documentClient
          .put({
            TableName: this.tableName,
            Item: xapiRecord,
          })
          .promise()
        log.debug(`PutItemOutput: ${JSON.stringify(response)}`)
      } catch (e) {
        const message = e instanceof Error ? e.message : e
        log.error(
          `Could not write event for user(${xapiRecord.userId}) with server timestamp (${xapiRecord.serverTimestamp}) to dynamodb: ${message}`,
        )
      }
    }
  }

  private static getDefaultClient() {
    return new DocumentClient({
      endpoint: process.env.LOCALSTACK_ENDPOINT,
      apiVersion: '2012-08-10',
    })
  }
}
