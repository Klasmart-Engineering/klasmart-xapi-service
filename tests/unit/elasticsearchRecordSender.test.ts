import { expect } from 'chai'
import { Client as ElasticsearchClient } from '@elastic/elasticsearch'
import { ElasticsearchRecordSender } from '../../src/recordSenders/elasticsearchRecordSender'
import { XapiRecordBuilder } from '../toolbox/builders/xapiRecordBuilder'
import Substitute, { Arg } from '@fluffy-spoon/substitute'

describe('elasticsearchRecordSender', () => {
  context('1 xapi record', () => {
    it('executes successfully and returns true', async () => {
      // Arrange
      const client = Substitute.for<ElasticsearchClient>()
      const response = {
        body: { errors: undefined },
        statusCode: null,
        warnings: null,
        headers: null,
        meta: Arg.any(),
      }
      client.bulk(Arg.any()).resolves(response)
      const sut = await ElasticsearchRecordSender.create(client)
      const xapiRecord = new XapiRecordBuilder().build()
      const body = [xapiRecord].flatMap((xapiRecord) => [
        { index: { _index: 'xapi' } },
        xapiRecord,
      ])

      // Act
      const success = await sut.sendRecords([xapiRecord])

      // Assert
      expect(success).to.be.true
      client.received(1).bulk({ body })
    })
  })
})
