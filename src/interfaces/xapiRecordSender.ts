import { XapiRecord } from './xapiRecord'

export interface IXapiRecordSender {
  sendRecords(xAPIRecords: XapiRecord[]): Promise<boolean>
}
