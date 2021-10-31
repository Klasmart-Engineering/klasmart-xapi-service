import { v4 } from 'uuid'
import EndUser from '../helpers/endUser'
import generateAuthenticationToken from '../helpers/generateAuthenticationToken'

export default class EndUserBuilder {
  private userId = v4()
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
      token: this.isAuthenticated
        ? generateAuthenticationToken(this.userId, this.email, this.isExpired)
        : undefined,
    }
  }
}
