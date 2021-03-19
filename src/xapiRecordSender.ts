import { XAPIRecord } from './xapiRecord';

export interface XAPIRecordSender {
  send(xAPIRecords: XAPIRecord[]): Promise<boolean>;
}
