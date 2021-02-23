import {decode, Secret, verify, VerifyOptions} from "jsonwebtoken"

const issuers = new Map<
    string,
    {
        options: VerifyOptions,
        secretOrPublicKey: Secret,
    }>([
        [
            "KidsLoopUser-live",
            {
                options: {
                    issuer: "KidsLoopUser-live",
                    algorithms: ["RS512"],
                },
                secretOrPublicKey: [
                    "-----BEGIN PUBLIC KEY-----",
                    "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDAGN9KAcc61KBz8EQAH54bFwGK",
                    "6PEQNVXXlsObwFd3Zos83bRm+3grzP0pKWniZ6TL/y7ZgFh4OlUMh9qJjIt6Lpz9",
                    "l4uDxkgDDrKHn8IrflBxjJKq0OyXqwIYChnFoi/HGjcRtJhi8oTFToSvKMqIeUuL",
                    "mWmLA8nXdDnMl7zwoQIDAQAB",
                    "-----END PUBLIC KEY-----",
                ].join("\n")
            }
        ],
        [
            "KidsLoopChinaUser-live",
            {
                options: {
                    issuer: "KidsLoopChinaUser-live",
                    algorithms: ["RS512"],
                },
                secretOrPublicKey: [
                    "-----BEGIN PUBLIC KEY-----",
                    "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwAar3URZdwCSSAAJS5Gx",
                    "UO0j3xaIQgE4sNvQ0vLr1ImxZkoooTsiJn4uzL9hlipPDA98iUvUbx3G6ZuInsu5",
                    "H93CTRKpg69+X2sDtGNHVDVz5BDs0zldB46yuDe4tLkgL7JGOb/OJ6+FA9wBjDAn",
                    "GyMAjrYBf1RZMxEkhSDEh5eYJsR9FgoiDYelsz6uXoftRGdPQ4uhyi/6ZJI4IV/2",
                    "nondOLcFhg74e8ok7HNtt/tKt6ybj38sM27xCiTY7HVzjeOxFQx8aGSU+Lljin7o",
                    "JPNh1SWJFrnjOttGq3EUrnlf4NlTUyClUdk3EHwrkm+frF9qLbl9CNM6ycfXCb3K",
                    "GwIDAQAB",
                    "-----END PUBLIC KEY-----",
                ].join("\n")
            }
        ],
        [
            "kidsloop",
            {
                options: {
                    issuer: "kidsloop",
                    algorithms: [ "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512"]
                },
                secretOrPublicKey: [
                    "-----BEGIN PUBLIC KEY-----",
                    "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxdHMYTqFobj3oGD/JDYb",
                    "DN07icTH/Dj7jBtJSG2clM6hQ1HRLApQUNoqcrcJzA0A7aNqELIJuxMovYAoRtAT",
                    "E1pYMWpVyG41inQiJjKFyAkuHsVzL+t2C778BFxlXTC/VWoR6CowWSWJaYlT5fA/",
                    "krUew7/+sGW6rjV2lQqxBN3sQsfaDOdN5IGkizsfMpdrETbc5tKksNs6nL6SFRDe",
                    "LoS4AH5KI4T0/HC53iLDjgBoka7tJuu3YsOBzxDX22FbYfTFV7MmPyq++8ANbzTL",
                    "sgaD2lwWhfWO51cWJnFIPc7gHBq9kMqMK3T2dw0jCHpA4vYEMjsErNSWKjaxF8O/",
                    "FwIDAQAB",
                    "-----END PUBLIC KEY-----"
                ].join("\n")
            }
        ]
    ]);

if (process.env.NODE_ENV !== "production") {
    issuers.set("calmid-debug",
        {
            options: {
                issuer: "calmid-debug",
                algorithms: [
                    "HS512",
                    "HS384",
                    "HS256",
                ],
            },
            secretOrPublicKey: "iXtZx1D5AqEB0B9pfn+hRQ==",
        }
    );
}

export type JWT = {
    aud: string,
    exp: number,
    iat: number,
    iss: string,
    sub: string,
    TokenType: number,
    Data: string,
    name: string,
    roomid: string,
    teacher: boolean
}

export async function checkToken(token?: string): Promise<JWT> {
    try {
        if (!token) {
            console.error("Missing JWT Token")
            throw new Error("Missing JWT token")
        }
        const payload = decode(token)
        if (!payload || typeof payload === "string") {
            console.error("JWT Payload is incorrect")
            throw new Error("JWT Payload is incorrect")
        }
        const issuer = payload["iss"]
        if (!issuer || typeof issuer !== "string") {
            console.error("JWT Issuer is incorrect")
            throw new Error("JWT Issuer is incorrect")
        }
        const issuerOptions = issuers.get(issuer)
        if (!issuerOptions) {
            console.error("JWT IssuerOptions are incorrect")
            throw new Error("JWT IssuerOptions are incorrect")
        }
        const {options, secretOrPublicKey} = issuerOptions
        return await new Promise((resolve, reject) => {
            verify(token, secretOrPublicKey, options, (err, decoded) => {
                if (err) {
                    reject(err)
                }
                if (decoded) {
                    resolve(<JWT>decoded)
                }
                reject(new Error("Unexpected authorization error"))
            })
        })
    } catch (e) {
        console.error(e)
        throw e
    }
}