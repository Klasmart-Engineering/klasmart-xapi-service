import { JWT } from './auth'

export interface Context {
  token?: JWT
  ip: string
}
