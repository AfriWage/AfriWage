/**
 * Runs once when a Next.js server instance boots (`next dev` / `next start`),
 * before it starts accepting requests.
 *
 * Validating the server environment here moves missing or misconfigured
 * required variables (e.g. `POSTGRES_URL`, `YELLOWCARD_API_KEY`) from a
 * runtime failure deep inside a request handler to a loud, actionable error
 * at startup.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./lib/env');
  }
}
