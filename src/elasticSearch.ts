import { Client, ClientOptions } from '@elastic/elasticsearch';
import { ApiKeyAuth, BasicAuth } from '@elastic/elasticsearch/lib/pool';
import {
  FirehoseClient,
  PutRecordCommand,
  PutRecordBatchCommand,
} from '@aws-sdk/client-firehose';
import { getEnvironmentVariableOrDefault } from './envUtil';
import { Context } from './context';
import { XAPIRecord } from './xAPIRecord';
import geoip from 'geoip-lite';
import { createHash } from 'crypto';

const client = new FirehoseClient({});

export class ElasticSearch {
  public static async create(
    options: ClientOptions = getDefaultClientOptions(),
  ): Promise<ElasticSearch> {
    const client = new Client(options);
    try {
      const result = await client.ping();
      if (!result.statusCode) {
        throw new Error('Unable to ping elsasticsearch');
      }
      if (result.statusCode < 200 || result.statusCode >= 300) {
        throw new Error(
          `Elasticsearch ping responded with status code ${result.statusCode}`,
        );
      }
      console.log('🔎 Connected to Elasticsearch');
      return new ElasticSearch(client);
    } catch (e) {
      console.error('Failed to connect to Elasticsearch: ', e);
      throw e;
    }
  }

  private client: Client;
  private deliveryStreamName: string | undefined;

  private constructor(client: Client) {
    this.client = client;
    this.deliveryStreamName = getEnvironmentVariableOrDefault(
      'FIREHOSE_STREAM_NAME',
    );
  }

  public async sendEvents(
    { xAPIEvents }: any,
    context: Context,
  ): Promise<boolean> {
    const userId = context?.token?.id;
    const ip = context.ip;
    const serverTimestamp = Date.now();

    const geo = geoip.lookup(ip);
    const ipHash = createHash('sha256').update(ip).digest('hex');

    const xAPIRecords: XAPIRecord[] = xAPIEvents.map((xapi: any) => {
      return { xapi: JSON.parse(xapi), userId, ipHash, geo, serverTimestamp };
    });

    await Promise.allSettled([
      this.batchSendToFirehose(xAPIRecords),
      this.sendToElasticSearch(xAPIRecords),
    ]);

    return true;
  }

  private async sendToElasticSearch(xAPIRecords: XAPIRecord[]) {
    const body = xAPIRecords.flatMap((xAPIRecord) => [
      { index: { _index: 'xapi' } },
      xAPIRecord,
    ]);

    const { body: bulkResponse } = await this.client.bulk({
      body: body,
    });

    if (bulkResponse.errors) {
      const erroredDocuments: any = [];
      bulkResponse.items.forEach((action: any, i: number) => {
        const operation = Object.keys(action)[0];
        if (action[operation].error) {
          erroredDocuments.push({
            status: action[operation].status,
            error: action[operation].error,
            operation: body[i * 2],
            document: body[i * 2 + 1],
          });
        }
      });

      console.log(erroredDocuments);
      return false;
    }
  }

  private async sendToFirehose(xAPIRecord: XAPIRecord) {
    try {
      const json = JSON.stringify(xAPIRecord);
      const record = { Data: Buffer.from(json) };
      const command = new PutRecordCommand({
        DeliveryStreamName: this.deliveryStreamName,
        Record: record,
      });
      const output = await client.send(command);
    } catch (error) {
      console.log(error);
    }
  }

  private async batchSendToFirehose(xAPIRecords: XAPIRecord[]) {
    try {
      const command = new PutRecordBatchCommand({
        DeliveryStreamName: this.deliveryStreamName,
        Records: xAPIRecords.map((xAPIRecord) => {
          const json = JSON.stringify(xAPIRecord);
          return { Data: Buffer.from(json) };
        }),
      });
      const output = await client.send(command);
    } catch (error) {
      console.log(error);
    }
  }
}

function getDefaultClientOptions(): ClientOptions {
  const node = getEnvironmentVariableOrDefault(
    'ELASTICSEARCH_URL',
    'http://localhost:9200',
  );
  const username = getEnvironmentVariableOrDefault('ELASTICSEARCH_USERNAME');
  const password = getEnvironmentVariableOrDefault('ELASTICSEARCH_PASSWORD');

  const auth: BasicAuth | ApiKeyAuth | undefined =
    username && password
      ? {
          username,
          password,
        }
      : undefined;

  return { node, auth };
}
