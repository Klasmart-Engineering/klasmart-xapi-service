import { expect } from 'chai'
import {
  RedisStreamRecordSender,
  RedisClientType,
} from '../../src/recordSenders/redisStreamRecordSender'
import { XapiRecordBuilder } from '../toolbox/builders/xapiRecordBuilder'
import Substitute, { Arg } from '@fluffy-spoon/substitute'

describe.only('redisStreamRecordSender', () => {
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
      redisClient.xAdd(Arg.any(), Arg.any(), Arg.any()).resolves(outputEntryId)

      const success = await recordSender.sendRecords([xapiRecord, xapiRecord])

      // Assert
      expect(success).to.be.true
      redisClient.received(2).xAdd(
        // @ts-ignore
        Arg.is((stream) => stream === deliveryStream),
        Arg.is((id) => id === '*'),
        // @ts-ignore
        Arg.is((data) => {
          // @ts-ignore
          return data && data.data && data.data === JSON.stringify(xapiRecord)
        }),
      )
    })
  })
})
