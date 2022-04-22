import { IGeolocationInfo } from './geolocationInfo'

export interface XapiRecord {
  xapi: unknown
  userId: string
  roomId?: string | null
  isReview: boolean
  geo: IGeolocationInfo | null
  ipHash: string
  serverTimestamp: number
}
