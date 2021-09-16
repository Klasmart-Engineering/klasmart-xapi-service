import { v4 } from 'uuid'
import { IGeolocationInfo } from '../../../src/interfaces/geolocationInfo'
import { XapiRecord } from '../../../src/interfaces/xapiRecord'

export class XapiRecordBuilder {
  private userId = v4()
  private serverTimestamp = Date.now()
  private ipHash = '123'
  private geo: IGeolocationInfo | null = {}
  private xapi: unknown = { a: 1, b: 2 }

  public withUserId(value: string): this {
    this.userId = value
    return this
  }

  public withServerTimestamp(value: number): this {
    this.serverTimestamp = value
    return this
  }

  public withIpHash(value: string): this {
    this.ipHash = value
    return this
  }

  public withGeo(value: IGeolocationInfo | null): this {
    this.geo = value
    return this
  }

  public withXapi(value: unknown): this {
    this.xapi = value
    return this
  }

  public build(): XapiRecord {
    return {
      userId: this.userId,
      serverTimestamp: this.serverTimestamp,
      ipHash: this.ipHash,
      geo: this.geo,
      xapi: this.xapi,
    }
  }
}
