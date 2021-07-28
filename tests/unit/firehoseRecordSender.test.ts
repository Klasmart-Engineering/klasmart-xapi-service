import { expect } from 'chai'
import { FirehoseClient } from '@aws-sdk/client-firehose'
import { FirehoseRecordSender } from '../../src/recordSenders/firehoseRecordSender'
import { XapiRecordBuilder } from '../toolbox/builders/xapiRecordBuilder'
import Substitute, { Arg } from '@fluffy-spoon/substitute'

describe('firehoseRecordSender', () => {
  context('1 xapi record', () => {
    it('executes successfully and returns true', async () => {
      // Arrange
      const firehoseClient = Substitute.for<FirehoseClient>()
      const deliveryStreamName = 'stream-a'
      const sut = FirehoseRecordSender.create(
        firehoseClient,
        deliveryStreamName,
      )
      const xapiRecord = new XapiRecordBuilder().build()

      const xapiRecordJson = JSON.stringify(xapiRecord) + '\n'
      const firehoseRecord = { Data: Buffer.from(xapiRecordJson) }

      // Act
      const success = await sut.sendRecords([xapiRecord])

      // Assert
      expect(success).to.be.true
      firehoseClient
        .received(1)
        .send(
          Arg.is(
            (x) =>
              (x.input as any).DeliveryStreamName === deliveryStreamName &&
              (x.input as any).Records.length === 1 &&
              Buffer.compare(
                (x.input as any).Records[0].Data,
                firehoseRecord.Data,
              ) === 0,
          ),
        )
    })
  })
})
