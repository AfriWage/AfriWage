import { z } from 'zod';

/**
 * Zod schema for the server-side environment variables AfriWage needs at boot.
 *
 * This module is **server-only** and must never be imported from client
 * components. It is loaded once, at server startup, by `src/instrumentation.ts`,
 * so a missing or malformed required variable fails loudly at boot instead of
 * deep inside a request handler.
 *
 * `NEXT_PUBLIC_*` variables are intentionally excluded from server-only
 * validation: they are inlined into the client bundle at build time and read
 * with safe defaults in `src/lib/stellar.ts`.
 */

const serverEnvSchema = z.object({
  /**
   * Postgres connection string used by `@AfriWage/db` (Drizzle) for settings
   * persistence. Required once issue #3 (settings persistence) lands, so a
   * missing value should fail at startup rather than on the first settings
   * save in production.
   */
  POSTGRES_URL: z
    .string({
      required_error: 'POSTGRES_URL is required — add it to your .env.local',
      invalid_type_error: 'POSTGRES_URL must be a string',
    })
    .trim()
    .min(1, 'POSTGRES_URL must not be empty')
    .refine(
      (value) => {
        try {
          const url = new URL(value);
          const hasPostgresScheme =
            url.protocol === 'postgres:' || url.protocol === 'postgresql:';
          // `new URL('postgres://')` parses successfully with an empty host, so
          // a scheme-prefix check is not enough — require a real host too.
          return hasPostgresScheme && url.hostname !== '';
        } catch {
          return false;
        }
      },
      'POSTGRES_URL must be a valid postgres:// or postgresql:// connection string with a host'
    ),

  /** API key for the Yellow Card anchor (server-side SEP-6 off-ramp). */
  YELLOWCARD_API_KEY: z
    .string({
      required_error: 'YELLOWCARD_API_KEY is required — add it to your .env.local',
      invalid_type_error: 'YELLOWCARD_API_KEY must be a string',
    })
    .trim()
    .min(1, 'YELLOWCARD_API_KEY must not be empty'),

  /**
   * Yellow Card API base URL. Optional — the SDK falls back to
   * `https://api.yellowcard.io` when unset. When set, it must be a valid URL.
   */
  YELLOWCARD_API_URL: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z
      .string({
        invalid_type_error: 'YELLOWCARD_API_URL must be a string',
      })
      .trim()
      .url('YELLOWCARD_API_URL must be a valid URL')
      .optional()
  ),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates the given environment (defaults to `process.env`) against the
 * server schema and returns the parsed values. Throws an error that names
 * every missing or invalid variable so operators know exactly what to fix.
 */
export function parseEnv(env: Record<string, string | undefined> = process.env): ServerEnv {
  const parsed = serverEnvSchema.safeParse(env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Invalid server environment variables:\n${details}`);
  }

  return parsed.data;
}

/**
 * Parsed server environment, validated once at module load. Importing this
 * module (server-side) is what triggers startup validation — see
 * `src/instrumentation.ts`.
 */
export const env = parseEnv();
