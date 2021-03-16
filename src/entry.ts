import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { checkToken, JWT } from './auth';
import { register, collectDefaultMetrics } from 'prom-client';
import { loadTypedefsSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { ElasticSearch } from './elasticSearch';
import { createServer } from 'http';
import cookie from 'cookie';

const routePrefix = process.env.ROUTE_PREFIX || '';

collectDefaultMetrics({});

export interface Context {
  token?: JWT;
}

export let connectionCount = 0;

async function main() {
  const elasticSearch = await ElasticSearch.create();
  const server = new ApolloServer({
    typeDefs: loadTypedefsSync('./src/schema.graphql', {
      loaders: [new GraphQLFileLoader()]
    })[0].document,
    subscriptions: {
      path: `${routePrefix}/graphql`,
      keepAlive: 1000,
      onConnect: async (_, websocket) => {
        console.log('Connect');
        connectionCount++;
        const rawCookies = (websocket as any)?.upgradeReq?.headers?.cookie;
        const cookies = rawCookies ? cookie.parse(rawCookies) : undefined;
        const accessCookie = cookies?.access;
        const token = await checkToken(accessCookie);
        return { token };
      },
      onDisconnect: () => {
        console.log('Disconnect');
        connectionCount--;
      }
    },
    resolvers: {
      Query: {
        ready: () => true
      },
      Mutation: {
        sendEvents: (_parent, args, context, _info) =>
          elasticSearch.sendEvents(args, context)
      }
    },
    context: async ({ req, connection }) => {
      try {
        if (connection) {
          return connection.context;
        }
        const encodedToken =
          req?.headers?.authorization || req?.cookies?.access;
        if (encodedToken) {
          const token = await checkToken(encodedToken);
          return { token };
        }
        return {};
      } catch (e) {
        console.error(e);
      }
    }
  });

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
