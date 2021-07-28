import { sign, SignOptions } from 'jsonwebtoken'
import { debugJwtIssuer } from '../../../src/helpers/auth'
import EndUser from '../helpers/endUser'

export default class EndUserBuilder {
  private userId = 'user1'
  private email = 'user1@gmail.com'
  private isAuthenticated = false
  private isExpired = false

  public authenticate(): this {
    this.isAuthenticated = true
    return this
  }

  public dontAuthenticate(): this {
    this.isAuthenticated = false
    return this
  }

  public expiredToken(): this {
    this.isAuthenticated = true
    this.isExpired = true
    return this
  }

  public build(): EndUser {
    return {
      userId: this.userId,
      token: this.isAuthenticated ? this.generateToken() : undefined,
    }
  }

  private generateToken(): string {
    const payload = {
      id: this.userId,
      email: this.email,
      iss: debugJwtIssuer.options.issuer,
    }
    const signOptions: SignOptions = {
      expiresIn: this.isExpired ? '0s' : '2000s',
    }
    const token = sign(payload, debugJwtIssuer.secretOrPublicKey, signOptions)
    return token
  }
}
