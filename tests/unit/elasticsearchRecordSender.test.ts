import { expect } from 'chai'
import type {
  ApiResponse,
  Client as ElasticsearchClient,
} from '@elastic/elasticsearch/api/new'
import { ElasticsearchRecordSender } from '../../src/recordSenders/elasticsearchRecordSender'
import { XapiRecordBuilder } from '../toolbox/builders/xapiRecordBuilder'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { BulkResponse } from '@elastic/elasticsearch/api/types'

describe('elasticsearchRecordSender', () => {
  context('1 xapi record; client returns success response', () => {
    it('returns true', async () => {
      // Arrange
      const client = Substitute.for<ElasticsearchClient>()
      const response: ApiResponse<BulkResponse, unknown> = {
        body: { errors: false, items: [], took: 200 },
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

  context('1 xapi record; client returns error response', () => {
    it('returns false', async () => {
      // Arrange
      const client = Substitute.for<ElasticsearchClient>()
      const response: ApiResponse<BulkResponse, unknown> = {
        body: {
          errors: true,
          items: [
            {
              create: {
                status: 500,
                _index: Arg.any(),
                error: { type: 'Internal Server Error', reason: 'Unkown' },
              },
            },
          ],
          took: 200,
        },
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
      expect(success).to.be.false
      client.received(1).bulk({ body })
    })
  })
})
