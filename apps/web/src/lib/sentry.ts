import * as Sentry from '@sentry/nextjs';
import type { ErrorEvent, EventHint } from '@sentry/nextjs';

/**
 * Patterns for sensitive data that must never appear in Sentry payloads.
 * Each entry is a regex applied to every string value in the event before
 * it leaves the client or server.
 */
const SENSITIVE_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Stellar secret keys (start with S, 56 chars base32)
  { pattern: /\bS[A-Z2-7]{55}\b/g, replacement: '[STELLAR_SECRET]' },
  // Yellow Card / third-party API keys (long alphanumeric strings)
  { pattern: /(?:api[_-]?key|apikey|secret|token|bearer)\s*[:=]\s*['"]?[\w\-\.]{20,}/gi, replacement: '[API_KEY_REDACTED]' },
  // Full XDR blobs (base64, typically 100+ chars)
  { pattern: /\b[A-Za-z0-9+/_-]{100,}={0,2}\b/g, replacement: '[XDR_REDACTED]' },
  // Postgres connection strings
  { pattern: /(?:postgres(?:ql)?):\/\/[^\s'"]+/gi, replacement: '[DATABASE_URL_REDACTED]' },
];

/** Returns true if Sentry reporting is configured in this environment. */
export function isSentryEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
  );
}

/**
 * Scrub sensitive data from any string value.
 * Exported so it can be reused in ad-hoc captures elsewhere.
 */
export function scrubSensitiveData(value: string): string {
  let scrubbed = value;
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    // Reset lastIndex for global regexes used across multiple calls
    pattern.lastIndex = 0;
    scrubbed = scrubbed.replace(pattern, replacement);
  }
  return scrubbed;
}

/**
 * `beforeSend` callback shared by client and server Sentry init.
 * Strips sensitive fields from the event before it reaches Sentry.
 */
export function beforeSend(
  event: ErrorEvent,
  _hint: EventHint
): ErrorEvent | null {
  // Scrub the exception message
  if (event.exception?.values) {
    for (const exc of event.exception.values) {
      if (exc.value) {
        exc.value = scrubSensitiveData(exc.value);
      }
    }
  }

  // Scrub the log message
  if (event.message) {
    event.message = scrubSensitiveData(event.message);
  }

  // Scrub breadcrumbs
  if (event.breadcrumbs) {
    for (const bc of event.breadcrumbs) {
      if (typeof bc.message === 'string') {
        bc.message = scrubSensitiveData(bc.message);
      }
      if (bc.data && typeof bc.data === 'object') {
        for (const [key, val] of Object.entries(bc.data)) {
          if (typeof val === 'string') {
            (bc.data as Record<string, string>)[key] = scrubSensitiveData(val);
          }
        }
      }
    }
  }

  // Scrub extra data
  if (event.extra) {
    for (const [key, val] of Object.entries(event.extra)) {
      if (typeof val === 'string') {
        event.extra[key] = scrubSensitiveData(val);
      }
    }
  }

  return event;
}
