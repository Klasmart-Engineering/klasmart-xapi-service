import { IXapiRecordSender } from '../interfaces/xapiRecordSender'
import { DynamoDbRecordSender } from '../recordSenders/dynamoDbRecordSender'
import { ElasticsearchRecordSender } from '../recordSenders/elasticsearchRecordSender'
import { FirehoseRecordSender } from '../recordSenders/firehoseRecordSender'
import { connectToTypeOrmDatabase } from '../recordSenders/typeorm/connectToTypeOrmDatabase'
import { TypeOrmRecordSender } from '../recordSenders/typeorm/typeOrmRecordSender'
import { withLogger } from 'kidsloop-nodejs-logger'
import { logError } from '../helpers/errorLogUtil'

const log = withLogger('getRecordSenders')

export default async function getRecordSenders(): Promise<IXapiRecordSender[]> {
  const recordSenders: IXapiRecordSender[] = []

  if (process.env.DYNAMODB_TABLE_NAME) {
    try {
      const dynamoDbRecordSender = DynamoDbRecordSender.create(
        process.env.DYNAMODB_TABLE_NAME,
      )
      recordSenders.push(dynamoDbRecordSender)
      log.info('🔵 DynamoDB record sender added')
    } catch (e) {
      logError(log, e, 'Error adding DynamoDB record sender')
    }
  } else {
    log.info('To use DynamoDB specify DYNAMODB_TABLE_NAME environment variable')
  }

  if (process.env.ELASTICSEARCH_URL) {
    try {
      const elasticsearch = await ElasticsearchRecordSender.create(
        ElasticsearchRecordSender.getDefaultClient(
          process.env.ELASTICSEARCH_URL,
        ),
      )
      recordSenders.push(elasticsearch)
      log.info('🔎 Elasticsearch record sender added')
    } catch (e) {
      logError(log, e, 'Error adding Elasticsearch record sender')
    }
  } else {
    log.info(
      'To use Elasticsearch specify ELASTICSEARCH_URL environment variable',
    )
  }

  if (process.env.XAPI_DATABASE_URL) {
    try {
      await connectToTypeOrmDatabase(process.env.XAPI_DATABASE_URL)
      const typeOrm = new TypeOrmRecordSender()
      recordSenders.push(typeOrm)
      log.info('🐘 TypeORM record sender added')
    } catch (e) {
      logError(log, e, 'Error adding TypeORM record sender')
    }
  } else {
    log.info('To use TypeORM specify XAPI_DATABASE_URL environment variable')
  }

  if (process.env.FIREHOSE_STREAM_NAME) {
    try {
      const firehoseRecordSender = FirehoseRecordSender.create(
        process.env.FIREHOSE_STREAM_NAME,
      )
      recordSenders.push(firehoseRecordSender)
      log.info('🚒 Firehose record sender added')
    } catch (e) {
      logError(log, e, 'Error adding Firehose record sender')
    }
  } else {
    log.info(
      'To use Firehose specify FIREHOSE_STREAM_NAME environment variable',
    )
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
