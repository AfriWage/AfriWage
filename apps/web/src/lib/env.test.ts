import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

type EnvModule = typeof import('./env');

const TEST_SIGNING_KEY = 'SB7TVFWNBNHILFE4TWWHWXJZEVIBRCCFUGEVA477HKXYDEWF2BTC6U73';
const TEST_JWT_SECRET = 'a'.repeat(32);
const TEST_FACTORY_ID = 'CCUQBFFRGR4RUWHKLWSRWKBL3WORHNTHFLTKMHTNUZL4T5733ODN5WD4';
const TEST_TOKEN_ID = 'CAH4PUADD2X3K52TKETWTIL4GHPZT55LWUEVVOSH6B3D3KA2ZH7HQGTT';

// The module-level `export const env = parseEnv()` runs at import time, so we
// stub a valid environment before importing the module.
let envModule: EnvModule;

beforeAll(async () => {
  vi.stubEnv('POSTGRES_URL', 'postgres://user:password@host:5432/dbname');
  vi.stubEnv('YELLOWCARD_API_KEY', 'sandbox-test-key');
  vi.stubEnv('YELLOWCARD_API_URL', 'https://api.yellowcard.io');
  vi.stubEnv('AUTH_SERVER_SIGNING_KEY', TEST_SIGNING_KEY);
  vi.stubEnv('JWT_SECRET', TEST_JWT_SECRET);
  vi.stubEnv('NEXT_PUBLIC_AUTH_HOME_DOMAIN', 'afriwage.app');
  vi.stubEnv('CHARTER_FACTORY_CONTRACT_ID', TEST_FACTORY_ID);
  vi.stubEnv('CHARTER_FACTORY_DEPLOYER_SECRET_KEY', TEST_SIGNING_KEY);
  vi.stubEnv('CHARTER_TREASURY_TOKEN_CONTRACT_ID', TEST_TOKEN_ID);
  envModule = await import('./env');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

const validEnv = {
  POSTGRES_URL: 'postgres://user:password@host:5432/dbname',
  YELLOWCARD_API_KEY: 'sandbox-test-key',
  AUTH_SERVER_SIGNING_KEY: TEST_SIGNING_KEY,
  JWT_SECRET: TEST_JWT_SECRET,
  NEXT_PUBLIC_AUTH_HOME_DOMAIN: 'afriwage.app',
  CHARTER_FACTORY_CONTRACT_ID: TEST_FACTORY_ID,
  CHARTER_FACTORY_DEPLOYER_SECRET_KEY: TEST_SIGNING_KEY,
  CHARTER_TREASURY_TOKEN_CONTRACT_ID: TEST_TOKEN_ID,
};

/** Builds the fixture without one variable, to prove it is required by name. */
function omit<T extends object, K extends keyof T>(source: T, key: K): Omit<T, K> {
  const copy = { ...source };
  delete copy[key];
  return copy;
}

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
      ...validEnv,
      POSTGRES_URL: '  postgres://user:password@host:5432/dbname  ',
      YELLOWCARD_API_KEY: '  sandbox-test-key  ',
    });

    expect(parsed.POSTGRES_URL).toBe('postgres://user:password@host:5432/dbname');
    expect(parsed.YELLOWCARD_API_KEY).toBe('sandbox-test-key');
  });

  it('throws an error naming the missing POSTGRES_URL', () => {
    expect(() => envModule.parseEnv(omit(validEnv, 'POSTGRES_URL'))).toThrow(/POSTGRES_URL/);
  });

  it('throws an error naming the missing YELLOWCARD_API_KEY', () => {
    expect(() => envModule.parseEnv(omit(validEnv, 'YELLOWCARD_API_KEY'))).toThrow(
      /YELLOWCARD_API_KEY/
    );
  });

  it('throws when POSTGRES_URL is not a postgres connection string', () => {
    expect(() =>
      envModule.parseEnv({
        ...validEnv,
        POSTGRES_URL: 'mysql://user:password@host:3306/dbname',
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
        ...validEnv,
        POSTGRES_URL: malformedValue,
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
    expect((error as Error).message).toContain('AUTH_SERVER_SIGNING_KEY');
    expect((error as Error).message).toContain('JWT_SECRET');
    expect((error as Error).message).toContain('NEXT_PUBLIC_AUTH_HOME_DOMAIN');
  });
});

describe('SEP-10 auth variables', () => {
  it('rejects an AUTH_SERVER_SIGNING_KEY that is a public key rather than a secret', () => {
    expect(() =>
      envModule.parseEnv({
        ...validEnv,
        AUTH_SERVER_SIGNING_KEY: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      })
    ).toThrow(/AUTH_SERVER_SIGNING_KEY/);
  });

  it('rejects a JWT_SECRET shorter than 32 characters', () => {
    expect(() => envModule.parseEnv({ ...validEnv, JWT_SECRET: 'too-short' })).toThrow(
      /JWT_SECRET/
    );
  });

  it.each([
    ['https://afriwage.app', 'includes a scheme'],
    ['afriwage.app/auth', 'includes a path'],
    ['afriwage.app/', 'has a trailing slash'],
  ])('rejects a home domain that %s (%s)', (value) => {
    expect(() => envModule.parseEnv({ ...validEnv, NEXT_PUBLIC_AUTH_HOME_DOMAIN: value })).toThrow(
      /NEXT_PUBLIC_AUTH_HOME_DOMAIN/
    );
  });

  it.each([['CHARTER_FACTORY_CONTRACT_ID'], ['CHARTER_TREASURY_TOKEN_CONTRACT_ID']])(
    'rejects an account id where %s expects a contract id',
    (variable) => {
      expect(() =>
        envModule.parseEnv({
          ...validEnv,
          [variable]: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        })
      ).toThrow(new RegExp(variable));
    }
  );

  it('defaults the Soroban RPC URL to the public testnet endpoint', () => {
    expect(envModule.parseEnv(validEnv).NEXT_PUBLIC_SOROBAN_RPC_URL).toBe(
      'https://soroban-testnet.stellar.org'
    );
  });

  it('accepts a host:port home domain for local development', () => {
    const parsed = envModule.parseEnv({
      ...validEnv,
      NEXT_PUBLIC_AUTH_HOME_DOMAIN: 'localhost:3000',
    });

    expect(parsed.NEXT_PUBLIC_AUTH_HOME_DOMAIN).toBe('localhost:3000');
  });
});

describe('module-level env', () => {
  it('is parsed once at module load from the process environment', () => {
    expect(envModule.env.POSTGRES_URL).toBe('postgres://user:password@host:5432/dbname');
    expect(envModule.env.YELLOWCARD_API_KEY).toBe('sandbox-test-key');
    expect(envModule.env.YELLOWCARD_API_URL).toBe('https://api.yellowcard.io');
    expect(envModule.env.AUTH_SERVER_SIGNING_KEY).toBe(TEST_SIGNING_KEY);
    expect(envModule.env.JWT_SECRET).toBe(TEST_JWT_SECRET);
    expect(envModule.env.NEXT_PUBLIC_AUTH_HOME_DOMAIN).toBe('afriwage.app');
  });
});
