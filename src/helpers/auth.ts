import { verify, decode, VerifyOptions, Secret } from 'jsonwebtoken'

export interface IToken {
  id?: string
  email?: string
}

type Issuer = {
  options: VerifyOptions
  secretOrPublicKey: Secret
}

export const debugJwtIssuer: Issuer = {
  options: {
    issuer: 'calmid-debug',
    algorithms: ['HS512', 'HS384', 'HS256'],
  },
  secretOrPublicKey: 'iXtZx1D5AqEB0B9pfn+hRQ==',
}

const issuers = new Map<string, Issuer>([
  [
    'kidsloop',
    {
      options: {
        issuer: 'kidsloop',
        algorithms: ['RS512'],
      },
      secretOrPublicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxdHMYTqFobj3oGD/JDYb
DN07icTH/Dj7jBtJSG2clM6hQ1HRLApQUNoqcrcJzA0A7aNqELIJuxMovYAoRtAT
E1pYMWpVyG41inQiJjKFyAkuHsVzL+t2C778BFxlXTC/VWoR6CowWSWJaYlT5fA/
krUew7/+sGW6rjV2lQqxBN3sQsfaDOdN5IGkizsfMpdrETbc5tKksNs6nL6SFRDe
LoS4AH5KI4T0/HC53iLDjgBoka7tJuu3YsOBzxDX22FbYfTFV7MmPyq++8ANbzTL
sgaD2lwWhfWO51cWJnFIPc7gHBq9kMqMK3T2dw0jCHpA4vYEMjsErNSWKjaxF8O/
FwIDAQAB
-----END PUBLIC KEY-----`,
    },
  ],
  ['calmid-debug', debugJwtIssuer],
  [
    'KidsLoopChinaUser-live',
    {
      options: {
        issuer: 'KidsLoopChinaUser-live',
        algorithms: ['RS512'],
      },
      secretOrPublicKey: [
        '-----BEGIN PUBLIC KEY-----',
        'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDAGN9KAcc61KBz8EQAH54bFwGK',
        '6PEQNVXXlsObwFd3Zos83bRm+3grzP0pKWniZ6TL/y7ZgFh4OlUMh9qJjIt6Lpz9',
        'l4uDxkgDDrKHn8IrflBxjJKq0OyXqwIYChnFoi/HGjcRtJhi8oTFToSvKMqIeUuL',
        'mWmLA8nXdDnMl7zwoQIDAQAB',
        '-----END PUBLIC KEY-----',
      ].join('\n'),
    },
  ],
])

export class TokenDecoder {
  public decode(token: string): null | { [key: string]: unknown } | string {
    return decode(token)
  }
}

export async function checkToken(
  token: string | undefined,
  tokenDecoder: TokenDecoder,
): Promise<IToken | undefined> {
  if (!token) {
    return
  }
  const payload = tokenDecoder.decode(token)
  if (!payload || typeof payload === 'string') {
    return
  }
  const issuer = payload['iss']
  if (!issuer || typeof issuer !== 'string') {
    return
  }
  const issuerOptions = issuers.get(issuer)
  if (!issuerOptions) {
    return
  }
  const { options, secretOrPublicKey } = issuerOptions
  const verifiedToken = await new Promise<IToken>((resolve, reject) => {
    verify(token, secretOrPublicKey, options, (err, decoded) => {
      if (err) {
        reject(err)
      }
      if (decoded) {
        resolve(decoded)
      }
      reject(new Error('Unexpected authorization error'))
    })
  })
  return verifiedToken
}
