import { getRepository } from 'typeorm';
import { XAPIRecord } from '../xapiRecord';
import { XAPIRecordSender } from '../xapiRecordSender';
import { USERS_CONNECTION_NAME } from './connectToUserDatabase';
import { XapiDbRecord } from './entities/entities';

export class TypeORMRecordSender implements XAPIRecordSender {
  public constructor(
    private repository = getRepository(XapiDbRecord, USERS_CONNECTION_NAME),
  ) {}

  public async send(xAPIRecords: XAPIRecord[]): Promise<boolean> {
    const promises = xAPIRecords.map(async (x) => {
      try {
        const record = this.repository.create();
        record.userId = x.userId || 'undefined';
        record.serverTimestamp = x.serverTimestamp;
        record.xapi = x.xapi;
        record.ipHash = x.ipHash;
        record.geo = x.geo;
        await this.repository.save(x);
      } catch (e) {
        console.error(e);
        throw e;
      }
    });
    const results = await Promise.allSettled(promises);
    const everyPromiseSuceeded = results.every(
      (result) => result.status === 'fulfilled',
    );
    return everyPromiseSuceeded;
  }
}
