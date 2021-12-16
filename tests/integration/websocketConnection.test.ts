import dotenv from 'dotenv'
import createXapiServer from '../../src/initialization/createXapiServer'
import { gql, ApolloClient, InMemoryCache } from '@apollo/client'
import { WebSocketLink } from '@apollo/client/link/ws'
import ws from 'ws'
import { createServer, Server } from 'http'
import { createHttpTerminator, HttpTerminator } from 'http-terminator'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import EndUserBuilder from '../toolbox/builders/endUserBuilder'
import { XapiEventDispatcher } from '../../src/xapiEventDispatcher'
import { GeoIPLite } from '../../src/helpers/geoipLite'
import { generateLiveAuthorizationToken } from '../toolbox/helpers/tokenGenerators'
import { gqlTry } from '../toolbox/helpers/gqlTry'
import { assert, expect } from 'chai'
import { getConnection, Repository } from 'typeorm'
import getRecordSenders from '../../src/initialization/getRecordSenders'
import {
  bucketName,
  clearDynamoDbTable,
  clearS3Bucket,
  prepareLocalstackServices,
} from '../toolbox/helpers/localstackHelpers'
import { GraphQLResponse } from 'apollo-server-core'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import AWS from 'aws-sdk'
import { XapiDbRecord } from '../../src/recordSenders/typeorm/entities/xapiDbRecord'
import { createHash } from 'crypto'
import geoip from 'geoip-lite'
import {
  deleteElasticsearchIndex,
  getToalItemsInElasticsearch,
} from '../toolbox/helpers/elasticsearchHelpers'
dotenv.config({ path: process.env.CI ? '.env.test.ci' : '.env.test' })

describe('websocketConnection', () => {
  const xapiEventObj = { a: '1', b: '2' }
  const xapiEvent = JSON.stringify(xapiEventObj)
  const ip = '220.80.15.135'
  const ipHash = createHash('sha256').update(ip).digest('hex')
  const geo = geoip.lookup(ip)
  let httpServer: Server
  let httpTerminator: HttpTerminator
  let subscriptionClient: SubscriptionClient
  let xapiRepository: Repository<XapiDbRecord>

  const sendEventsMutation = gql`
    mutation xapi($xapiEvents: [String!]!) {
      sendEvents(xAPIEvents: $xapiEvents)
    }
  `

  before(async () => {
    await prepareLocalstackServices()
    const geolocationProvider = new GeoIPLite()
    const recordSenders = await getRecordSenders()
    xapiRepository = getConnection().getRepository(XapiDbRecord)
    const { app, server } = await createXapiServer(
      new XapiEventDispatcher(recordSenders, geolocationProvider),
    )
    httpServer = createServer(app)
    server.installSubscriptionHandlers(httpServer)
    httpTerminator = createHttpTerminator({ server: httpServer })
    httpServer.listen(8081, 'localhost')
  })

  after(async () => {
    await httpTerminator?.terminate()
    try {
      await getConnection().close()
    } catch (e) {
      // Ignore.
    }
  })

  afterEach(async () => {
    subscriptionClient?.close()
  })

  context(
    'authentication token and live authorization token are provided',
    () => {
      const roomId = 'test-room'
      let gqlResponse: GraphQLResponse
      let userId: string

      before(async () => {
        await clearDynamoDbTable()
        await deleteElasticsearchIndex()
        await clearS3Bucket(bucketName)
        await getConnection().synchronize(true)

        const endUser = new EndUserBuilder().authenticate().build()
        userId = endUser.userId
        const liveAuthorizationToken = generateLiveAuthorizationToken(
          endUser.userId,
          roomId,
        )

        const client = createWebSocketClient(
          endUser.token,
          liveAuthorizationToken,
        )
        const operation = () =>
          client.mutate({
            mutation: sendEventsMutation,
            variables: { xapiEvents: [xapiEvent] },
          })

        // Act
        gqlResponse = await gqlTry(operation, true)
      })

      it('sendEvents returns true', async () => {
        expect(gqlResponse.data?.sendEvents).to.be.true
      })

      it('1 matching record should exist in Postgres', async () => {
        const expected = {
          ipHash: ipHash,
          // TODO: Not really a way to specify the expected serverTimestamp.
          // Might be useful to create a 'withinRange' helper function to
          // at least enforce a good estimate.
          //serverTimestamp: serverTimestamp,
          userId: userId,
          roomId: roomId,
          geo: geo,
          xapi: xapiEventObj,
        }
        const actual = await xapiRepository.findOne()
        expect(actual).to.deep.include(expected)
      })

      it('1 record should exist in DynamoDB', async () => {
        const client = new DocumentClient({
          endpoint: process.env.LOCALSTACK_ENDPOINT,
          apiVersion: '2012-08-10',
        })
        if (!process.env.DYNAMODB_TABLE_NAME) {
          assert.fail('DYNAMODB_TABLE_NAME is undefined')
        }
        const result = await client
          .scan({ TableName: process.env.DYNAMODB_TABLE_NAME })
          .promise()

        // TODO: Assert contents, rather than just the count.
        expect(result.Count).to.equal(1)
      })

      it('1 record should exist in S3', async () => {
        const s3 = new AWS.S3({
          s3ForcePathStyle: true,
          endpoint: process.env.LOCALSTACK_ENDPOINT,
        })
        const result = await s3.listObjectsV2({ Bucket: bucketName }).promise()

        // TODO: Assert contents, rather than just the count.
        expect(result.KeyCount).to.equal(1)
      })

      it('1 record should exist in Elasticsearch', async () => {
        // TODO: Assert contents, rather than just the count.
        const count = await getToalItemsInElasticsearch()
        expect(count).to.equal(1)
      })
    },
  )

  context('live authorization token is not provided', () => {
    let gqlResponse: GraphQLResponse
    let userId: string

    before(async () => {
      await clearDynamoDbTable()
      await deleteElasticsearchIndex()
      await clearS3Bucket(bucketName)
      await getConnection().synchronize(true)

      const endUser = new EndUserBuilder().authenticate().build()
      userId = endUser.userId
      const liveAuthorizationToken = undefined

      const client = createWebSocketClient(
        endUser.token,
        liveAuthorizationToken,
      )
      const operation = () =>
        client.mutate({
          mutation: sendEventsMutation,
          variables: { xapiEvents: [xapiEvent] },
        })

      // Act
      gqlResponse = await gqlTry(operation, true)
    })

    it('sendEvents returns true', async () => {
      expect(gqlResponse.data?.sendEvents).to.be.true
    })

    it('1 matching record should exist in Postgres *with roomId equal to null*', async () => {
      const expected = {
        ipHash: ipHash,
        // TODO: Not really a way to specify the expected serverTimestamp.
        // Might be useful to create a 'withinRange' helper function to
        // at least enforce a good estimate.
        //serverTimestamp: serverTimestamp,
        userId: userId,
        roomId: null,
        geo: geo,
        xapi: xapiEventObj,
      }
      const actual = await xapiRepository.findOne()
      expect(actual).to.deep.include(expected)
    })

    it('1 record should exist in DynamoDB', async () => {
      const client = new DocumentClient({
        endpoint: process.env.LOCALSTACK_ENDPOINT,
        apiVersion: '2012-08-10',
      })
      if (!process.env.DYNAMODB_TABLE_NAME) {
        assert.fail('DYNAMODB_TABLE_NAME is undefined')
      }
      const result = await client
        .scan({ TableName: process.env.DYNAMODB_TABLE_NAME })
        .promise()

      // TODO: Assert contents, rather than just the count.
      expect(result.Count).to.equal(1)
    })

    it('1 record should exist in S3', async () => {
      const s3 = new AWS.S3({
        s3ForcePathStyle: true,
        endpoint: process.env.LOCALSTACK_ENDPOINT,
      })
      const result = await s3.listObjectsV2({ Bucket: bucketName }).promise()

      // TODO: Assert contents, rather than just the count.
      expect(result.KeyCount).to.equal(1)
    })

    it('1 record should exist in Elasticsearch', async () => {
      // TODO: Assert contents, rather than just the count.
      const count = await getToalItemsInElasticsearch()
      expect(count).to.equal(1)
    })
  })

  context(
    'authentication token and live authorization token are not provided',
    () => {
      let gqlResponse: GraphQLResponse

      before(async () => {
        await clearDynamoDbTable()
        await deleteElasticsearchIndex()
        await clearS3Bucket(bucketName)
        await getConnection().synchronize(true)

        const endUser = new EndUserBuilder().dontAuthenticate().build()
        const liveAuthorizationToken = undefined

        const client = createWebSocketClient(
          endUser.token,
          liveAuthorizationToken,
        )
        const operation = () =>
          client.mutate({
            mutation: sendEventsMutation,
            variables: { xapiEvents: [xapiEvent] },
          })

        // Act
        gqlResponse = await gqlTry(operation, true)
      })

      it('sendEvents returns false', async () => {
        expect(gqlResponse.data?.sendEvents).to.be.false
      })

      it('0 records should exist in Postgres', async () => {
        const count = await xapiRepository.count()
        expect(count).to.equal(0)
      })

      it('0 records should exist in DynamoDB', async () => {
        const client = new DocumentClient({
          endpoint: process.env.LOCALSTACK_ENDPOINT,
          apiVersion: '2012-08-10',
        })
        if (!process.env.DYNAMODB_TABLE_NAME) {
          assert.fail('DYNAMODB_TABLE_NAME is undefined')
        }
        const result = await client
          .scan({ TableName: process.env.DYNAMODB_TABLE_NAME })
          .promise()

        // TODO: Assert contents, rather than just the count.
        expect(result.Count).to.equal(0)
      })

      it('0 records should exist in S3', async () => {
        const s3 = new AWS.S3({
          s3ForcePathStyle: true,
          endpoint: process.env.LOCALSTACK_ENDPOINT,
        })
        const result = await s3.listObjectsV2({ Bucket: bucketName }).promise()

        // TODO: Assert contents, rather than just the count.
        expect(result.KeyCount).to.equal(0)
      })

      it('0 records should exist in Elasticsearch', async () => {
        // TODO: Assert contents, rather than just the count.
        const count = await getToalItemsInElasticsearch()
        expect(count).to.equal(0)
      })
    },
  )

  function createWebSocketClient(
    authenticationToken: string | undefined,
    liveAuthorizationToken: string | undefined,
  ) {
    subscriptionClient = new SubscriptionClient(
      'ws://localhost:8081/graphql',
      {
        reconnect: true,
        connectionParams: liveAuthorizationToken
          ? {
              'live-authorization': liveAuthorizationToken,
            }
          : undefined,
        wsOptionArguments: [
          {
            headers: {
              cookie: authenticationToken
                ? `access=${authenticationToken}`
                : '',
              'x-forwarded-for': ip,
            },
          },
        ],
      },
      ws,
    )
    const link = new WebSocketLink(subscriptionClient)
    return new ApolloClient({
      cache: new InMemoryCache(),
      link,
    })
  }
})

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
