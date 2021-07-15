import path from 'path';
import { createConnection } from 'typeorm';

export const XAPI_CONNECTION_NAME = 'xapi';

export async function connectToTypeOrmDatabase(): Promise<void> {
  const url = process.env.XAPI_DATABASE_URL;
  if (!url) {
    throw new Error('Please specify a value for XAPI_DATABASE_URL');
  }

  try {
    await createConnection({
      name: XAPI_CONNECTION_NAME,
      type: 'postgres',
      url,
      synchronize: true,
      entities: [
        path.join(__dirname, './entities/*.ts'),
        path.join(__dirname, './entities/*.js'),
      ],
    });
    console.log('🐘 Connected to postgres: xAPI database');
  } catch (e) {
    console.log('❌ Failed to connect or initialize postgres: xAPI database');
    throw e;
  }
}
