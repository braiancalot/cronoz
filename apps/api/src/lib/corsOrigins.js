const DEV_ORIGINS = ["http://localhost:5173"];

const EXPECTED_FORMAT =
  'a comma-separated list like "https://cronoz.teshi.com.br,http://localhost:5173"';

// A trailing slash or a path never matches the browser's Origin header.
function assertBareOrigin(entry) {
  let parsed;
  try {
    parsed = new URL(entry);
  } catch {
    throw new Error(
      `CORS_ALLOWED_ORIGINS has an invalid entry "${entry}"; expected ${EXPECTED_FORMAT}`,
    );
  }

  if (parsed.origin !== entry) {
    throw new Error(
      `CORS_ALLOWED_ORIGINS entry "${entry}" is not a bare origin; expected "${parsed.origin}"`,
    );
  }
}

export function resolveAllowedOrigins(value, { nodeEnv } = {}) {
  const origins = (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (origins.length > 0) {
    origins.forEach(assertBareOrigin);
    return origins;
  }

  if (nodeEnv === "production") {
    throw new Error(
      `CORS_ALLOWED_ORIGINS is empty; expected ${EXPECTED_FORMAT}`,
    );
  }

  return DEV_ORIGINS;
}
