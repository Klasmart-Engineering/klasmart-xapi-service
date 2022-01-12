import path from 'path'
import { register } from 'prom-client'
import { createApolloServer } from './createApolloServer'
import express, { Express } from 'express'
import cookieParser from 'cookie-parser'
import { ApolloServer } from 'apollo-server-express'
import { checkAuthenticationToken } from 'kidsloop-token-validation'
import { withLogger } from 'kidsloop-nodejs-logger'
import { XapiEventDispatcher } from '../xapiEventDispatcher'
import appPackage from '../../package.json'

const logger = withLogger('kidsloop-nodejs-logger')

const routePrefix = process.env.ROUTE_PREFIX || ''
const apiRoute = path.posix.join(
  routePrefix,
  process.env.API_ENDPOINT || '/graphql',
)

const isDevelopment = () => process.env.NODE_ENV === 'development'
const canViewDocsPage = () =>
  process.env.ENABLE_PAGE_DOCS === '1' ||
  process.env.ENABLE_PAGE_DOCS === 'true'

async function restrictDocs(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  if (isDevelopment() || canViewDocsPage()) {
    next()
  } else {
    logger.info(
      `restrictDocs: cannot view this page, returns '404: Page doesn't exist'`,
    )
    res.status(404).send(`404: Page doesn't exist`)
  }
}

async function validateToken(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      await checkAuthenticationToken(
        req.headers.authorization || req.cookies.access,
      )
    }
    next()
  } catch (e) {
    logger.info(
      `validateToken: cannot view this page, returns '401: Missing or invalid token'`,
    )
    res.status(401).send(`401: Missing or invalid token`)
  }
}

export default async function createXapiServer(
  xapiEventDispatcher: XapiEventDispatcher,
): Promise<{
  app: Express
  server: ApolloServer
}> {
  const server = createApolloServer(xapiEventDispatcher, routePrefix)
  await server.start()

  const app = express()

  app.use(cookieParser())
  app.use(express.urlencoded({ limit: '1mb', extended: true }))

  const viewsPath = path.posix.join(__dirname, '../../views')
  app.use(express.static(viewsPath))
  app.set('views', viewsPath)
  app.set('view engine', 'pug')

  const variables = {
    routePrefix,
    version: appPackage.version,
  }

  app.get(
    [`${routePrefix}`, `${routePrefix}/home`],
    restrictDocs,
    validateToken,
    (_, res) => {
      res.render('index', {
        ...variables,
        name: appPackage.name,
        config: {
          NODE_ENV: process.env.NODE_ENV,
          ROUTE_PREFIX: process.env.ROUTE_PREFIX,
          ENABLE_PAGE_DOCS: process.env.ENABLE_PAGE_DOCS,
          API_ENDPOINT: process.env.API_ENDPOINT,
          DYNAMODB_IS_SET: Boolean(process.env.DYNAMODB_TABLE_NAME),
          FIREHOSE_IS_SET: Boolean(process.env.FIREHOSE_STREAM_NAME),
          ELASTICSEARCH_IS_SET: Boolean(process.env.ELASTICSEARCH_URL),
          DATABASE_IS_SET: Boolean(process.env.XAPI_DATABASE_URL),
        },
      })
    },
  )
  app.get(`${routePrefix}/changelog`, restrictDocs, validateToken, (_, res) => {
    res.render('changelog', variables)
  })
  app.get(`${routePrefix}/examples`, restrictDocs, validateToken, (_, res) => {
    res.render('examples', variables)
  })
  app.get(`${routePrefix}/explorer`, restrictDocs, validateToken, (_, res) => {
    res.render('graphiql', { ...variables, apiRoute })
  })

  app.get(`${routePrefix}/health`, (_, res) => {
    res.status(200).json({
      status: 'pass',
    })
  })

  app.get(`${routePrefix}/version`, (_, res) => {
    res.status(200).json({
      version: `${appPackage.version}`,
    })
  })

  app.get(`${routePrefix}/metrics`, async (_req, res) => {
    try {
      res.set('Content-Type', register.contentType)
      const metrics = await register.metrics()
      res.end(metrics)
    } catch (ex) {
      if (ex instanceof Error) {
        logger.error(ex.stack)
      } else {
        logger.error(`Error retrieving metrics data: ${ex}`)
      }
      res.status(500).end(`Error retrieving metrics data`)
    }
  })
  server.applyMiddleware({
    app,
    path: apiRoute,
  })
  return { app, server }
}
