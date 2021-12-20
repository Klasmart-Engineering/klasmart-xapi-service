import { assert } from 'chai'
import { Client } from '@elastic/elasticsearch'
import type { Client as TypeSafeClient } from '@elastic/elasticsearch/api/new'
import { TotalHits } from '@elastic/elasticsearch/api/types'

export async function deleteElasticsearchIndex(): Promise<void> {
  if (!process.env.ELASTICSEARCH_URL) {
    assert.fail('ELASTICSEARCH_URL is undefined')
  }
  // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/typescript.html#_how_to_migrate_to_the_new_type_definitions
  // @ts-expect-error @elastic/elasticsearch
  const client: TypeSafeClient = new Client({
    node: process.env.ELASTICSEARCH_URL,
  })
  const response = await client.indices.exists({ index: 'xapi' })
  if (response.body) {
    await client.indices.delete({ index: 'xapi' })
  }
}

export async function getToalItemsInElasticsearch(): Promise<number> {
  if (!process.env.ELASTICSEARCH_URL) {
    assert.fail('ELASTICSEARCH_URL is undefined')
  }
  // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/typescript.html#_how_to_migrate_to_the_new_type_definitions
  // @ts-expect-error @elastic/elasticsearch
  const client: TypeSafeClient = new Client({
    node: process.env.ELASTICSEARCH_URL,
  })
  const response = await client.indices.exists({ index: 'xapi' })
  if (!response.body) {
    return 0
  }
  await client.indices.refresh({ index: 'xapi' })
  const result = await client.search({
    index: 'xapi',
    body: {
      query: { match_all: {} },
    },
  })

  if (isTotalHits(result.body.hits.total)) {
    return result.body.hits.total.value
  }
  return result.body.hits.total
}

function isTotalHits(total: number | TotalHits): total is TotalHits {
  return (total as TotalHits).value !== undefined
}
