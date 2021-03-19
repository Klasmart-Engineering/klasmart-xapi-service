import { Lookup } from 'geoip-lite';

export interface XAPIRecord {
  xapi: any;
  userId?: string;
  geo?: Lookup;
  ipHash: string;
  serverTimestamp: number;
}
