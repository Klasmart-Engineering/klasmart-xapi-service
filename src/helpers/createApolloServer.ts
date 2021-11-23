import newRelicApolloServerPlugin from '@newrelic/apollo-server-plugin'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { loadTypedefsSync } from '@graphql-tools/load'
import { ApolloServer } from 'apollo-server-express'
import cookie from 'cookie'
import { XapiEventDispatcher } from '../xapiEventDispatcher'
import { checkAuthenticationToken } from 'kidsloop-token-validation'
import { withTransaction } from './withTransaction'
import { withLogger } from 'kidsloop-nodejs-logger'

const log = withLogger('createApolloServer')

export function createApolloServer(
  xapiEventDispatcher: XapiEventDispatcher,
  routePrefix: string,
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
          const authenticationToken = await checkAuthenticationToken(
            accessCookie,
          )
          return { authenticationToken, ip }
        }
        return { ip }
      },
    },
    resolvers: {
      Query: {
        ready: () => withTransaction('ready', () => true),
      },
      Mutation: {
        sendEvents: (_parent, args, context) =>
          withTransaction('sendEvents', () =>
            xapiEventDispatcher.dispatchEvents(args, context),
          ),
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
          const authenticationToken = await checkAuthenticationToken(
            encodedToken,
          )
          return { authenticationToken, ip }
        }
        return { ip }
      } catch (e) {
        if (e instanceof Error) {
          log.error(e.stack)
        } else {
          log.error(`Error creating Apollo Server: ${e}`)
        }
      }
    },
    plugins: [
      // Note: New Relic plugin should always be listed last
      newRelicApolloServerPlugin,
    ],
  })
}
