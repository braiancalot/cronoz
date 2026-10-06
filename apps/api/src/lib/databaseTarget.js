const LOOPBACK_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

const EXPECTED_FORMAT =
  'a Postgres URL like "postgresql://user:password@host/database"';

// The value carries the password, so no message here may echo it whole.
function hostOf(connectionString) {
  try {
    // WHATWG lowercases the host only for http-like schemes.
    return new URL(connectionString).hostname.toLowerCase();
  } catch {
    throw new Error(`DATABASE_URL is not a URL; expected ${EXPECTED_FORMAT}`);
  }
}

// The dev credentials are versioned, so production MUST NOT accept the
// database they open.
function assertRemoteHost(connectionString) {
  const host = hostOf(connectionString);
  if (!LOOPBACK_HOSTS.includes(host)) return;
  throw new Error(
    `DATABASE_URL points at "${host}" under NODE_ENV=production; expected a remote Postgres host`,
  );
}

export function resolveDatabaseUrl(value, { nodeEnv } = {}) {
  if (!value) {
    throw new Error(`DATABASE_URL is not set; expected ${EXPECTED_FORMAT}`);
  }
  if (nodeEnv === "production") assertRemoteHost(value);
  return value;
}
