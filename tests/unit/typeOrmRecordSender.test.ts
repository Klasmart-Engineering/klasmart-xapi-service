import { expect } from 'chai'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { Repository } from 'typeorm'
import { XapiDbRecord } from '../../src/recordSenders/typeorm/entities/xapiDbRecord'
import { TypeOrmRecordSender } from '../../src/recordSenders/typeorm/typeOrmRecordSender'
import { XapiRecordBuilder } from '../toolbox/builders/xapiRecordBuilder'

describe('typeOrmRecordSender', () => {
  context('1 xapi record', () => {
    it('executes successfully and returns true', async () => {
      // Arrange
      const xapiRepository = Substitute.for<Repository<XapiDbRecord>>()
      xapiRepository.create().returns(new XapiDbRecord())
      const sut = new TypeOrmRecordSender(xapiRepository)
      const xapiRecord = new XapiRecordBuilder().build()

      // Act
      const success = await sut.sendRecords([xapiRecord])

      // Assert
      expect(success).to.be.true

      const expected: XapiDbRecord = {
        ipHash: xapiRecord.ipHash,
        serverTimestamp: xapiRecord.serverTimestamp,
        userId: xapiRecord.userId,
        roomId: xapiRecord.roomId,
        geo: xapiRecord.geo,
        xapi: xapiRecord.xapi,
      }
      xapiRepository.received(1).save(
        Arg.is((dbRecords) => {
          expect(dbRecords).to.have.lengthOf(1)
          expect(dbRecords[0]).to.deep.equal(expected)
          return true
        }),
      )
    })
  })
})
