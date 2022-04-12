import { createClient, createCluster } from 'redis'
import { withLogger } from 'kidsloop-nodejs-logger'
import { XapiRecord } from '../interfaces/xapiRecord'
import { IXapiRecordSender } from '../interfaces/xapiRecordSender'

export type RedisClientType =
  | ReturnType<typeof createClient>
  | ReturnType<typeof createCluster>

export type RedisMode = 'NODE' | 'CLUSTER'

const logger = withLogger('Redis')

export class RedisError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, RedisError.prototype)
  }
}

export const connectToRedisCache = async (
  mode: RedisMode,
  url: string,
): Promise<RedisClientType> => {
  let client: RedisClientType
  if (mode === 'CLUSTER') {
    logger.info('🏎 🏎 🏎 🏎  Creating CLUSTER mode Redis connection')
    client = createCluster({
      rootNodes: [{ url }],
    })
  } else {
    logger.info('🏎  Creating NODE mode Redis connection')
    client = createClient({
      url,
    })
  }

  client.on('error', (err) => {
    logger.error('Redis Client Error', err.message)
    throw new RedisError(`Redis Client Error ${err.message}`)
  })
  try {
    await client.connect()
    logger.info('🏎  Connected to Redis')
  } catch (e) {
    logger.error('❌ Failed to connect to Redis')
    throw e
  }
  return client
}

const RedisErrorRecovery =
  (): MethodDecorator =>
  (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ): TypedPropertyDescriptor<any> => {
    const originalMethod = descriptor.value
    // important => don't use an arrow function because we're passing `this`
    descriptor.value = async function (...args: any[]) {
      try {
        const result = await originalMethod.apply(this, args)
        return result
      } catch (error) {
        logger.debug('Redis Error Recovery:', error)
        if (error instanceof RedisError) {
          return undefined
        }
        throw error
      }
    }
    return descriptor
  }

export class RedisStreamRecordSender implements IXapiRecordSender {
  public static async create(
    mode: RedisMode,
    url: string,
    dataStreamName: string,
  ): Promise<RedisStreamRecordSender> {
    const client = await connectToRedisCache(mode, url)
    return new RedisStreamRecordSender(client, dataStreamName)
  }

  public constructor(
    private readonly client: RedisClientType,
    private readonly dataStreamName: string,
  ) {}

  @RedisErrorRecovery()
  public async sendRecords(
    xapiRecords: ReadonlyArray<XapiRecord>,
  ): Promise<boolean> {
    try {
      const entryIds = await Promise.all(
        xapiRecords.map(async (x) => {
          const data = {
            data: JSON.stringify(x),
          }
          const entryId = await this.client.xAdd(this.dataStreamName, '*', data)
          return entryId
        }),
      )
      logger.debug('uploaded events to Redis Stream', entryIds)
    } catch (e) {
      const message = e instanceof Error ? e.stack : e
      logger.error(message)
      return false
    }

    return true
  }
}
