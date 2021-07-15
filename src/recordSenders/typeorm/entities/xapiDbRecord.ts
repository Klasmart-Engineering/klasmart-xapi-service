import { Lookup } from 'geoip-lite';
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('XapiDbRecord')
export class XapiDbRecord {
  @PrimaryColumn({ name: 'userId' })
  userId!: string;

  @PrimaryColumn({ type: 'bigint', name: 'serverTimestamp' })
  serverTimestamp!: number;

  @Column({ type: 'json', name: 'data' })
  xapi?: Record<string, unknown>;

  @Column({ name: 'iphash' })
  ipHash!: string;

  @Column({ nullable: true, type: 'json', name: 'geo' })
  geo?: Lookup;
}
