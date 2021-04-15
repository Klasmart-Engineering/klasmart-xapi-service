import express from 'express';
import { register, collectDefaultMetrics } from 'prom-client';
import { ElasticSearch } from './elasticSearch';
import { createServer } from 'http';
import { createApolloServer } from './createApolloServer';
import { Firehose } from './firehose';
import { XAPI } from './xapi';
import { XAPIRecordSender } from './xapiRecordSender';
const routePrefix = process.env.ROUTE_PREFIX || '';

collectDefaultMetrics({});

async function main() {
  const recordSenders: XAPIRecordSender[] = [];
  try {
    const elasticSearch = await ElasticSearch.create();
    recordSenders.push(elasticSearch);
    console.log('🔎 Elastic search record sender added');
  } catch (e) {
    console.error(e);
  }

  try {
    const firehoseRecordSender = Firehose.create();
    recordSenders.push(firehoseRecordSender);
    console.log('🚒 Firehose record sender added');
  } catch (e) {
    console.error(e);
  }

  if (recordSenders.length <= 0) {
    throw new Error(
      '❌ No record senders configured, specify FIREHOSE_STREAM_NAME or ELASTICSEARCH_URL enviroment variables'
    );
  }

  const xapi = new XAPI(recordSenders);
  const server = createApolloServer(xapi, routePrefix);

  const app = express();
  app.get('/metrics', async (_req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.end(metrics);
    } catch (ex) {
      console.error(ex);
      res.status(500).end(ex.toString());
    }
  });

  server.applyMiddleware({
    app,
    path: routePrefix
  });

  const httpServer = createServer(app);
  server.installSubscriptionHandlers(httpServer);

  const port = process.env.PORT || 8080;
  httpServer.listen(port, () => {
    console.log(
      `🌎 Server ready at http://localhost:${port}${server.graphqlPath}`
    );
    console.log(
      `🌎 Subscriptions ready at ws://localhost:${port}${server.subscriptionsPath}`
    );
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(-1);
});
