import express from 'express';
import { register, collectDefaultMetrics } from 'prom-client';
import { ElasticSearch } from './elasticSearch';
import { createServer } from 'http';
import { createApolloServer } from './createApolloServer';
import { Firehose } from './firehose';
import { XAPI } from './xapi';

const routePrefix = process.env.ROUTE_PREFIX || '';

collectDefaultMetrics({});

async function main() {
  const elasticSearch = await ElasticSearch.create();
  const firehose = Firehose.create();
  const xapi = new XAPI([elasticSearch, firehose]);
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
