import { config } from 'dotenv';
config();

import express from 'express';
import { register, collectDefaultMetrics } from 'prom-client';
import { ElasticSearch } from './elasticSearch';
import { createServer } from 'http';
import { createApolloServer } from './createApolloServer';
import { Firehose } from './firehose';
import { XAPI } from './xapi';
import { XAPIRecordSender } from './xapiRecordSender';
import { DynamoDBSender } from './dynamodb';
import { connectToUserDatabase } from './typeorm/connectToUserDatabase';
import { TypeORMRecordSender } from './typeorm/recordSender';

const routePrefix = process.env.ROUTE_PREFIX || '';

collectDefaultMetrics({});

async function main() {
  const recordSenders: XAPIRecordSender[] = [];
  try {
    const TableName = process.env.DYNAMODB_TABLE_NAME;
    if (typeof TableName !== 'string') {
      throw new Error(
        `To use dynamoDB record sender use DYNAMODB_TABLE_NAME enviroment variable`,
      );
    }
    const dynamoDBRecordSender = await DynamoDBSender.create(TableName);
    recordSenders.push(dynamoDBRecordSender);
    console.log('🔵 DynamoDB record sender added');
  } catch (e) {
    console.error(e);
  }

  try {
    const elasticSearch = await ElasticSearch.create();
    recordSenders.push(elasticSearch);
    console.log('🔎 Elastic search record sender added');
  } catch (e) {
    console.error(e);
  }

  try {
    connectToUserDatabase().catch((e) => {
      console.error(e);
    });
    const typeORM = new TypeORMRecordSender();
    recordSenders.push(typeORM);
    console.log('🔎 TypeORM search record sender added');
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
      '❌ No record senders configured, specify at least one of the following enviroment variables\n' +
        '- DYNAMODB_TABLE_NAME\n' +
        '- FIREHOSE_STREAM_NAME\n' +
        '- ELASTICSEARCH_URL\n' +
        '',
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
    path: routePrefix,
  });

  const httpServer = createServer(app);
  server.installSubscriptionHandlers(httpServer);

  const port = process.env.PORT || 8080;
  httpServer.listen(port, () => {
    console.log(
      `🌎 Server ready at http://localhost:${port}${server.graphqlPath}`,
    );
    console.log(
      `🌎 Subscriptions ready at ws://localhost:${port}${server.subscriptionsPath}`,
    );
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(-1);
});
