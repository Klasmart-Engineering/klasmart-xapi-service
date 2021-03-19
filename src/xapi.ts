import { Context } from './context';
import { XAPIRecord } from './xapiRecord';
import geoip from 'geoip-lite';
import { createHash } from 'crypto';
import { XAPIRecordSender } from './xapiRecordSender';

export class XAPI {
  private recordSenders: XAPIRecordSender[];

  public constructor(recordSenders: XAPIRecordSender[]) {
    this.recordSenders = recordSenders;
  }

  public async sendEvents(
    { xAPIEvents }: any,
    context: Context,
  ): Promise<boolean> {
    const userId = context?.token?.id;
    const ip = context.ip;
    const serverTimestamp = Date.now();

    const geo = geoip.lookup(ip);
    const ipHash = createHash('sha256').update(ip).digest('hex');

    const xAPIRecords: XAPIRecord[] = xAPIEvents.map((xapi: any) => {
      return { xapi: JSON.parse(xapi), userId, ipHash, geo, serverTimestamp };
    });

    await Promise.allSettled(
      this.recordSenders.map((x) => x.send(xAPIRecords)),
    );

    return true;
  }
}
