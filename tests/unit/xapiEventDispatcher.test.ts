import { expect } from 'chai'
import { createHash } from 'crypto'
import { Context } from '../../src/helpers/context'
import { XapiEventDispatcher } from '../../src/xapiEventDispatcher'
import { IXapiRecordSender } from '../../src/interfaces/xapiRecordSender'
import { Substitute, Arg } from '@fluffy-spoon/substitute'
import { IGeolocationInfo } from '../../src/interfaces/geolocationInfo'
import { IGeolocationProvider } from '../../src/interfaces/geolocationProvider'

describe('xapiEventDispatcher.dispatchEvents', () => {
  const ip = 'my-ip'
  const authenticationToken = {
    email: 'my_email@gmail.com',
    id: 'my-user-id',
    exp: 0,
    iss: 'my-iss',
  }
  const ipHash = createHash('sha256').update(ip).digest('hex')
  const xapiEventObj = { a: '1', b: '2' }
  const xapiEvent = JSON.stringify(xapiEventObj)
  const xapiEvents = [xapiEvent]
  const geo: IGeolocationInfo = { country: 'KR' }

  context('authenticationToken is defined', () => {
    const authContext: Context = { ip, authenticationToken }
    const geolocationProvider = Substitute.for<IGeolocationProvider>()
    const recordSender = Substitute.for<IXapiRecordSender>()

    before(() => {
      geolocationProvider.getInfo(ip).returns(geo)
      recordSender.sendRecords(Arg.all()).resolves(true)
    })

    it('executes successfully and returns true', async () => {
      const sut = new XapiEventDispatcher([recordSender], geolocationProvider)
      const success = await sut.dispatchEvents(
        { xAPIEvents: xapiEvents },
        authContext,
      )
      geolocationProvider.received(1).getInfo(ip)

      recordSender.received(1).sendRecords(
        Arg.is((records) => {
          return (
            records.length === 1 &&
            records[0].userId === authContext.authenticationToken?.id &&
            records[0].ipHash === ipHash &&
            records[0].geo === geo
          )
        }),
        Arg.any(),
      )

      expect(success).to.be.true
    })
  })

  context('authenticationToken is undefined', () => {
    const authContext: Context = { ip, authenticationToken: undefined }
    const geolocationProvider = Substitute.for<IGeolocationProvider>()
    const recordSender = Substitute.for<IXapiRecordSender>()

    before(() => {
      geolocationProvider.getInfo(ip).returns(geo)
    })

    it('executes dispatch and returns false', async () => {
      const sut = new XapiEventDispatcher([recordSender], geolocationProvider)
      const response = await sut.dispatchEvents(
        { xAPIEvents: xapiEvents },
        authContext,
      )
      geolocationProvider.received(0).getInfo(ip)
      recordSender.received(0).sendRecords(Arg.all())

      expect(response).to.be.false
    })
  })

  context(
    'recordSender1 throws an exception; recordSender2 returns true',
    () => {
      const authContext: Context = { ip, authenticationToken }
      const geolocationProvider = Substitute.for<IGeolocationProvider>()
      const recordSender1 = Substitute.for<IXapiRecordSender>()
      const recordSender2 = Substitute.for<IXapiRecordSender>()

      before(() => {
        geolocationProvider.getInfo(ip).returns(geo)
        recordSender1.sendRecords(Arg.any(), Arg.any()).rejects('oops')
        recordSender2.sendRecords(Arg.any(), Arg.any()).resolves(true)
      })

      it('recordSender2 executes successfully and returns true', async () => {
        const sut = new XapiEventDispatcher(
          [recordSender1, recordSender2],
          geolocationProvider,
        )
        const success = await sut.dispatchEvents(
          { xAPIEvents: xapiEvents },
          authContext,
        )
        geolocationProvider.received(1).getInfo(ip)

        recordSender2.received(1).sendRecords(
          Arg.is((records) => {
            return (
              records.length === 1 &&
              records[0].userId === authContext.authenticationToken?.id &&
              records[0].ipHash === ipHash &&
              records[0].geo === geo
            )
          }),
          Arg.any(),
        )

        expect(success).to.be.false
      })
    },
  )

  context('recordSender returns false', () => {
    const authContext: Context = { ip, authenticationToken }
    const geolocationProvider = Substitute.for<IGeolocationProvider>()
    const recordSender = Substitute.for<IXapiRecordSender>()

    before(() => {
      geolocationProvider.getInfo(ip).returns(geo)
      recordSender.sendRecords(Arg.any(), Arg.any()).resolves(false)
    })

    it('returns false', async () => {
      const sut = new XapiEventDispatcher([recordSender], geolocationProvider)
      const success = await sut.dispatchEvents(
        { xAPIEvents: xapiEvents },
        authContext,
      )

      expect(success).to.be.false
    })
  })

  context('string is provided rather than a string array', () => {
    const authContext: Context = { ip, authenticationToken: undefined }
    const geolocationProvider = Substitute.for<IGeolocationProvider>()
    const recordSender = Substitute.for<IXapiRecordSender>()

    before(() => {
      geolocationProvider.getInfo(ip).returns(geo)
    })

    it('executes dispatch and returns false', async () => {
      const sut = new XapiEventDispatcher([recordSender], geolocationProvider)
      const response = await sut.dispatchEvents(
        { xAPIEvents: xapiEvent },
        authContext,
      )
      geolocationProvider.received(0).getInfo(ip)
      recordSender.received(0).sendRecords(Arg.any(), Arg.any())

      expect(response).to.be.false
    })
  })

  context('xapiEvent.userId is defined', () => {
    const authContext: Context = { ip, authenticationToken }
    const geolocationProvider = Substitute.for<IGeolocationProvider>()
    const recordSender = Substitute.for<IXapiRecordSender>()
    let success = false

    before(async () => {
      // Arrange
      const xapiEventObj = { a: '1', b: '2', userId: 'user1' }
      const xapiEvent = JSON.stringify(xapiEventObj)
      const xapiEvents = [xapiEvent]
      geolocationProvider.getInfo(ip).returns(geo)
      recordSender.sendRecords(Arg.all()).resolves(true)
      const sut = new XapiEventDispatcher([recordSender], geolocationProvider)

      // Act
      success = await sut.dispatchEvents(
        { xAPIEvents: xapiEvents },
        authContext,
      )
    })

    it('returns true', async () => {
      expect(success).to.be.true
    })

    it('recordSender.sendRecords is called once with expected record', async () => {
      recordSender.received(1).sendRecords(
        Arg.is((records) => {
          return (
            records.length === 1 &&
            // ================ KEY DIFFERENCE ================
            records[0].userId === 'user1' &&
            // ================ KEY DIFFERENCE ================
            records[0].ipHash === ipHash &&
            records[0].geo === geo
          )
        }),
        Arg.any(),
      )
    })

    it('geolocationProvider.getInfo is called once with expected ip', async () => {
      geolocationProvider.received(1).getInfo(ip)
    })
  })
})
