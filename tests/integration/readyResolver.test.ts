import { expect } from 'chai'
import { GeoIPLite } from '../../src/helpers/geoipLite'
import createXapiServer from '../../src/initialization/createXapiServer'
import { XapiRecord } from '../../src/interfaces/xapiRecord'
import { IXapiRecordSender } from '../../src/interfaces/xapiRecordSender'
import { XapiEventDispatcher } from '../../src/xapiEventDispatcher'
import {
  ApolloServerTestClient,
  createTestClient,
} from '../toolbox/helpers/createTestClient'
import { gqlTry } from '../toolbox/helpers/gqlTry'

describe('readyResolver', () => {
  context('server is up and running', () => {
    let testClient: ApolloServerTestClient

    before(async () => {
      const geolocationProvider = new GeoIPLite()
      const { app, server } = await createXapiServer(
        new XapiEventDispatcher([new DummyRecordSender()], geolocationProvider),
      )
      testClient = createTestClient(server, app)
    })

    it('returns true', async () => {
      const result = await readyQuery(testClient)
      expect(result).to.be.true
    })
  })
})

export async function readyQuery(
  testClient: ApolloServerTestClient,
): Promise<boolean> {
  const { query } = testClient

  const operation = () =>
    query({
      query: 'query { ready }',
    })

  const res = await gqlTry(operation, true)
  return res.data?.ready
}

class DummyRecordSender implements IXapiRecordSender {
  sendRecords(xapiRecords: XapiRecord[]): Promise<boolean> {
    return Promise.resolve(true)
  }
}
