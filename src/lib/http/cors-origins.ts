/**
 * Origins allowed to call public BFF routes from Flutter web.
 * Set TECHSTORE_CORS_ORIGINS as a comma-separated list (no secrets).
 * Default is local Flutter `web-server` on port 8080.
 */
export function getAllowedCorsOrigins(): string[] {
  const fromEnv = (process.env.TECHSTORE_CORS_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (fromEnv.length > 0) {
    return fromEnv;
  }

  return ['http://localhost:8080', 'http://127.0.0.1:8080'];
}
