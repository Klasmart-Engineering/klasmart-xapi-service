import { IGeolocationInfo } from './geolocationInfo'

export interface XapiRecord {
  xapi: unknown
  userId: string
  roomId?: string
  geo: IGeolocationInfo | null
  ipHash: string
  serverTimestamp: number
}
