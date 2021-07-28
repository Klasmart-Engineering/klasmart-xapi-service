import { ApolloServerTestClient } from './createTestClient'
import { gqlTry } from './gqlTry'
import { Headers } from 'node-mocks-http'

export async function sendEventsMutation(
  testClient: ApolloServerTestClient,
  xapiEvents: string[],
  headers?: Headers,
  cookies?: { access?: string },
  logErrors = true,
): Promise<boolean> {
  const { mutate } = testClient

  const operation = () =>
    mutate({
      mutation: SEND_EVENTS,
      variables: { xAPIEvents: xapiEvents },
      headers,
      cookies,
    })

  const res = await gqlTry(operation, logErrors)
  return res.data?.sendEvents as boolean
}

export const SEND_EVENTS = `
mutation sendEvents($xAPIEvents: [String!]!) {
  sendEvents(xAPIEvents: $xAPIEvents)
}
`
