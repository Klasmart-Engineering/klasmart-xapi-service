import { Connection, createConnection } from 'typeorm'
import { XAPI_CONNECTION_NAME } from '../../../src/recordSenders/typeorm/connectToTypeOrmDatabase'

export const createXapiDbConnection = (): Promise<Connection> => {
  return createConnection({
    name: XAPI_CONNECTION_NAME,
    type: 'postgres',
    host: 'localhost',
    port: Number(process.env.TEST_POSTGRES_PORT) || 5443,
    username: 'postgres',
    password: 'xapiserver',
    database: 'test_xapi_db',
    synchronize: true,
    dropSchema: true,
    entities: ['src/recordSenders/typeorm/entities/*.ts'],
  })
}
