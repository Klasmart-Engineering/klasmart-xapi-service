import { expect } from 'chai'
import {
  KinesisClient,
  PutRecordsCommand,
  PutRecordsCommandOutput,
} from '@aws-sdk/client-kinesis'
import { KinesisDataStreamRecordSender } from '../../src/recordSenders/kinesisDataStreamRecordSender'
import { XapiRecordBuilder } from '../toolbox/builders/xapiRecordBuilder'
import Substitute, { Arg } from '@fluffy-spoon/substitute'

describe('kinesisDataStreamRecordSender', () => {
  context('1 xapi record', () => {
    it('executes successfully and returns true', async () => {
      const kinesisClient = Substitute.for<KinesisClient>()
      const deliveryStream = 'stream-a'
      const recordSender = KinesisDataStreamRecordSender.create(
        deliveryStream,
        kinesisClient,
      )
      const xapiRecord = new XapiRecordBuilder().build()
      const kinesisRecord = {
        Data: Buffer.from(JSON.stringify(xapiRecord) + '\n'),
      }
      const commandOutput: PutRecordsCommandOutput = {
        FailedRecordCount: 0,
        Records: Arg.any(),
        $metadata: { httpStatusCode: 200 },
      }
      kinesisClient.send(Arg.all()).resolves(commandOutput)

      const success = await recordSender.sendRecords([xapiRecord])

      // Assert
      expect(success).to.be.true
      kinesisClient.received(1).send(
        Arg.is((x) => {
          const command = x as PutRecordsCommand
          return (
            command &&
            command.input.StreamName === deliveryStream &&
            command.input.Records?.length === 1 &&
            command.input.Records[0].Data != null &&
            Buffer.compare(
              command.input.Records[0].Data,
              kinesisRecord.Data,
            ) === 0
          )
        }),
      )
    })
  })
})
