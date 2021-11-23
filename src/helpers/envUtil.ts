import { withLogger } from 'kidsloop-nodejs-logger'

const log = withLogger('envUtil')

export function getEnvironmentVariableOrDefault(
  variableName: string,
  defaultValue?: string,
): string | undefined {
  if (process.env[variableName]) {
    return process.env[variableName]
  }
  log.warn(
    `${variableName} environment variable was not provided. Using default value '${defaultValue}'`,
  )
  return defaultValue
}
