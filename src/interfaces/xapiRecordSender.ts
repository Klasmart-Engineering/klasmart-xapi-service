import { Context } from '../helpers/context'
import { XapiRecord } from './xapiRecord'

export interface IXapiRecordSender {
  sendRecords(
    xapiRecords: ReadonlyArray<XapiRecord>,
    context?: Context,
  ): Promise<boolean>
}
