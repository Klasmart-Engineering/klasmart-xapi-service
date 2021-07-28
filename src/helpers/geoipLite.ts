import { IGeolocationInfo } from '../interfaces/geolocationInfo'
import { IGeolocationProvider } from '../interfaces/geolocationProvider'
import geoip from 'geoip-lite'

export class GeoIPLite implements IGeolocationProvider {
  public getInfo(ip: string): IGeolocationInfo | null {
    // When testing locally, keep in mind that localhost (127.0.0.1 || ::1)
    // doesn't work, so it returns null.
    return geoip.lookup(ip)
  }
}
