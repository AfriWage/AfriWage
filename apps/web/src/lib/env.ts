import { StrKey } from '@stellar/stellar-sdk';
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
 *
 * `NEXT_PUBLIC_AUTH_HOME_DOMAIN` is the one deliberate exception. SEP-10 binds
 * a challenge to a home domain, and the server builds that challenge — so an
 * unset or malformed value produces challenges no client can validate. It has
 * no safe default, which is exactly what this schema exists to catch.
 */

/**
 * Soroban contract ids share one shape, so their schema is built once. A
 * classic account id (`G…`) pasted in place of a contract id (`C…`) is the
 * likely mistake, and StrKey rejects it by name rather than at call time.
 */
function contractIdSchema(name: string) {
  return z
    .string({
      required_error: `${name} is required — add it to your .env.local`,
      invalid_type_error: `${name} must be a string`,
    })
    .trim()
    .refine(
      (value) => StrKey.isValidContract(value),
      `${name} must be a Soroban contract id (starts with C)`
    );
}

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
    .refine((value) => {
      try {
        const url = new URL(value);
        const hasPostgresScheme = url.protocol === 'postgres:' || url.protocol === 'postgresql:';
        // `new URL('postgres://')` parses successfully with an empty host, so
        // a scheme-prefix check is not enough — require a real host too.
        return hasPostgresScheme && url.hostname !== '';
      } catch {
        return false;
      }
    }, 'POSTGRES_URL must be a valid postgres:// or postgresql:// connection string with a host'),

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

  /**
   * Stellar secret key the server signs SEP-10 challenge transactions with.
   *
   * This key is the challenge's source account and never holds funds or signs
   * anything that moves value — an org's treasury is only ever authorised
   * client-side via Freighter. Server-only: never import this module from a
   * client component.
   */
  AUTH_SERVER_SIGNING_KEY: z
    .string({
      required_error: 'AUTH_SERVER_SIGNING_KEY is required — add it to your .env.local',
      invalid_type_error: 'AUTH_SERVER_SIGNING_KEY must be a string',
    })
    .trim()
    .refine(
      (value) => StrKey.isValidEd25519SecretSeed(value),
      'AUTH_SERVER_SIGNING_KEY must be a valid Stellar secret key (starts with S)'
    ),

  /** HMAC secret for the HS256 session JWT issued after SEP-10 verification. */
  JWT_SECRET: z
    .string({
      required_error: 'JWT_SECRET is required — add it to your .env.local',
      invalid_type_error: 'JWT_SECRET must be a string',
    })
    .trim()
    .min(32, 'JWT_SECRET must be at least 32 characters'),

  /**
   * AfriWage's own home domain, used as the SEP-10 `manage_data` key
   * (`"<home_domain> auth"`) so a challenge signed for another site cannot be
   * replayed here. A bare hostname — no scheme, no path, no trailing slash.
   */
  NEXT_PUBLIC_AUTH_HOME_DOMAIN: z
    .string({
      required_error: 'NEXT_PUBLIC_AUTH_HOME_DOMAIN is required — add it to your .env.local',
      invalid_type_error: 'NEXT_PUBLIC_AUTH_HOME_DOMAIN must be a string',
    })
    .trim()
    .min(1, 'NEXT_PUBLIC_AUTH_HOME_DOMAIN must not be empty')
    .refine(
      (value) =>
        /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*(:\d+)?$/i.test(value),
      'NEXT_PUBLIC_AUTH_HOME_DOMAIN must be a bare host such as afriwage.app or localhost:3000 — no scheme or path'
    ),

  /**
   * Charter factory contract that deploys per-organization treasuries.
   *
   * @see docs/charter-treasury.md
   */
  CHARTER_FACTORY_CONTRACT_ID: contractIdSchema('CHARTER_FACTORY_CONTRACT_ID'),

  /**
   * Secret key of the Charter factory's registered `deployer`.
   *
   * Charter's factory is permissioned: `deploy_treasury` requires the stored
   * deployer to authorise every deployment, so an organization cannot provision
   * its own treasury unaided. This key signs **only** that deployment
   * authorization entry. It is not an approver on any treasury and cannot
   * submit, approve or execute a payout — those need an org member's own
   * signature and are built unsigned for Freighter. See docs/charter-treasury.md.
   */
  CHARTER_FACTORY_DEPLOYER_SECRET_KEY: z
    .string({
      required_error: 'CHARTER_FACTORY_DEPLOYER_SECRET_KEY is required — add it to your .env.local',
      invalid_type_error: 'CHARTER_FACTORY_DEPLOYER_SECRET_KEY must be a string',
    })
    .trim()
    .refine(
      (value) => StrKey.isValidEd25519SecretSeed(value),
      'CHARTER_FACTORY_DEPLOYER_SECRET_KEY must be a valid Stellar secret key (starts with S)'
    ),

  /**
   * Stellar Asset Contract address for the token treasuries hold — USDC.
   *
   * This is the contract-id form of the same asset `build-payment.ts` sends as
   * a classic payment, not the issuer account.
   */
  CHARTER_TREASURY_TOKEN_CONTRACT_ID: contractIdSchema('CHARTER_TREASURY_TOKEN_CONTRACT_ID'),

  /**
   * Soroban RPC endpoint. Optional — defaults to the public testnet RPC, the
   * same way `stellar.ts` defaults the Horizon URL.
   */
  NEXT_PUBLIC_SOROBAN_RPC_URL: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z
      .string({ invalid_type_error: 'NEXT_PUBLIC_SOROBAN_RPC_URL must be a string' })
      .trim()
      .url('NEXT_PUBLIC_SOROBAN_RPC_URL must be a valid URL')
      .default('https://soroban-testnet.stellar.org')
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
