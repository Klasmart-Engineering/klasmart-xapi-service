import { IGeolocationInfo } from './geolocationInfo'

export interface IGeolocationProvider {
  getInfo(ip: string): IGeolocationInfo | null
}
