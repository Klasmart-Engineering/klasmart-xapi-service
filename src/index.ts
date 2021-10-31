import 'newrelic'
import { collectDefaultMetrics } from 'prom-client'
import { createServer } from 'http'
import { XapiEventDispatcher } from './xapiEventDispatcher'
import { GeoIPLite } from './helpers/geoipLite'
import createXapiServer from './helpers/createXapiServer'
import getRecordSenders from './helpers/getRecordSenders'

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
    console.log(
      `🌎 Server ready at http://localhost:${port}${server.graphqlPath}`,
    )
    console.log(
      `🌎 Subscriptions ready at ws://localhost:${port}${server.subscriptionsPath}`,
    )
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(-1)
})
