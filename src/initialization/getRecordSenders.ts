import { IXapiRecordSender } from '../interfaces/xapiRecordSender'
import { DynamoDbRecordSender } from '../recordSenders/dynamoDbRecordSender'
import { ElasticsearchRecordSender } from '../recordSenders/elasticsearchRecordSender'
import { FirehoseRecordSender } from '../recordSenders/firehoseRecordSender'
import { KinesisDataStreamRecordSender } from '../recordSenders/kinesisDataStreamRecordSender'
import {
  RedisMode,
  RedisStreamRecordSender,
} from '../recordSenders/redisStreamRecordSender'
import { connectToTypeOrmDatabase } from '../recordSenders/typeorm/connectToTypeOrmDatabase'
import { TypeOrmRecordSender } from '../recordSenders/typeorm/typeOrmRecordSender'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { logError } from '../helpers/errorLogUtil'
import { RecordSenderAuthTokenDecorator } from '../recordSenders/recordSenderAuthTokenDecorator'

const log = withLogger('getRecordSenders')

export default async function getRecordSenders(): Promise<
  ReadonlyArray<IXapiRecordSender>
> {
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

  if (process.env.KINESIS_DATA_STREAM_NAME) {
    try {
      const kinesisDataStreamRecordSender =
        KinesisDataStreamRecordSender.create(
          process.env.KINESIS_DATA_STREAM_NAME,
        )
      recordSenders.push(kinesisDataStreamRecordSender)
      log.info('🚒 Kinesis Data Stream record sender added')
    } catch (e) {
      logError(log, e, 'Error adding Kinesis Data record sender')
    }
  } else {
    log.info(
      'To use a Kinesis Data Stream specify KINESIS_DATA_STREAM_NAME environment variable',
    )
  }

  const redisMode = (process.env.REDIS_MODE || '').toUpperCase()
  const redisPort = Number(process.env.REDIS_PORT) || undefined
  const redisHost = process.env.REDIS_HOST
  const redisStreamName = process.env.REDIS_STREAM_NAME
  if (
    redisHost &&
    redisPort &&
    ['NODE', 'CLUSTER'].includes(redisMode) &&
    redisStreamName
  ) {
    try {
      const redisStreamRecordSender = await RedisStreamRecordSender.create(
        redisMode as RedisMode,
        redisHost,
        redisPort,
        redisStreamName,
      )
      const recordSender = new RecordSenderAuthTokenDecorator(
        redisStreamRecordSender,
      )
      recordSenders.push(recordSender)
      log.info('🏎  Redis Stream record sender added')
    } catch (e) {
      logError(log, e, 'Error adding Redis Stream record sender')
    }
  } else {
    log.info(
      'To use a Redis Stream specify REDIS_HOST, REDIS_PORT, and REDIS_STREAM_NAME environment variables. ' +
        'In addition, REDIS_MODE should be set to either NODE or CLUSTER.',
    )
  }

  if (recordSenders.length <= 0) {
    throw new Error(NoRecordSendersErrorMessage)
  }
  return recordSenders
}

export const NoRecordSendersErrorMessage =
  '❌ No record senders configured. Specify at least one of the following environment variables\n' +
  '- DYNAMODB_TABLE_NAME\n' +
  '- FIREHOSE_STREAM_NAME\n' +
  '- KINESIS_DATA_STREAM_NAME\n' +
  '- ELASTICSEARCH_URL\n' +
  '- XAPI_DATABASE_URL\n' +
  '- REDIS_HOST, REDIS_PORT, REDIS_MODE and REDIS_STREAM_NAME'
