'use strict';

import { Client } from '@elastic/elasticsearch';
const client = new Client({ node: 'http://localhost:9200' });

async function run() {
  await indexDummyData();
  //await client.indices.refresh({ index: 'game-of-thrones' })

  // Let's search!
  const { body } = await client.search({
    index: 'game-of-thrones',
    body: {
      query: {
        match: {
          quote: 'winter'
        }
      }
    }
  });

  console.log(body.hits.hits);
}

async function indexDummyData() {
  // Let's start by indexing some data
  await client.index({
    index: 'game-of-thrones',
    body: {
      character: 'Ned Stark',
      quote: 'Winter is coming.'
    }
  });

  await client.index({
    index: 'game-of-thrones',
    body: {
      character: 'Daenerys Targaryen',
      quote: 'I am the blood of the dragon.'
    }
  });

  await client.index({
    index: 'game-of-thrones',
    // here we are forcing an index refresh,
    // otherwise we will not get any result
    // in the consequent search
    refresh: true,
    body: {
      character: 'Tyrion Lannister',
      quote: 'A mind needs books like a sword needs a whetstone.'
    }
  });
}

run().catch(console.log);
