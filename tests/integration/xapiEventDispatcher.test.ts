import { expect } from 'chai'
import { Connection, FindConditions, Repository } from 'typeorm'
import { XapiDbRecord } from '../../src/recordSenders/typeorm/entities/xapiDbRecord'
import { TypeOrmRecordSender } from '../../src/recordSenders/typeorm/typeOrmRecordSender'
import {
  ApolloServerTestClient,
  createTestClient,
} from '../toolbox/helpers/createTestClient'
import { XapiEventDispatcher } from '../../src/xapiEventDispatcher'
import { sendEventsMutation } from '../toolbox/helpers/sendEventsMutation'
import EndUserBuilder from '../toolbox/builders/endUserBuilder'
import { createHash } from 'crypto'
import { GeoIPLite } from '../../src/helpers/geoipLite'
import geoip from 'geoip-lite'
import { connectToTypeOrmDatabase } from '../../src/recordSenders/typeorm/connectToTypeOrmDatabase'

import createXapiServer from '../../src/initialization/createXapiServer'
import { throwExpression } from '../../src/helpers/throwExpression'
import { generateLiveAuthorizationToken } from '../toolbox/helpers/tokenGenerators'
import { XapiRecord } from '../../src/interfaces/xapiRecord'

describe('xapiEventDispatcher', () => {
  let connection: Connection
  let xapiRepository: Repository<XapiDbRecord>
  let testClient: ApolloServerTestClient

  before(async () => {
    const geolocationProvider = new GeoIPLite()
    const databaseUrl =
      process.env.XAPI_DATABASE_URL ??
      throwExpression('XAPI_DATABASE_URL is undefined')
    connection = await connectToTypeOrmDatabase(databaseUrl)
    xapiRepository = connection.getRepository(XapiDbRecord)
    const typeOrmRecordSender = new TypeOrmRecordSender(xapiRepository)
    const { app, server } = await createXapiServer(
      new XapiEventDispatcher([typeOrmRecordSender], geolocationProvider),
    )
    testClient = createTestClient(server, app)
  })

  after(async () => {
    await connection?.close()
  })

  beforeEach(async () => {
    await connection?.synchronize(true)
  })

  context('not authenticated, 1 record sender (TypeORM), 1 xapi record', () => {
    it('returns false and adds NO entries to the database', async () => {
      // Arrange
      const xapiEventObj = { a: '1', b: '2' }
      const xapiEvent = JSON.stringify(xapiEventObj)
      const xapiEvents = [xapiEvent]
      const ip = '220.80.15.135'
      const endUser = new EndUserBuilder().dontAuthenticate().build()
      const headers = {
        cookie: `access=${endUser.token}`,
        'x-forwarded-for': ip,
      }

      // Act
      const response = await sendEventsMutation(testClient, xapiEvents, headers)

      // Assert
      expect(response).to.be.false

      const numRecords = await xapiRepository.count()
      expect(numRecords).to.equal(0)
    })
  })

  context('1 record sender (TypeORM), 1 xapi record', () => {
    it('returns true and adds 1 entry to the database', async () => {
      // Arrange
      const xapiEventObj = { a: '1', b: '2' }
      const xapiEvent = JSON.stringify(xapiEventObj)
      const xapiEvents = [xapiEvent]
      const ip = '220.80.15.135'
      const ipHash = createHash('sha256').update(ip).digest('hex')
      const geo = geoip.lookup(ip)
      const endUser = new EndUserBuilder().authenticate().build()
      const headers = {
        'x-forwarded-for': ip,
        cookie: `access=${endUser.token}`,
      }

      // Act
      const success = await sendEventsMutation(testClient, xapiEvents, headers)

      // Assert
      expect(success).to.be.true

      const expected: FindConditions<XapiRecord> = {
        ipHash: ipHash,
        // TODO: Not really a way to specify the expected serverTimestamp.
        // Might be useful to create a 'withinRange' helper function to
        // at least enforce a good estimate.
        //serverTimestamp: serverTimestamp,
        userId: endUser.userId,
        roomId: null,
        isReview: false,
        geo: geo,
        xapi: xapiEventObj,
      }

      const actual = await xapiRepository.findOne()
      expect(actual).to.deep.include(expected)
    })
  })

  context(
    '1 record sender (TypeORM), 1 xapi record, live authorization header included',
    () => {
      it('returns true and adds 1 entry to the database, including a room id', async () => {
        // Arrange
        const xapiEventObj = { a: '1', b: '2' }
        const xapiEvent = JSON.stringify(xapiEventObj)
        const xapiEvents = [xapiEvent]
        const ip = '220.80.15.135'
        const ipHash = createHash('sha256').update(ip).digest('hex')
        const geo = geoip.lookup(ip)
        const endUser = new EndUserBuilder().authenticate().build()
        const roomId = 'room1'
        const isReview = true
        const liveAuthorizationToken = generateLiveAuthorizationToken(
          endUser.userId,
          roomId,
          isReview,
        )
        const headers = {
          'x-forwarded-for': ip,
          'live-authorization': liveAuthorizationToken,
          cookie: `access=${endUser.token}`,
        }

        // Act
        const success = await sendEventsMutation(
          testClient,
          xapiEvents,
          headers,
        )

        // Assert
        expect(success).to.be.true

        const expected: FindConditions<XapiRecord> = {
          ipHash,
          // TODO: Not really a way to specify the expected serverTimestamp.
          // Might be useful to create a 'withinRange' helper function to
          // at least enforce a good estimate.
          //serverTimestamp: serverTimestamp,
          userId: endUser.userId,
          roomId,
          isReview,
          geo,
          xapi: xapiEventObj,
        }

        const actual = await xapiRepository.findOne()
        expect(actual).to.deep.include(expected)
      })
    },
  )

  context(
    'invalid access cookie, 1 record sender (TypeORM), 1 xapi record',
    () => {
      it('returns false and adds NO entries to the database', async () => {
        // Arrange
        const xapiEventObj = { a: '1', b: '2' }
        const xapiEvent = JSON.stringify(xapiEventObj)
        const xapiEvents = [xapiEvent]
        const ip = '220.80.15.135'
        const headers = {
          cookie: `access=${'{}'}`,
          'x-forwarded-for': ip,
        }

        // Act
        const success = await sendEventsMutation(
          testClient,
          xapiEvents,
          headers,
        )

        // Assert
        expect(success).to.be.false

        const numRecords = await xapiRepository.count()
        expect(numRecords).to.equal(0)
      })
    },
  )

  context(
    'invalid live authorizion token, 1 record sender (TypeORM), 1 xapi record',
    () => {
      it('returns false and adds NO entries to the database', async () => {
        // Arrange
        const xapiEventObj = { a: '1', b: '2' }
        const xapiEvent = JSON.stringify(xapiEventObj)
        const xapiEvents = [xapiEvent]
        const ip = '220.80.15.135'
        const ipHash = createHash('sha256').update(ip).digest('hex')
        const geo = geoip.lookup(ip)
        const endUser = new EndUserBuilder().authenticate().build()
        const headers = {
          'live-authorization': '{}',
          cookie: `access=${endUser.token}`,
          'x-forwarded-for': ip,
        }

        // Act
        const success = await sendEventsMutation(
          testClient,
          xapiEvents,
          headers,
        )

        // Assert
        expect(success).to.be.true

        const expected: FindConditions<XapiRecord> = {
          ipHash,
          // TODO: Not really a way to specify the expected serverTimestamp.
          // Might be useful to create a 'withinRange' helper function to
          // at least enforce a good estimate.
          //serverTimestamp: serverTimestamp,
          userId: endUser.userId,
          isReview: false,
          roomId: null,
          geo,
          xapi: xapiEventObj,
        }

        const actual = await xapiRepository.findOne()
        expect(actual).to.deep.include(expected)
      })
    },
  )
})
