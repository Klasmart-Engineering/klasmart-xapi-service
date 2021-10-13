import newRelicApolloServerPlugin from '@newrelic/apollo-server-plugin'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { loadTypedefsSync } from '@graphql-tools/load'
import { ApolloServer } from 'apollo-server-express'
import cookie from 'cookie'
import { checkToken, TokenDecoder } from './auth'
import { XapiEventDispatcher } from '../xapiEventDispatcher'

export function createApolloServer(
  xapiEventDispatcher: XapiEventDispatcher,
  routePrefix: string,
  tokenDecoder = new TokenDecoder(),
): ApolloServer {
  return new ApolloServer({
    typeDefs: loadTypedefsSync('./src/schema.graphql', {
      loaders: [new GraphQLFileLoader()],
    })[0].document,
    subscriptions: {
      path: `${routePrefix}/graphql`,
      keepAlive: 1000,
      onConnect: async (_, _websocket, connectionContext) => {
        const headers = connectionContext?.request?.headers
        const ip = headers
          ? headers['x-forwarded-for']
          : connectionContext.request.socket.remoteAddress
        const rawCookie = headers?.cookie
        const cookies = rawCookie ? cookie.parse(rawCookie) : undefined
        const accessCookie = cookies?.access
        if (accessCookie) {
          const token = await checkToken(accessCookie, tokenDecoder)
          return { token, ip }
        }
        return { ip }
      },
    },
    resolvers: {
      Query: {
        ready: () => true,
      },
      Mutation: {
        sendEvents: (_parent, args, context) =>
          xapiEventDispatcher.dispatchEvents(args, context),
      },
    },
    context: async ({ req, connection }) => {
      try {
        if (connection) {
          return connection.context
        }

        const ip = req.headers['x-forwarded-for'] || req.ip

        const encodedToken = req?.headers?.authorization || req?.cookies?.access
        if (encodedToken) {
          const token = await checkToken(encodedToken, tokenDecoder)
          return { token, ip }
        }
        return { ip }
      } catch (e) {
        console.error(e)
      }
    },
    plugins: [
      // Note: New Relic plugin should always be listed last
      newRelicApolloServerPlugin,
    ],
  })
}
