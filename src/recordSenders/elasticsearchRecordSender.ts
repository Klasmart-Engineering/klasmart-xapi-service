import { Client } from '@elastic/elasticsearch'
import { ApiKeyAuth, BasicAuth } from '@elastic/elasticsearch/lib/pool'
import { getEnvironmentVariableOrDefault } from '../helpers/envUtil'
import { XapiRecord } from '../interfaces/xapiRecord'
import { IXapiRecordSender } from '../interfaces/xapiRecordSender'

export class ElasticsearchRecordSender implements IXapiRecordSender {
  public static async create(
    client = getDefaultClient(),
  ): Promise<ElasticsearchRecordSender> {
    const result = await client.ping()
    if (!result.statusCode) {
      throw new Error('Unable to ping Elasticsearch')
    }
    if (result.statusCode < 200 || result.statusCode >= 300) {
      throw new Error(
        `Elasticsearch ping responded with status code ${result.statusCode}`,
      )
    }
    return new ElasticsearchRecordSender(client)
  }

  private constructor(private readonly client: Client) {
    this.client = client
  }

  public async sendRecords(xapiRecords: XapiRecord[]): Promise<boolean> {
    const body = xapiRecords.flatMap((xapiRecord) => [
      { index: { _index: 'xapi' } },
      xapiRecord,
    ])

    const { body: bulkResponse } = await this.client.bulk({
      body: body,
    })

    if (bulkResponse.errors) {
      const erroredDocuments: any = []
      bulkResponse.items.forEach((action: any, i: number) => {
        const operation = Object.keys(action)[0]
        if (action[operation].error) {
          erroredDocuments.push({
            status: action[operation].status,
            error: action[operation].error,
            operation: body[i * 2],
            document: body[i * 2 + 1],
          })
        }
      })

      console.log(erroredDocuments)
      return false
    }

    return true
  }
}

function getDefaultClient(): Client {
  const node = getEnvironmentVariableOrDefault('ELASTICSEARCH_URL')
  if (!node) {
    throw new Error(
      'To use Elasticsearch specify ELASTICSEARCH_URL environment variable',
    )
  }
  const username = getEnvironmentVariableOrDefault('ELASTICSEARCH_USERNAME')
  const password = getEnvironmentVariableOrDefault('ELASTICSEARCH_PASSWORD')

  const auth: BasicAuth | ApiKeyAuth | undefined =
    username && password
      ? {
          username,
          password,
        }
      : undefined

  return new Client({ node, auth })
}
