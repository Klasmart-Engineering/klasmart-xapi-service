import 'newrelic'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { collectDefaultMetrics } from 'prom-client'
import { createServer } from 'http'
import { XapiEventDispatcher } from './xapiEventDispatcher'
import { GeoIPLite } from './helpers/geoipLite'
import createXapiServer from './initialization/createXapiServer'
import getRecordSenders from './initialization/getRecordSenders'

const log = withLogger('index')

collectDefaultMetrics({})

async function main() {
  const recordSenders = await getRecordSenders()
  const geolocationProvider = new GeoIPLite()
  const xapiEventDispatcher = new XapiEventDispatcher(
    recordSenders,
    geolocationProvider,
  )
  const { app, server } = await createXapiServer(xapiEventDispatcher)

  const httpServer = createServer(app)
  server.installSubscriptionHandlers(httpServer)

  const port = process.env.PORT || 8080
  httpServer.listen(port, () => {
    log.info(`🌎 Server ready at http://localhost:${port}${server.graphqlPath}`)
    log.info(
      `🌎 Subscriptions ready at ws://localhost:${port}${server.subscriptionsPath}`,
    )
  })
}

main().catch((e) => {
  if (e instanceof Error) {
    log.error(e.stack)
  } else {
    log.error(`Error initializing application: ${e}`)
  }
  process.exit(-1)
})
