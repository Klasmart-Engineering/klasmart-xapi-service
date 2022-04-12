import expect from '../toolbox/helpers/chaiAsPromisedSetup'
import getRecordSenders, {
  NoRecordSendersErrorMessage,
} from '../../src/initialization/getRecordSenders'

describe('getRecordSenders', () => {
  let dynamodbEnv: string | undefined
  let firehoseEnv: string | undefined
  let elasticsearchEnv: string | undefined
  let dbEnv: string | undefined
  let redisHost: string | undefined
  let redisPort: string | undefined
  let redisMode: string | undefined
  let redisStream: string | undefined

  context('zero record senders are configured', () => {
    before(() => {
      dynamodbEnv = process.env.DYNAMODB_TABLE_NAME
      firehoseEnv = process.env.FIREHOSE_STREAM_NAME
      elasticsearchEnv = process.env.ELASTICSEARCH_URL
      dbEnv = process.env.XAPI_DATABASE_URL
      redisHost = process.env.REDIS_HOST
      redisPort = process.env.REDIS_PORT
      redisMode = process.env.REDIS_MODE
      redisStream = process.env.REDIS_STREAM_NAME
      delete process.env.DYNAMODB_TABLE_NAME
      delete process.env.FIREHOSE_STREAM_NAME
      delete process.env.ELASTICSEARCH_URL
      delete process.env.XAPI_DATABASE_URL
      delete process.env.REDIS_HOST
      delete process.env.REDIS_PORT
      delete process.env.REDIS_MODE
      delete process.env.REDIS_STREAM_NAME
    })

    after(() => {
      process.env.DYNAMODB_TABLE_NAME = dynamodbEnv
      process.env.FIREHOSE_STREAM_NAME = firehoseEnv
      process.env.ELASTICSEARCH_URL = elasticsearchEnv
      process.env.XAPI_DATABASE_URL = dbEnv
      process.env.REDIS_HOST = redisHost
      process.env.REDIS_PORT = redisPort
      process.env.REDIS_MODE = redisMode
      process.env.REDIS_STREAM_NAME = redisStream
    })

    it('throws an error informing the developer to configure at least one record sender', async () => {
      const fn = () => getRecordSenders()
      await expect(fn()).to.be.rejectedWith(NoRecordSendersErrorMessage)
    })
  })
})
