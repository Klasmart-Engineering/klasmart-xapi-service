import { expect } from 'chai'
import { Connection, Repository } from 'typeorm'
import { XapiDbRecord } from '../../src/recordSenders/typeorm/entities/xapiDbRecord'
import { TypeOrmRecordSender } from '../../src/recordSenders/typeorm/typeOrmRecordSender'
import { XapiRecordBuilder } from '../toolbox/builders/xapiRecordBuilder'
import { createXapiDbConnection } from '../toolbox/helpers/testConnection'

describe('typeOrmRecordSender', () => {
  let connection: Connection
  let xapiRepository: Repository<XapiDbRecord>

  before(async () => {
    connection = await createXapiDbConnection()
    xapiRepository = connection.getRepository(XapiDbRecord)
  })

  after(async () => {
    await connection?.close()
  })

  beforeEach(async () => {
    await connection?.synchronize(true)
  })

  context('1 xapi record', () => {
    it('returns true and adds 1 entry to the database', async () => {
      // Arrange
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
        geo: xapiRecord.geo,
        xapi: xapiRecord.xapi,
      }

      const actual = await xapiRepository.findOne()
      expect(actual).to.deep.equal(expected)
    })
  })
})
