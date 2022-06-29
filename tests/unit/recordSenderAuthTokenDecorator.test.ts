import { expect } from 'chai'
import { RedisStreamRecordSender } from '../../src/recordSenders/redisStreamRecordSender'
import { XapiRecordBuilder } from '../toolbox/builders/xapiRecordBuilder'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { RecordSenderAuthTokenDecorator } from '../../src/recordSenders/recordSenderAuthTokenDecorator'
import { XapiRecord } from '../../src/interfaces/xapiRecord'

describe('recordSenderAuthTokenDecorator', () => {
  context(
    '2 xapi records, roomId defined, encodedAuthenticationToken defined',
    () => {
      const recordSender = Substitute.for<RedisStreamRecordSender>()
      const encodedAuthenticationToken = 'dummy token'
      const xapiRecords: XapiRecord[] = []
      let success: boolean

      before(async () => {
        const sut = new RecordSenderAuthTokenDecorator(recordSender)
        xapiRecords[0] = new XapiRecordBuilder().withRoomId('room1').build()
        recordSender.sendRecords(Arg.any(), Arg.any()).resolves(true)

        // Act
        success = await sut.sendRecords(xapiRecords, {
          encodedAuthenticationToken,
          roomId: 'room1',
        })
      })

      it('returns true', async () => {
        expect(success).to.be.true
      })

      it('Redis recordSender.sendRecords is only called once', async () => {
        recordSender.received(1).sendRecords(Arg.all())
      })

      it(
        'Redis recordSender.sendRecords receives xapiRecord1 with the addition of an ' +
          '"authenticationToken" property',
        () => {
          const expectedxapiRecord = {
            ...xapiRecords[0],
            authenticationToken: encodedAuthenticationToken,
          }
          recordSender.received(1).sendRecords(
            Arg.is((x) => {
              if (!x || x.length !== 1) {
                return false
              }
              expect(x[0]).to.deep.equal(expectedxapiRecord)
              return true
            }),
          )
        },
      )

      it(
        'Redis recordSender.sendRecords receives xapiRecord2 without an ' +
          '"authenticationToken" property',
        () => {
          const expectedxapiRecord = xapiRecords[1]
          recordSender.received(1).sendRecords(
            Arg.is((x) => {
              if (!x || x.length !== 1) {
                return false
              }
              expect(x[1]).to.deep.equal(expectedxapiRecord)
              return true
            }),
          )
        },
      )

      it('original xapi record is not modified', async () => {
        expect('authenticationToken' in xapiRecords[0]).to.be.false
      })
    },
  )

  context(
    '1 xapi record, roomId not defined, encodedAuthenticationToken defined',
    () => {
      const recordSender = Substitute.for<RedisStreamRecordSender>()
      const encodedAuthenticationToken = 'dummy token'
      let xapiRecord: XapiRecord
      let success: boolean

      before(async () => {
        const sut = new RecordSenderAuthTokenDecorator(recordSender)
        xapiRecord = new XapiRecordBuilder().withRoomId(undefined).build()
        recordSender.sendRecords(Arg.any(), Arg.any()).resolves(true)

        // Act
        success = await sut.sendRecords([xapiRecord], {
          encodedAuthenticationToken,
          roomId: undefined,
        })
      })

      it('returns true', async () => {
        expect(success).to.be.true
      })

      it('Redis recordSender.sendRecords is only called once', async () => {
        recordSender.received(1).sendRecords(Arg.all())
      })

      it(
        'Redis recordSender.sendRecords receives xapi record without an ' +
          '"authenticationToken" property',
        () => {
          const expectedxapiRecord = xapiRecord
          recordSender.received(1).sendRecords(
            Arg.is((x) => {
              if (!x || x.length !== 1) {
                return false
              }
              expect(x?.[0]).to.deep.equal(expectedxapiRecord)
              return true
            }),
          )
        },
      )
    },
  )

  context(
    '1 xapi record, roomId defined, encodedAuthenticationToken not defined',
    () => {
      const recordSender = Substitute.for<RedisStreamRecordSender>()
      const encodedAuthenticationToken = undefined
      let xapiRecord: XapiRecord
      let success: boolean

      before(async () => {
        const sut = new RecordSenderAuthTokenDecorator(recordSender)
        xapiRecord = new XapiRecordBuilder().withRoomId('room1').build()
        recordSender.sendRecords(Arg.any(), Arg.any()).resolves(true)

        // Act
        success = await sut.sendRecords([xapiRecord], {
          encodedAuthenticationToken,
          roomId: 'room1',
        })
      })

      it('returns true', async () => {
        expect(success).to.be.true
      })

      it('Redis recordSender.sendRecords is only called once', async () => {
        recordSender.received(1).sendRecords(Arg.all())
      })

      it(
        'Redis recordSender.sendRecords receives xapi record without an ' +
          '"authenticationToken" property',
        () => {
          const expectedxapiRecord = xapiRecord
          recordSender.received(1).sendRecords(
            Arg.is((x) => {
              if (!x || x.length !== 1) {
                return false
              }
              expect(x?.[0]).to.deep.equal(expectedxapiRecord)
              return true
            }),
          )
        },
      )
    },
  )
})
