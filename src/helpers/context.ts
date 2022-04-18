import { KidsloopAuthenticationToken } from '@kl-engineering/kidsloop-token-validation'

export interface Context {
  roomId?: string
  authenticationToken?: KidsloopAuthenticationToken
  ip: string
  isReview?: boolean
}
