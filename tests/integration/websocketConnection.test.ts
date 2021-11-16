import dotenv from 'dotenv'
import createXapiServer from '../../src/initialization/createXapiServer'
import { gql, ApolloClient, InMemoryCache } from '@apollo/client'
import { WebSocketLink } from '@apollo/client/link/ws'
import ws from 'ws'
import { createServer, Server } from 'http'
import { createHttpTerminator, HttpTerminator } from 'http-terminator'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import EndUserBuilder from '../toolbox/builders/endUserBuilder'
import { IXapiRecordSender } from '../../src/interfaces/xapiRecordSender'
import { XapiRecord } from '../../src/interfaces/xapiRecord'
import { XapiEventDispatcher } from '../../src/xapiEventDispatcher'
import { GeoIPLite } from '../../src/helpers/geoipLite'
import { generateLiveAuthorizationToken } from '../toolbox/helpers/tokenGenerators'
import { gqlTry } from '../toolbox/helpers/gqlTry'
import { expect } from 'chai'
dotenv.config({ path: process.env.CI ? '.env.test.ci' : '.env.test' })

describe('websocketConnection', () => {
  let httpServer: Server
  let httpTerminator: HttpTerminator
  let subscriptionClient: SubscriptionClient

  const sendEventsMutation = gql`
    mutation xapi($xapiEvents: [String!]!) {
      sendEvents(xAPIEvents: $xapiEvents)
    }
  `

  before(async () => {
    const geolocationProvider = new GeoIPLite()
    const { app, server } = await createXapiServer(
      new XapiEventDispatcher([new DummyRecordSender()], geolocationProvider),
    )
    httpServer = createServer(app)
    server.installSubscriptionHandlers(httpServer)
    httpTerminator = createHttpTerminator({ server: httpServer })
    httpServer.listen(8081, 'localhost')
  })

  after(async () => {
    await httpTerminator?.terminate()
  })

  afterEach(async () => {
    subscriptionClient?.close()
  })

  context('live authorization token is provided', () => {
    it('sendEvents returns true', async () => {
      const endUser = new EndUserBuilder().authenticate().build()
      const roomId = 'test-room'
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
          variables: { xapiEvents: ['{"a": 1}'] },
        })
      const result = await gqlTry(operation, true)
      expect(result.data?.sendEvents).to.be.true
    })
  })

  context('live authorization token is not provided', () => {
    it('sendEvents returns true', async () => {
      const endUser = new EndUserBuilder().authenticate().build()
      const liveAuthorizationToken = undefined

      const client = createWebSocketClient(
        endUser.token,
        liveAuthorizationToken,
      )
      const operation = () =>
        client.mutate({
          mutation: sendEventsMutation,
          variables: { xapiEvents: ['{"a": 1}'] },
        })
      const result = await gqlTry(operation, true)
      expect(result.data?.sendEvents).to.be.true
    })
  })

  context(
    'authentication token and live authorization token are not provided',
    () => {
      it('sendEvents returns false', async () => {
        const endUser = new EndUserBuilder().dontAuthenticate().build()
        const liveAuthorizationToken = undefined

        const client = createWebSocketClient(
          endUser.token,
          liveAuthorizationToken,
        )
        const operation = () =>
          client.mutate({
            mutation: sendEventsMutation,
            variables: { xapiEvents: ['{"a": 1}'] },
          })
        const result = await gqlTry(operation, true)
        expect(result.data?.sendEvents).to.be.false
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
              'x-forwarded-for': '220.80.15.135',
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

class DummyRecordSender implements IXapiRecordSender {
  sendRecords(xapiRecords: XapiRecord[]): Promise<boolean> {
    return Promise.resolve(true)
  }
}
