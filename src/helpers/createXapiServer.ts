import express from 'express'
import { register } from 'prom-client'
import { createApolloServer } from './createApolloServer'
import { Express } from 'express'
import { ApolloServer } from 'apollo-server-express'
import { XapiEventDispatcher } from '../xapiEventDispatcher'

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
    } catch (ex: any) {
      console.error(ex)
      res.status(500).end(ex.toString())
    }
  })
  server.applyMiddleware({
    app,
    path: routePrefix,
  })
  return { app, server }
}
