const PUBLIC_PLACEHOLDERS = new Set([
  "dev-secret-change-me",
  "test-secret",
  "changeme",
]);

const MIN_LENGTH_IN_PRODUCTION = 32;

const HOW_TO_GENERATE = "generate one with `openssl rand -base64 32`";

// MUST NOT echo the secret: exception messages reach the logs.
export function assertUsableSecret(secret, { nodeEnv } = {}) {
  if (!secret) {
    throw new Error(`JWT_SECRET is not set; ${HOW_TO_GENERATE}`);
  }

  if (PUBLIC_PLACEHOLDERS.has(secret)) {
    throw new Error(
      `JWT_SECRET is the public placeholder "${secret}"; ${HOW_TO_GENERATE}`,
    );
  }

  if (nodeEnv === "production" && secret.length < MIN_LENGTH_IN_PRODUCTION) {
    throw new Error(
      `JWT_SECRET has ${secret.length} characters; production requires at least ${MIN_LENGTH_IN_PRODUCTION}, so ${HOW_TO_GENERATE}`,
    );
  }

  return secret;
}
