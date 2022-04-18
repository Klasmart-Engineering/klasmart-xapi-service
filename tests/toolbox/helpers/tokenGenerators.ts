import { sign, SignOptions } from 'jsonwebtoken'
import { FindConditions } from 'typeorm'
import { KidsloopLiveAuthorizationToken } from '@kl-engineering/kidsloop-token-validation'

export function generateAuthenticationToken(
  userId: string,
  email: string,
  isExpired: boolean,
): string {
  const payload = {
    id: userId,
    email: email,
    iss: 'calmid-debug',
  }
  const signOptions: SignOptions = {
    expiresIn: isExpired ? '0s' : '2000s',
  }
  const token = sign(payload, 'iXtZx1D5AqEB0B9pfn+hRQ==', signOptions)
  return token
}

export function generateLiveAuthorizationToken(
  userId: string,
  roomId: string,
  isReview = false,
): string {
  const payload: FindConditions<KidsloopLiveAuthorizationToken> = {
    userid: userId,
    roomid: roomId,
    is_review: isReview,
    iss: 'calmid-debug',
  }
  const signOptions: SignOptions = {
    expiresIn: '2000s',
  }
  const token = sign(payload, 'iXtZx1D5AqEB0B9pfn+hRQ==', signOptions)
  return token
}
