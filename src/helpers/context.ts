import { IToken } from './auth'

export interface Context {
  token?: IToken
  ip: string
}
