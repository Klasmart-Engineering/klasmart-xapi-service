export default function error2Json(
  error: Error | null | undefined,
): string | undefined {
  if (error == null) {
    return undefined
  }
  return JSON.stringify(error, jsonFriendlyErrorReplacer)
}

function jsonFriendlyErrorReplacer(key: string, value: any) {
  if (value instanceof Error) {
    return {
      // Pull all enumerable properties, supporting properties on custom Errors.
      ...value,
      // Explicitly pull Error's non-enumerable properties.
      name: value.name,
      message: value.message,
      stack: process.env.LOG_LEVEL === 'silly' ? value.stack : undefined,
    }
  }

  return value
}
