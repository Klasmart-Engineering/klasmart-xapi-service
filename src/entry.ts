import 'newrelic'
import express from 'express'
import { register, collectDefaultMetrics } from 'prom-client'
import { ElasticsearchRecordSender } from './recordSenders/elasticsearchRecordSender'
import { createServer } from 'http'
import { createApolloServer } from './helpers/createApolloServer'
import { FirehoseRecordSender } from './recordSenders/firehoseRecordSender'
import { XapiEventDispatcher } from './xapiEventDispatcher'
import { IXapiRecordSender } from './interfaces/xapiRecordSender'
import { DynamoDbRecordSender } from './recordSenders/dynamoDbRecordSender'
import { connectToTypeOrmDatabase } from './recordSenders/typeorm/connectToTypeOrmDatabase'
import { TypeOrmRecordSender } from './recordSenders/typeorm/typeOrmRecordSender'
import { GeoIPLite } from './helpers/geoipLite'

const routePrefix = process.env.ROUTE_PREFIX || ''

collectDefaultMetrics({})

async function main() {
  const recordSenders: IXapiRecordSender[] = []
  try {
    const dynamoDbRecordSender = DynamoDbRecordSender.create()
    recordSenders.push(dynamoDbRecordSender)
    console.log('🔵 DynamoDB record sender added')
  } catch (e) {
    console.error(e)
  }

  try {
    const elasticsearch = await ElasticsearchRecordSender.create()
    recordSenders.push(elasticsearch)
    console.log('🔎 Elasticsearch record sender added')
  } catch (e) {
    console.error(e)
  }

  try {
    await connectToTypeOrmDatabase()
    const typeOrm = new TypeOrmRecordSender()
    recordSenders.push(typeOrm)
    console.log('🐘 TypeORM record sender added')
  } catch (e) {
    console.error(e)
  }

  try {
    const firehoseRecordSender = FirehoseRecordSender.create()
    recordSenders.push(firehoseRecordSender)
    console.log('🚒 Firehose record sender added')
  } catch (e) {
    console.error(e)
  }

  if (recordSenders.length <= 0) {
    throw new Error(
      '❌ No record senders configured, specify at least one of the following environment variables\n' +
        '- DYNAMODB_TABLE_NAME\n' +
        '- FIREHOSE_STREAM_NAME\n' +
        '- ELASTICSEARCH_URL\n' +
        '- XAPI_DATABASE_URL',
    )
  }

  const geolocationProvider = new GeoIPLite()
  const xapiEventDispatcher = new XapiEventDispatcher(
    recordSenders,
    geolocationProvider,
  )
  const server = createApolloServer(xapiEventDispatcher, routePrefix)

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
