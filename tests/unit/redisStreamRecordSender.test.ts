import { expect } from 'chai'
import {
  RedisStreamRecordSender,
  RedisClientType,
} from '../../src/recordSenders/redisStreamRecordSender'
import { XapiRecordBuilder } from '../toolbox/builders/xapiRecordBuilder'
import Substitute, { Arg } from '@fluffy-spoon/substitute'

describe('redisStreamRecordSender', () => {
  context('2 xapi records', () => {
    it('executes successfully and returns true', async () => {
      const redisClient = Substitute.for<RedisClientType>()
      const deliveryStream = 'stream-a'
      const recordSender = new RedisStreamRecordSender(
        redisClient,
        deliveryStream,
      )
      const xapiRecord = new XapiRecordBuilder().build()

      const outputEntryId = '12345679786708-0'
      redisClient
        .xadd(Arg.any(), Arg.any(), Arg.any(), Arg.any())
        .resolves(outputEntryId)

      const success = await recordSender.sendRecords([xapiRecord, xapiRecord])

      // Assert
      expect(success).to.be.true
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      redisClient.received(2).xadd(
        Arg.is((stream) => stream === deliveryStream),
        Arg.is((id) => id === '*'),
        Arg.is((field) => field === 'data'),
        Arg.is((data) => {
          return data != null && data === JSON.stringify(xapiRecord)
        }),
      )
    })
  })
})
