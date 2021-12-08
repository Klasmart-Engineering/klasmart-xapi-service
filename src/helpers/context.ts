import { KidsloopAuthenticationToken } from 'kidsloop-token-validation'

export interface Context {
  roomId?: string
  authenticationToken?: KidsloopAuthenticationToken
  ip: string
}
