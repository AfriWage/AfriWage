import { beforeEach, describe, expect, it, vi } from 'vitest';

// `register()` dynamically imports `./lib/env`, whose module-level
// `export const env = parseEnv()` runs at import time. Each test therefore
// resets the module registry and stubs a fresh environment before invoking
// `register()`, so the startup wiring is exercised end to end.
async function registerWith(env: Record<string, string>): Promise<void> {
  vi.resetModules();
  vi.stubEnv('NEXT_RUNTIME', 'nodejs');
  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value);
  }
  const { register } = await import('./instrumentation');
  await register();
}

const validEnv = {
  POSTGRES_URL: 'postgres://user:password@host:5432/dbname',
  YELLOWCARD_API_KEY: 'sandbox-test-key',
};

beforeEach(() => {
  vi.unstubAllEnvs();
});

describe('register()', () => {
  it('boots cleanly with a valid environment on the nodejs runtime', async () => {
    await expect(registerWith(validEnv)).resolves.toBeUndefined();
  });

  it('fails startup when a required variable is missing on the nodejs runtime', async () => {
    await expect(registerWith({ YELLOWCARD_API_KEY: 'sandbox-test-key' })).rejects.toThrow(
      /POSTGRES_URL/
    );
  });

  it('fails startup on a malformed same-scheme POSTGRES_URL on the nodejs runtime', async () => {
    await expect(
      registerWith({ POSTGRES_URL: 'postgres://', YELLOWCARD_API_KEY: 'sandbox-test-key' })
    ).rejects.toThrow(/POSTGRES_URL/);
  });

  it('does not import or validate the environment on other runtimes', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    const { register } = await import('./instrumentation');

    // No env vars are set at all; if register() touched ./lib/env on this
    // runtime it would throw, so resolving proves the guard works.
    await expect(register()).resolves.toBeUndefined();
  });
});
