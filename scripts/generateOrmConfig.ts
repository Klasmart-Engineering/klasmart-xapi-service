#!/usr/bin/env ts-node

import fs from 'fs'
import path from 'path'
import { getTypeOrmDatabaseConnectionOptions } from '../src/recordSenders/typeorm/connectToTypeOrmDatabase'

const xapiDatabaseUrl = process.env.XAPI_DATABASE_URL
if (!xapiDatabaseUrl) {
  throw new Error('Please specify a value for XAPI_DATABASE_URL')
}

const config = getTypeOrmDatabaseConnectionOptions(xapiDatabaseUrl)
const configPath = path.join(__dirname, '../ormConfig.json')

fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

console.log(
  `TyprORM config saved to ${path.relative(process.cwd(), configPath)}`,
)
