import { XapiRecordBuilder } from '../tests/toolbox/builders/xapiRecordBuilder'

const xapiRecord = new XapiRecordBuilder()
console.log(`${JSON.stringify(xapiRecord).replace(/\"/g, '\\"')}`)
