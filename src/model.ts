import { Client, ClientOptions } from '@elastic/elasticsearch';
import { ApiKeyAuth, BasicAuth } from '@elastic/elasticsearch/lib/pool';

export class Model {
  public async sendEvents({ xAPIEvents }: any) {
    console.log('sendEvents received: ', xAPIEvents);

    const client = new Client(this.getClientOptions());

    const body = xAPIEvents.flatMap((doc: any) => [
      { index: { _index: 'xapi' } },
      { json: doc }
    ]);

    const { body: bulkResponse } = await client.bulk({
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

  private getClientOptions(): ClientOptions {
    let node = process.env.ELASTIC_SEARCH_URL;
    const username = process.env.ELASTIC_SEARCH_USERNAME;
    const password = process.env.ELASTIC_SEARCH_PASSWORD;

    let auth: BasicAuth | ApiKeyAuth | undefined;
    if (node) {
      if (username && password) {
        auth = { username, password };
      }
      if (username && !password) {
        throw Error(
          'ELASTIC_SEARCH_URL and ELASTIC_SEARCH_USERNAME were provided but not ELASTIC_SEARCH_PASSWORD'
        );
      }
      if (!username && password) {
        throw Error(
          'ELASTIC_SEARCH_URL and ELASTIC_SEARCH_PASSWORD were provided but not ELASTIC_SEARCH_USERNAME'
        );
      }
      if (!username && !password) {
        throw Error(
          'ELASTIC_SEARCH_URL was provided but not ELASTIC_SEARCH_USERNAME and ELASTIC_SEARCH_PASSWORD'
        );
      }
    } else {
      node = 'http://localhost:9200';
    }

    return { node, auth };
  }
}
