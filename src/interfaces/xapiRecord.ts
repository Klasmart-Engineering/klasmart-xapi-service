import { Lookup } from 'geoip-lite'

export interface XapiRecord {
  xapi: any
  userId?: string
  geo?: Lookup
  ipHash: string
  serverTimestamp: number
}
