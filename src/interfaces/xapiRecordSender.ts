import { XapiRecord } from './xapiRecord'

export interface IXapiRecordSender {
  sendRecords(xapiRecords: ReadonlyArray<XapiRecord>): Promise<boolean>
}
