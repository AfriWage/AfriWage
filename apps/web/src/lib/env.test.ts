import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

type EnvModule = typeof import('./env');

// The module-level `export const env = parseEnv()` runs at import time, so we
// stub a valid environment before importing the module.
let envModule: EnvModule;

beforeAll(async () => {
  vi.stubEnv('POSTGRES_URL', 'postgres://user:password@host:5432/dbname');
  vi.stubEnv('YELLOWCARD_API_KEY', 'sandbox-test-key');
  vi.stubEnv('YELLOWCARD_API_URL', 'https://api.yellowcard.io');
  envModule = await import('./env');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

const validEnv = {
  POSTGRES_URL: 'postgres://user:password@host:5432/dbname',
  YELLOWCARD_API_KEY: 'sandbox-test-key',
};

describe('parseEnv', () => {
  it('returns the parsed values when all required variables are present', () => {
    const parsed = envModule.parseEnv(validEnv);

    expect(parsed.POSTGRES_URL).toBe(validEnv.POSTGRES_URL);
    expect(parsed.YELLOWCARD_API_KEY).toBe(validEnv.YELLOWCARD_API_KEY);
    expect(parsed.YELLOWCARD_API_URL).toBeUndefined();
  });

  it('accepts postgresql:// connection strings', () => {
    const parsed = envModule.parseEnv({
      ...validEnv,
      POSTGRES_URL: 'postgresql://user:password@host:5432/dbname',
    });

    expect(parsed.POSTGRES_URL).toBe('postgresql://user:password@host:5432/dbname');
  });

  it('trims surrounding whitespace from values', () => {
    const parsed = envModule.parseEnv({
      POSTGRES_URL: '  postgres://user:password@host:5432/dbname  ',
      YELLOWCARD_API_KEY: '  sandbox-test-key  ',
    });

    expect(parsed.POSTGRES_URL).toBe('postgres://user:password@host:5432/dbname');
    expect(parsed.YELLOWCARD_API_KEY).toBe('sandbox-test-key');
  });

  it('throws an error naming the missing POSTGRES_URL', () => {
    expect(() => envModule.parseEnv({ YELLOWCARD_API_KEY: 'sandbox-test-key' })).toThrow(
      /POSTGRES_URL/
    );
  });

  it('throws an error naming the missing YELLOWCARD_API_KEY', () => {
    expect(() =>
      envModule.parseEnv({ POSTGRES_URL: 'postgres://user:password@host:5432/dbname' })
    ).toThrow(/YELLOWCARD_API_KEY/);
  });

  it('throws when POSTGRES_URL is not a postgres connection string', () => {
    expect(() =>
      envModule.parseEnv({
        POSTGRES_URL: 'mysql://user:password@host:3306/dbname',
        YELLOWCARD_API_KEY: 'sandbox-test-key',
      })
    ).toThrow(/postgres/);
  });

  it.each([
    ['postgres://', 'bare scheme with no host'],
    ['postgres:///', 'empty authority with a path'],
    ['postgresql://', 'postgresql scheme with no host'],
    ['postgres://:5432/dbname', 'port but no host'],
  ])('throws when POSTGRES_URL is a malformed same-scheme value (%s — %s)', (malformedValue) => {
    expect(() =>
      envModule.parseEnv({
        POSTGRES_URL: malformedValue,
        YELLOWCARD_API_KEY: 'sandbox-test-key',
      })
    ).toThrow(/postgres/);
  });

  it('throws when YELLOWCARD_API_URL is not a valid URL', () => {
    expect(() => envModule.parseEnv({ ...validEnv, YELLOWCARD_API_URL: 'not-a-url' })).toThrow(
      /YELLOWCARD_API_URL/
    );
  });

  it('treats an empty YELLOWCARD_API_URL as unset', () => {
    const parsed = envModule.parseEnv({ ...validEnv, YELLOWCARD_API_URL: '  ' });

    expect(parsed.YELLOWCARD_API_URL).toBeUndefined();
  });

  it('names every invalid variable in a single error', () => {
    let error: unknown;

    try {
      envModule.parseEnv({});
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('POSTGRES_URL');
    expect((error as Error).message).toContain('YELLOWCARD_API_KEY');
  });
});

describe('module-level env', () => {
  it('is parsed once at module load from the process environment', () => {
    expect(envModule.env.POSTGRES_URL).toBe('postgres://user:password@host:5432/dbname');
    expect(envModule.env.YELLOWCARD_API_KEY).toBe('sandbox-test-key');
    expect(envModule.env.YELLOWCARD_API_URL).toBe('https://api.yellowcard.io');
  });
});
