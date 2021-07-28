import { expect } from 'chai'
import Substitute from '@fluffy-spoon/substitute'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { DynamoDbRecordSender } from '../../src/recordSenders/dynamoDbRecordSender'
import { XapiRecordBuilder } from '../toolbox/builders/xapiRecordBuilder'
import { DynamoDbResponseBuilder } from '../toolbox/builders/dynamoDbResponseBuilder'

describe('dynamoDbRecordSender', () => {
  context('1 xapi record', () => {
    it('executes successfully and returns true', async () => {
      // Arrange
      const tableName = 'table-a'
      const documentClient = Substitute.for<DocumentClient>()
      const batchWriteResult = new DynamoDbResponseBuilder().build()
      const xapiRecord = new XapiRecordBuilder().build()

      // batchWrite argument
      const requestItems: DocumentClient.BatchWriteItemRequestMap = {}
      requestItems[tableName] = [xapiRecord].map<DocumentClient.WriteRequest>(
        (xapiRecord) => ({
          PutRequest: {
            Item: xapiRecord,
          },
        }),
      )

      documentClient
        .batchWrite({ RequestItems: requestItems })
        .returns(batchWriteResult)

      const sut = DynamoDbRecordSender.create(documentClient, tableName)

      // Act
      const success = await sut.sendRecords([xapiRecord])

      // Assert
      expect(success).to.be.true
      // TODO: Specify argument.
      documentClient.received(1).batchWrite({ RequestItems: requestItems })
    })
  })
})
