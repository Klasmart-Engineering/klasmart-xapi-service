import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { checkToken } from './auth';
import { register, collectDefaultMetrics } from 'prom-client';
import { loadTypedefsSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { ElasticSearch } from './elasticSearch';
import { createServer } from 'http';

const routePrefix = process.env.ROUTE_PREFIX || '';

collectDefaultMetrics({});

export interface Context {
  sessionId?: string;
  token?: any;
}

export const connectionCount = new Map<string, number>();

async function main() {
  const elasticSearch = await ElasticSearch.create();
  let connectionCount = 0;

  const server = new ApolloServer({
    typeDefs: loadTypedefsSync('./src/schema.graphql', {
      loaders: [new GraphQLFileLoader()]
    })[0].document,
    subscriptions: {
      keepAlive: 1000,
      onConnect: async (
        { sessionId, authToken }: any,
        _webSocket,
        connectionData: any
      ) => {
        let token = undefined;
        if (authToken) token = await checkToken(authToken);
        connectionCount++;
        console.log(`Connection(${connectionCount}) from ${sessionId}`);
        connectionData.counted = true;
        connectionData.sessionId = sessionId;
        return { sessionId, token } as Context;
      },
      onDisconnect: (_websocket, connectionData) => {
        if (!(connectionData as any).counted) {
          return;
        }
        connectionCount--;
        const { sessionId } = connectionData as any;
        console.log(`Disconnection(${connectionCount}) from ${sessionId}`);
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
      if (connection) {
        return connection.context;
      }

      const encodedToken = req.headers?.authorization || req.cookies?.access;
      let token = undefined;
      if (encodedToken) token = await checkToken(encodedToken);

      return { token };
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
