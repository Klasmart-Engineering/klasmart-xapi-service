import { Client } from '@elastic/elasticsearch'
import type { Client as TypeSafeClient } from '@elastic/elasticsearch/api/new'
import { ApiKeyAuth, BasicAuth } from '@elastic/elasticsearch/lib/pool'
import { getEnvironmentVariableOrDefault } from '../helpers/envUtil'
import { XapiRecord } from '../interfaces/xapiRecord'
import { IXapiRecordSender } from '../interfaces/xapiRecordSender'
import { withLogger } from 'kidsloop-nodejs-logger'

const log = withLogger('elasticsearchRecordSender')

export class ElasticsearchRecordSender implements IXapiRecordSender {
  public static async create(
    client: TypeSafeClient,
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

  private constructor(private readonly client: TypeSafeClient) {
    this.client = client
  }

  public async sendRecords(
    xapiRecords: ReadonlyArray<XapiRecord>,
  ): Promise<boolean> {
    const body = xapiRecords.flatMap((xapiRecord) => [
      { index: { _index: 'xapi' } },
      xapiRecord,
    ])

    const { body: bulkResponse } = await this.client.bulk({
      body: body,
    })

    if (bulkResponse.errors) {
      const erroredDocuments: unknown[] = []
      bulkResponse.items.forEach((action, i) => {
        const operation =
          action.create ?? action.delete ?? action.index ?? action.update
        if (operation?.error) {
          erroredDocuments.push({
            status: operation.status,
            error: operation.error,
            operation: body[i * 2],
            document: body[i * 2 + 1],
          })
        }
      })

      log.error(JSON.stringify(erroredDocuments))
      return false
    }

    return true
  }

  public static getDefaultClient(node: string): TypeSafeClient {
    const username = getEnvironmentVariableOrDefault('ELASTICSEARCH_USERNAME')
    const password = getEnvironmentVariableOrDefault('ELASTICSEARCH_PASSWORD')

    const auth: BasicAuth | ApiKeyAuth | undefined =
      username && password
        ? {
            username,
            password,
          }
        : undefined

    // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/typescript.html#_how_to_migrate_to_the_new_type_definitions
    // @ts-expect-error @elastic/elasticsearch
    const client: TypeSafeClient = new Client({
      node: node,
      auth,
    })
    return client
  }
}
