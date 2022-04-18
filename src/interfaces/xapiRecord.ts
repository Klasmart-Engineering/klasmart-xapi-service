import { IGeolocationInfo } from './geolocationInfo'

export interface XapiRecord {
  xapi: unknown
  userId: string
  roomId?: string
  isReview: boolean
  geo: IGeolocationInfo | null
  ipHash: string
  serverTimestamp: number
}
