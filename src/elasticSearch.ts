import { Client, ClientOptions } from '@elastic/elasticsearch';
import { ApiKeyAuth, BasicAuth } from '@elastic/elasticsearch/lib/pool';

function getEnvironmentVariableOrDefault(
  variableName: string,
  defaultValue?: string
) {
  if (process.env[variableName]) {
    return process.env[variableName];
  }
  console.warn(
    `${variableName} environment variable was not provided${
      defaultValue ?? ` using default value '${defaultValue}'`
    }`
  );
  return defaultValue;
}

function getDefaultClientOptions(): ClientOptions {
  const node = getEnvironmentVariableOrDefault(
    'ELASTICSEARCH_URL',
    'http://localhost:9200'
  );
  const username = getEnvironmentVariableOrDefault('ELASTICSEARCH_USERNAME');
  const password = getEnvironmentVariableOrDefault('ELASTICSEARCH_PASSWORD');

  const auth: BasicAuth | ApiKeyAuth | undefined =
    username && password
      ? {
          username,
          password
        }
      : undefined;

  return { node, auth };
}
export class ElasticSearch {
  public static async create(
    options: ClientOptions = getDefaultClientOptions()
  ): Promise<ElasticSearch> {
    const client = new Client(options);
    try {
      const result = await client.ping();
      if (!result.statusCode) {
        throw new Error('Unable to ping elsasticsearch');
      }
      if (result.statusCode < 200 || result.statusCode >= 300) {
        throw new Error(
          `Elasticsearch ping responded with status code ${result.statusCode}`
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
  private constructor(client: Client) {
    this.client = client;
  }

  public async sendEvents({ xAPIEvents }: any): Promise<boolean> {
    console.log('sendEvents received: ', xAPIEvents);

    const body = xAPIEvents.flatMap((doc: any) => [
      { index: { _index: 'xapi' } },
      { json: doc }
    ]);

    const { body: bulkResponse } = await this.client.bulk({
      body: body
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
            document: body[i * 2 + 1]
          });
        }
      });

      console.log(erroredDocuments);
      return false;
    }

    return true;
  }
}
