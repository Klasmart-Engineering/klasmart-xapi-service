import path from 'path';
import { createConnection } from 'typeorm';
import { XapiDbRecord } from './entities/entities';

export const USERS_CONNECTION_NAME = 'users';

export async function connectToUserDatabase(): Promise<void> {
  const url = process.env.USER_DATABASE_URL;
  if (!url) {
    throw new Error('Please specify a value for XAPI_DATABASE_URL');
  }

  try {
    await createConnection({
      name: USERS_CONNECTION_NAME,
      type: 'postgres',
      url,
      synchronize: true,
      entities: [
        path.join(__dirname, './entities/*.ts'),
        path.join(__dirname, './entities/*.js'),
        XapiDbRecord,
      ],
    });
    console.log('🐘 Connected to postgres: User database');
  } catch (e) {
    console.log('❌ Failed to connect or initialize postgres: User database');
    throw e;
  }
}
