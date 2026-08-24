import type { ErrorEvent } from '@sentry/nextjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { beforeSend, isSentryEnabled, scrubSensitiveData } from './sentry';

describe('isSentryEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns false when neither DSN env var is set', () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', undefined);
    vi.stubEnv('SENTRY_DSN', undefined);
    expect(isSentryEnabled()).toBe(false);
  });

  it('returns true when NEXT_PUBLIC_SENTRY_DSN is set', () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://examplePublicKey@o0.ingest.sentry.io/0');
    vi.stubEnv('SENTRY_DSN', undefined);
    expect(isSentryEnabled()).toBe(true);
  });

  it('returns true when SENTRY_DSN is set', () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', undefined);
    vi.stubEnv('SENTRY_DSN', 'https://examplePublicKey@o0.ingest.sentry.io/0');
    expect(isSentryEnabled()).toBe(true);
  });

  it('returns true when both DSN env vars are set', () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://dsn-a');
    vi.stubEnv('SENTRY_DSN', 'https://dsn-b');
    expect(isSentryEnabled()).toBe(true);
  });
});

describe('scrubSensitiveData', () => {
  it('returns clean strings unchanged', () => {
    expect(scrubSensitiveData('hello world')).toBe('hello world');
  });

  it('redacts Stellar secret keys (S + 55 base32 chars)', () => {
    const secretKey = 'S' + 'A'.repeat(55);
    const input = `key is ${secretKey} end`;
    expect(scrubSensitiveData(input)).toBe('key is [STELLAR_SECRET] end');
  });

  it('does not redact strings shorter than 56 chars starting with S', () => {
    const shortKey = 'S' + 'A'.repeat(10);
    expect(scrubSensitiveData(shortKey)).toBe(shortKey);
  });

  it('redacts API keys assigned with =', () => {
    const input = 'api_key=abcdef1234567890abcdef12';
    expect(scrubSensitiveData(input)).toBe('api_key=[API_KEY_REDACTED]');
  });

  it('redacts API keys assigned with :=', () => {
    const input = 'token: abcdef1234567890abcdef12';
    expect(scrubSensitiveData(input)).toBe('token: [API_KEY_REDACTED]');
  });

  it('redacts bearer tokens', () => {
    const input = 'bearer=abcdef1234567890abcdef12';
    expect(scrubSensitiveData(input)).toBe('bearer=[API_KEY_REDACTED]');
  });

  it('is case-insensitive for API key patterns', () => {
    const input = 'API_KEY=abcdef1234567890abcdef12';
    expect(scrubSensitiveData(input)).toBe('API_KEY=[API_KEY_REDACTED]');
  });

  it('does not redact short API key values', () => {
    const input = 'api_key=short';
    expect(scrubSensitiveData(input)).toBe(input);
  });

  it('redacts long base64 XDR blobs (100+ chars)', () => {
    const xdr = 'A'.repeat(120);
    const input = `transaction: ${xdr}`;
    expect(scrubSensitiveData(input)).toBe('transaction: [XDR_REDACTED]');
  });

  it('does not redact base64 strings shorter than 100 chars', () => {
    const shortB64 = 'A'.repeat(99);
    expect(scrubSensitiveData(shortB64)).toBe(shortB64);
  });

  it('redacts postgres:// connection strings', () => {
    const input = 'connect to postgres://user:pass@host:5432/db';
    expect(scrubSensitiveData(input)).toBe('connect to [DATABASE_URL_REDACTED]');
  });

  it('redacts postgresql:// connection strings', () => {
    const input = 'connect to postgresql://user:pass@host:5432/db';
    expect(scrubSensitiveData(input)).toBe('connect to [DATABASE_URL_REDACTED]');
  });

  it('scrubs multiple sensitive values in one string', () => {
    const secretKey = 'S' + 'B'.repeat(55);
    const input = `key=${secretKey} db=postgres://u:p@h/d`;
    expect(scrubSensitiveData(input)).toBe(
      'key=[STELLAR_SECRET] db=[DATABASE_URL_REDACTED]'
    );
  });

  it('can be called multiple times without stale lastIndex issues', () => {
    const pattern = 'api_key=abcdef1234567890abcdef12';
    // Two consecutive calls should both scrub correctly
    expect(scrubSensitiveData(pattern)).toBe('api_key=[API_KEY_REDACTED]');
    expect(scrubSensitiveData(pattern)).toBe('api_key=[API_KEY_REDACTED]');
  });
});

describe('beforeSend', () => {
  it('scrubs sensitive data from exception messages', () => {
    const secretKey = 'S' + 'C'.repeat(55);
    const event = {
      exception: {
        values: [{ value: `Failed with key ${secretKey}` }],
      },
    };

    const result = beforeSend(event as unknown as ErrorEvent);
    expect(result).not.toBeNull();
    expect(result!.exception!.values![0]!.value).toBe(
      'Failed with key [STELLAR_SECRET]'
    );
  });

  it('scrubs sensitive data from the event message', () => {
    const event = {
      message: 'api_key=abcdef1234567890abcdef12',
    };

    const result = beforeSend(event as unknown as ErrorEvent);
    expect(result!.message).toBe('api_key=[API_KEY_REDACTED]');
  });

  it('scrubs sensitive data in breadcrumb messages', () => {
    const event = {
      breadcrumbs: [
        { message: 'api_key=abcdef1234567890abcdef12' },
        { message: 'safe breadcrumb' },
      ],
    };

    const result = beforeSend(event as unknown as ErrorEvent);
    expect(result!.breadcrumbs![0].message).toBe('api_key=[API_KEY_REDACTED]');
    expect(result!.breadcrumbs![1].message).toBe('safe breadcrumb');
  });

  it('scrubs sensitive data in breadcrumb data values', () => {
    const event = {
      breadcrumbs: [
        {
          message: 'click',
          data: { url: 'postgres://user:pass@host/db', name: 'safe' },
        },
      ],
    };

    const result = beforeSend(event as unknown as ErrorEvent);
    const data = result!.breadcrumbs![0].data as Record<string, string>;
    expect(data.url).toBe('[DATABASE_URL_REDACTED]');
    expect(data.name).toBe('safe');
  });

  it('scrubs sensitive data in event.extra fields', () => {
    const event = {
      extra: {
        config: 'api_key=abcdef1234567890abcdef12',
        safe: 'nothing sensitive here',
      },
    };

    const result = beforeSend(event as unknown as ErrorEvent);
    expect(result!.extra!.config).toBe('api_key=[API_KEY_REDACTED]');
    expect(result!.extra!.safe).toBe('nothing sensitive here');
  });

  it('handles events with no sensitive data', () => {
    const event = {
      message: 'Everything is fine',
    };

    const result = beforeSend(event as unknown as ErrorEvent);
    expect(result).toEqual(event);
  });

  it('handles empty event gracefully', () => {
    const event = {};
    const result = beforeSend(event as unknown as ErrorEvent);
    expect(result).toEqual({});
  });
});
