import Redis, { Cluster } from 'ioredis'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { XapiRecord } from '../interfaces/xapiRecord'
import { IXapiRecordSender } from '../interfaces/xapiRecordSender'

export type RedisClientType = Redis | Cluster
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
  host: string,
  port: number,
): Promise<RedisClientType> => {
  let client: RedisClientType
  if (mode === 'CLUSTER') {
    logger.info('🏎 🏎 🏎 🏎  Creating CLUSTER mode Redis connection')
    client = new Redis.Cluster(
      [
        {
          host,
          port,
        },
      ],
      {
        lazyConnect: true,
        redisOptions: {
          password: process.env.REDIS_PASS,
          reconnectOnError: (err) => {
            const targetError = 'READONLY'
            if (err.message.includes(targetError)) {
              // Only reconnect when the error contains "READONLY"
              return true
            }
            return false
          },
        },
      },
    )
  } else {
    logger.info('🏎  Creating NODE mode Redis connection')
    client = new Redis(port, host, {
      lazyConnect: true,
      password: process.env.REDIS_PASS,
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
    target: unknown,
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
    host: string,
    port: number,
    dataStreamName: string,
  ): Promise<RedisStreamRecordSender> {
    const client = await connectToRedisCache(mode, host, port)
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
          const entryId = await this.client.xadd(
            this.dataStreamName,
            '*',
            'data',
            JSON.stringify(x),
          )
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
