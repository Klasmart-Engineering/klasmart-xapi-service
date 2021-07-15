import { config } from 'dotenv';
config();

import express from 'express';
import { register, collectDefaultMetrics } from 'prom-client';
import { ElasticSearchRecordSender } from './recordSenders/elasticSearchRecordSender';
import { createServer } from 'http';
import { createApolloServer } from './helpers/createApolloServer';
import { FirehoseRecordSender } from './recordSenders/firehoseRecordSender';
import { XapiEventDispatcher } from './xapiEventDispatcher';
import { IXapiRecordSender } from './interfaces/xapiRecordSender';
import { DynamoDbRecordSender } from './recordSenders/dynamoDbRecordSender';
import { connectToTypeOrmDatabase } from './recordSenders/typeorm/connectToTypeOrmDatabase';
import { TypeOrmRecordSender } from './recordSenders/typeorm/typeOrmRecordSender';

const routePrefix = process.env.ROUTE_PREFIX || '';

collectDefaultMetrics({});

async function main() {
  const recordSenders: IXapiRecordSender[] = [];
  try {
    const TableName = process.env.DYNAMODB_TABLE_NAME;
    if (typeof TableName !== 'string') {
      throw new Error(
        `To use DynamoDB record sender use DYNAMODB_TABLE_NAME enviroment variable`,
      );
    }
    const dynamoDbRecordSender = await DynamoDbRecordSender.create(TableName);
    recordSenders.push(dynamoDbRecordSender);
    console.log('🔵 DynamoDB record sender added');
  } catch (e) {
    console.error(e);
  }

  try {
    const elasticSearch = await ElasticSearchRecordSender.create();
    recordSenders.push(elasticSearch);
    console.log('🔎 Elastic search record sender added');
  } catch (e) {
    console.error(e);
  }

  try {
    await connectToTypeOrmDatabase();
    const typeORM = new TypeOrmRecordSender();
    recordSenders.push(typeORM);
    console.log('🐘 TypeORM record sender added');
  } catch (e) {
    console.error(e);
  }

  try {
    const firehoseRecordSender = FirehoseRecordSender.create();
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

  const xapiEventDispatcher = new XapiEventDispatcher(recordSenders);
  const server = createApolloServer(xapiEventDispatcher, routePrefix);

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
