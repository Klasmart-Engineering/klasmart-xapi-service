import { IXapiRecordSender } from '../interfaces/xapiRecordSender'
import { DynamoDbRecordSender } from '../recordSenders/dynamoDbRecordSender'
import { ElasticsearchRecordSender } from '../recordSenders/elasticsearchRecordSender'
import { FirehoseRecordSender } from '../recordSenders/firehoseRecordSender'
import { connectToTypeOrmDatabase } from '../recordSenders/typeorm/connectToTypeOrmDatabase'
import { TypeOrmRecordSender } from '../recordSenders/typeorm/typeOrmRecordSender'

export default async function getRecordSenders(): Promise<IXapiRecordSender[]> {
  const recordSenders: IXapiRecordSender[] = []
  try {
    const dynamoDbRecordSender = DynamoDbRecordSender.create()
    recordSenders.push(dynamoDbRecordSender)
    console.log('🔵 DynamoDB record sender added')
  } catch (e) {
    console.error(e)
  }

  try {
    const elasticsearch = await ElasticsearchRecordSender.create()
    recordSenders.push(elasticsearch)
    console.log('🔎 Elasticsearch record sender added')
  } catch (e) {
    console.error(e)
  }

  try {
    await connectToTypeOrmDatabase()
    const typeOrm = new TypeOrmRecordSender()
    recordSenders.push(typeOrm)
    console.log('🐘 TypeORM record sender added')
  } catch (e) {
    console.error(e)
  }

  try {
    const firehoseRecordSender = FirehoseRecordSender.create()
    recordSenders.push(firehoseRecordSender)
    console.log('🚒 Firehose record sender added')
  } catch (e) {
    console.error(e)
  }

  if (recordSenders.length <= 0) {
    throw new Error(
      '❌ No record senders configured, specify at least one of the following environment variables\n' +
        '- DYNAMODB_TABLE_NAME\n' +
        '- FIREHOSE_STREAM_NAME\n' +
        '- ELASTICSEARCH_URL\n' +
        '- XAPI_DATABASE_URL',
    )
  }
  return recordSenders
}
