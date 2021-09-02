import { IGeolocationInfo } from '../../../interfaces/geolocationInfo'
import { Entity, Column, PrimaryColumn } from 'typeorm'

@Entity('xapi_record')
export class XapiDbRecord {
  @PrimaryColumn({ name: 'user_id' })
  userId!: string

  @PrimaryColumn({
    type: 'bigint',
    name: 'server_timestamp',
    transformer: {
      to: (entityValue: number) => entityValue,
      from: (databaseValue: string): number => Number(databaseValue),
    },
  })
  serverTimestamp!: number

  @Column({ type: 'json' })
  xapi?: unknown

  @Column({ name: 'ip_hash' })
  ipHash!: string

  @Column({ nullable: true, type: 'json' })
  geo?: IGeolocationInfo | null
}
