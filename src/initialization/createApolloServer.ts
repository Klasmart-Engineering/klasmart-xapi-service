import newRelicApolloServerPlugin from '@newrelic/apollo-server-plugin'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { loadTypedefsSync } from '@graphql-tools/load'
import { ApolloServer } from 'apollo-server-express'
import cookie from 'cookie'
import { XapiEventDispatcher } from '../xapiEventDispatcher'
import {
  checkAuthenticationToken,
  checkLiveAuthorizationToken,
} from '@kl-engineering/kidsloop-token-validation'
import { withTransaction } from '../helpers/withTransaction'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { IncomingHttpHeaders } from 'http'
import { ApplicationError } from '../errorHandling/applicationError'
import error2Json from '../errorHandling/error2Json'

const log = withLogger('createApolloServer')

export function createApolloServer(
  xapiEventDispatcher: XapiEventDispatcher,
  routePrefix: string,
): ApolloServer {
  return new ApolloServer({
    typeDefs: loadTypedefsSync('./src/schema.graphql', {
      loaders: [new GraphQLFileLoader()],
    })[0].document,
    playground:
      process.env.NODE_ENV !== 'production'
        ? {
            settings: {
              'request.credentials': 'include',
            },
          }
        : undefined,
    subscriptions: {
      path: `${routePrefix}/graphql`,
      keepAlive: 1000,
      onConnect: async (connectionParams, _websocket, connectionContext) => {
        const headers = connectionContext?.request?.headers
        const ip = headers
          ? headers['x-forwarded-for']
          : connectionContext.request.socket.remoteAddress
        const authenticationToken = await extractAuthenticationToken(headers)
        const { roomId, isReview } = await extractClassInfo(
          connectionParams['live-authorization'],
        )
        return { roomId, authenticationToken, ip, isReview }
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
      if (connection) {
        return connection.context
      }
      const ip = req.headers['x-forwarded-for'] || req.ip
      const authenticationToken = await extractAuthenticationToken(req.headers)
      const encodedLiveAuthorizationToken = extractHeader(
        req.headers['live-authorization'],
      )
      const { roomId, isReview } = await extractClassInfo(
        encodedLiveAuthorizationToken,
      )
      return { roomId, authenticationToken, ip, isReview }
    },
    plugins: [
      // Note: New Relic plugin should always be listed last
      newRelicApolloServerPlugin,
    ],
    formatError: (error) => {
      const stringifiedError = error2Json(error.originalError)
      log.error(stringifiedError)
      return error
    },
  })
}

async function extractAuthenticationToken(headers: IncomingHttpHeaders) {
  const rawCookie = headers?.cookie
  const cookies = rawCookie ? cookie.parse(rawCookie) : undefined
  const encodedAuthenticationToken = cookies?.access
  if (encodedAuthenticationToken) {
    try {
      const authenticationToken = await checkAuthenticationToken(
        encodedAuthenticationToken,
      )
      return authenticationToken
    } catch (error) {
      log.error(
        error2Json(
          new ApplicationError({
            message: 'checkAuthenticationToken threw an error.',
            innerError: error,
            meta: { encodedAuthenticationToken },
          }),
        ),
      )
    }
  }
}

async function extractClassInfo(
  encodedLiveAuthorizationToken: string | undefined,
) {
  if (encodedLiveAuthorizationToken) {
    try {
      const authorizationToken = await checkLiveAuthorizationToken(
        encodedLiveAuthorizationToken,
      )
      log.silly(`authorizationToken.roomid: ${authorizationToken.roomid}`)
      return {
        roomId: authorizationToken.roomid,
        isReview: authorizationToken.is_review,
      }
    } catch (error) {
      log.error(
        error2Json(
          new ApplicationError({
            message: 'checkLiveAuthorizationToken threw an error.',
            innerError: error,
            meta: { encodedLiveAuthorizationToken },
          }),
        ),
      )
    }
  }
  return {}
}

function extractHeader(headers?: string | string[]): string | undefined {
  if (typeof headers === 'string') {
    return headers
  }
  if (headers instanceof Array && headers.length > 0) {
    return headers[0]
  }
  return undefined
}
