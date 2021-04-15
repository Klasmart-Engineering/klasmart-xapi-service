export function getEnvironmentVariableOrDefault(
  variableName: string,
  defaultValue?: string
): string | undefined {
  if (process.env[variableName]) {
    return process.env[variableName];
  }
  console.warn(
    `${variableName} environment variable was not provided. ${
      defaultValue ?? `using default value '${defaultValue}'`
    }`
  );
  return defaultValue;
}
