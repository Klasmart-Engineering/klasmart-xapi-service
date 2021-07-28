import { IGeolocationInfo } from '../../../interfaces/geolocationInfo'
import { Entity, Column, PrimaryColumn } from 'typeorm'

@Entity('XapiDbRecord')
export class XapiDbRecord {
  @PrimaryColumn({ name: 'userId' })
  userId!: string

  @PrimaryColumn({
    type: 'bigint',
    transformer: {
      to: (entityValue: number) => entityValue,
      from: (databaseValue: string): number => Number(databaseValue),
    },
  })
  serverTimestamp!: number

  @Column({ type: 'json', name: 'data' })
  xapi?: unknown

  @Column({ name: 'iphash' })
  ipHash!: string

  @Column({ nullable: true, type: 'json', name: 'geo' })
  geo?: IGeolocationInfo | null
}
