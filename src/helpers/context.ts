import { KidsloopAuthenticationToken } from 'kidsloop-token-validation'

export interface Context {
  authenticationToken?: KidsloopAuthenticationToken
  ip: string
}
