import {
  FirehoseClient,
  PutRecordCommand,
  PutRecordBatchCommand,
} from '@aws-sdk/client-firehose'
import { XapiRecord } from '../interfaces/xapiRecord'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const xapiJson = require('./firehoseExampleData.json')

const client = new FirehoseClient({ region: 'ap-northeast-2' })

async function sendEvents(xAPIEvents: string[]): Promise<boolean> {
  const userId = 'my-user-id'
  const email = 'my-email'
  const serverTimestamp = Date.now()

  const xAPIRecords: XapiRecord[] = xAPIEvents.map((xapi: any) => {
    return { xapi: JSON.parse(xapi), userId, email, serverTimestamp }
  })

  await batchSendToFirehose(xAPIRecords)
  return true
}

async function sendToFirehose(xAPIRecord: XapiRecord) {
  try {
    const json = JSON.stringify(xAPIRecord)
    const record = { Data: Buffer.from(json) }
    const command = new PutRecordCommand({
      DeliveryStreamName: 'kidsloop-alpha-xapi-ace-ray',
      Record: record,
    })
    const output = await client.send(command)
  } catch (error) {
    console.log(error)
  }
}

async function batchSendToFirehose(xAPIRecords: XapiRecord[]) {
  try {
    const command = new PutRecordBatchCommand({
      DeliveryStreamName: 'kidsloop-alpha-xapi-ace-ray',
      Records: xAPIRecords.map((xAPIRecord) => {
        const json = JSON.stringify(xAPIRecord)
        return { Data: Buffer.from(json) }
      }),
    })
    //const output = await client.send(command);
    //console.log(output);
  } catch (error) {
    console.log(error)
  }
}

sendEvents([JSON.stringify(xapiJson)]).catch(console.log)
