import { expect } from 'chai'
import { Connection, Repository } from 'typeorm'
import { XapiDbRecord } from '../../src/recordSenders/typeorm/entities/xapiDbRecord'
import { TypeOrmRecordSender } from '../../src/recordSenders/typeorm/typeOrmRecordSender'
import {
  ApolloServerTestClient,
  createTestClient,
} from '../toolbox/helpers/createTestClient'
import { createApolloServer } from '../../src/helpers/createApolloServer'
import { XapiEventDispatcher } from '../../src/xapiEventDispatcher'
import { sendEventsMutation } from '../toolbox/helpers/sendEventsMutation'
import EndUserBuilder from '../toolbox/builders/endUserBuilder'
import { createHash } from 'crypto'
import { GeoIPLite } from '../../src/helpers/geoipLite'
import geoip from 'geoip-lite'
import { connectToTypeOrmDatabase } from '../../src/recordSenders/typeorm/connectToTypeOrmDatabase'

import dotenv from 'dotenv'
dotenv.config({ path: process.env.CI ? '.env.test.ci' : '.env.test' })

describe('xapiEventDispatcher', () => {
  let connection: Connection
  let xapiRepository: Repository<XapiDbRecord>
  let testClient: ApolloServerTestClient

  before(async () => {
    const routePrefix = ''
    const geolocationProvider = new GeoIPLite()
    connection = await connectToTypeOrmDatabase()
    xapiRepository = connection.getRepository(XapiDbRecord)
    const typeOrmRecordSender = new TypeOrmRecordSender(xapiRepository)
    const server = createApolloServer(
      new XapiEventDispatcher([typeOrmRecordSender], geolocationProvider),
      routePrefix,
    )
    testClient = createTestClient(server)
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
        authorization: endUser.token,
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

  context(
    'authenticated via header, 1 record sender (TypeORM), 1 xapi record',
    () => {
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
          authorization: endUser.token,
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

        const expected = {
          ipHash: ipHash,
          // TODO: Not really a way to specify the expected serverTimestamp.
          // Might be useful to create a 'withinRange' helper function to
          // at least enforce a good estimate.
          //serverTimestamp: serverTimestamp,
          userId: endUser.userId,
          geo: geo,
          xapi: xapiEventObj,
        }

        const actual = await xapiRepository.findOne()
        expect(actual).to.deep.include(expected)
      })
    },
  )

  context(
    'authenticated via cookie, 1 record sender (TypeORM), 1 xapi record',
    () => {
      it('returns true and adds 1 entry to the database', async () => {
        // Arrange
        const xapiEventObj = { a: '1', b: '2' }
        const xapiEvent = JSON.stringify(xapiEventObj)
        const xapiEvents = [xapiEvent]
        const ip = '220.80.15.135'
        const ipHash = createHash('sha256').update(ip).digest('hex')
        const geo = geoip.lookup(ip)
        const endUser = new EndUserBuilder().authenticate().build()
        const cookies = { access: endUser.token }
        const headers = { 'x-forwarded-for': ip }

        // Act
        const success = await sendEventsMutation(
          testClient,
          xapiEvents,
          headers,
          cookies,
        )

        // Assert
        expect(success).to.be.true

        const expected = {
          ipHash: ipHash,
          // TODO: Not really a way to specify the expected serverTimestamp.
          // Might be useful to create a 'withinRange' helper function to
          // at least enforce a good estimate.
          //serverTimestamp: serverTimestamp,
          userId: endUser.userId,
          geo: geo,
          xapi: xapiEventObj,
        }

        const actual = await xapiRepository.findOne()
        expect(actual).to.deep.include(expected)
      })
    },
  )
})
