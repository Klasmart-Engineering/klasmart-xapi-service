export default class EndUser {
  public userId!: string
  private _token?: string

  get token(): string | undefined {
    return this._token
  }
}
