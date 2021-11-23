import express from 'express'
import { register } from 'prom-client'
import { createApolloServer } from './createApolloServer'
import { Express } from 'express'
import { ApolloServer } from 'apollo-server-express'
import { XapiEventDispatcher } from '../xapiEventDispatcher'
import { withLogger } from 'kidsloop-nodejs-logger'

const log = withLogger('kidsloop-nodejs-logger')

const routePrefix = process.env.ROUTE_PREFIX || ''

export default async function createXapiServer(
  xapiEventDispatcher: XapiEventDispatcher,
): Promise<{
  app: Express
  server: ApolloServer
}> {
  const server = createApolloServer(xapiEventDispatcher, routePrefix)
  await server.start()

  const app = express()
  app.get('/metrics', async (_req, res) => {
    try {
      res.set('Content-Type', register.contentType)
      const metrics = await register.metrics()
      res.end(metrics)
    } catch (ex) {
      if (ex instanceof Error) {
        log.error(ex.stack)
      } else {
        log.error(`Error retrieving metrics data: ${ex}`)
      }
      res.status(500).end(`Error retrieving metrics data`)
    }
  })
  server.applyMiddleware({
    app,
    path: routePrefix,
  })
  return { app, server }
}
