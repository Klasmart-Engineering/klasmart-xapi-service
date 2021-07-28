import { XapiRecord } from './xapiRecord'

export interface IXapiRecordSender {
  sendRecords(xapiRecords: XapiRecord[]): Promise<boolean>
}
