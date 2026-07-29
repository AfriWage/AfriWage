import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ANCHOR_DOMAINS,
  discoverAnchor,
  fetchStellarToml,
  getAnchorDomain,
  getSep24Info,
  parseTomlFields,
} from './anchor';

// ---------------------------------------------------------------------------
// parseTomlFields
// ---------------------------------------------------------------------------

describe('parseTomlFields', () => {
  it('parses plain key = value pairs', () => {
    const toml = `
TRANSFER_SERVER_SEP0024 = https://anchor.example.com/sep24
WEB_AUTH_ENDPOINT = https://anchor.example.com/auth
`;
    expect(parseTomlFields(toml)).toEqual({
      TRANSFER_SERVER_SEP0024: 'https://anchor.example.com/sep24',
      WEB_AUTH_ENDPOINT: 'https://anchor.example.com/auth',
    });
  });

  it('strips double-quoted values', () => {
    const toml = `ORG_NAME = "Yellow Card Financial"\nORG_URL = "https://yellowcard.io"`;
    const result = parseTomlFields(toml);
    expect(result.ORG_NAME).toBe('Yellow Card Financial');
    expect(result.ORG_URL).toBe('https://yellowcard.io');
  });

  it('strips single-quoted values', () => {
    const toml = `ORG_NAME = 'AfriWage'\nNETWORK_PASSPHRASE = 'Test SDF Network ; September 2015'`;
    const result = parseTomlFields(toml);
    expect(result.ORG_NAME).toBe('AfriWage');
    expect(result.NETWORK_PASSPHRASE).toBe('Test SDF Network ; September 2015');
  });

  it('ignores lines beginning with #', () => {
    const toml = `# This is a comment\nKEY = value\n# another comment`;
    expect(parseTomlFields(toml)).toEqual({ KEY: 'value' });
  });

  it('ignores [section] headers', () => {
    const toml = `[DOCUMENTATION]\nORG_NAME = "Acme"\n[PRINCIPALS]\nname = "Alice"`;
    // section headers themselves are skipped; key = value lines still parsed
    const result = parseTomlFields(toml);
    expect(result).not.toHaveProperty('[DOCUMENTATION]');
    expect(result.ORG_NAME).toBe('Acme');
    expect(result.name).toBe('Alice');
  });

  it('handles values that contain an = sign', () => {
    const toml = `SIGNING_KEY = GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5\nURL = https://example.com?foo=bar`;
    const result = parseTomlFields(toml);
    // Only the first = is the delimiter; the rest belongs to the value
    expect(result.SIGNING_KEY).toBe('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
    expect(result.URL).toBe('https://example.com?foo=bar');
  });

  it('skips blank lines', () => {
    const toml = `\n\nKEY = value\n\n`;
    expect(parseTomlFields(toml)).toEqual({ KEY: 'value' });
  });

  it('returns an empty object for an empty string', () => {
    expect(parseTomlFields('')).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// getAnchorDomain
// ---------------------------------------------------------------------------

describe('getAnchorDomain', () => {
  it.each([
    ['NGN', 'testnet', ANCHOR_DOMAINS.NGN.testnet],
    ['NGN', 'mainnet', ANCHOR_DOMAINS.NGN.mainnet],
    ['GHS', 'testnet', ANCHOR_DOMAINS.GHS.testnet],
    ['GHS', 'mainnet', ANCHOR_DOMAINS.GHS.mainnet],
  ] as const)('returns %s/%s domain', (currency, network, expected) => {
    expect(getAnchorDomain(currency, network)).toBe(expected);
  });

  it('returns the same testnet domain for NGN and GHS on testnet', () => {
    expect(getAnchorDomain('NGN', 'testnet')).toBe(getAnchorDomain('GHS', 'testnet'));
  });

  it('returns the same mainnet domain for NGN and GHS on mainnet', () => {
    expect(getAnchorDomain('NGN', 'mainnet')).toBe(getAnchorDomain('GHS', 'mainnet'));
  });
});

// ---------------------------------------------------------------------------
// fetchStellarToml
// ---------------------------------------------------------------------------

describe('fetchStellarToml', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches from the correct well-known URL and returns parsed fields', async () => {
    const tomlBody = `TRANSFER_SERVER_SEP0024 = https://anchor.example.com/sep24\nWEB_AUTH_ENDPOINT = https://anchor.example.com/auth`;

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(tomlBody),
    } as Response);

    const result = await fetchStellarToml('anchor.example.com');

    expect(fetch).toHaveBeenCalledWith(
      'https://anchor.example.com/.well-known/stellar.toml'
    );
    expect(result).toEqual({
      TRANSFER_SERVER_SEP0024: 'https://anchor.example.com/sep24',
      WEB_AUTH_ENDPOINT: 'https://anchor.example.com/auth',
    });
  });

  it('throws an error when the HTTP response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    await expect(fetchStellarToml('missing.example.com')).rejects.toThrow(
      'Failed to fetch stellar.toml from missing.example.com: HTTP 404'
    );
  });
});

// ---------------------------------------------------------------------------
// discoverAnchor
// ---------------------------------------------------------------------------

describe('discoverAnchor', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockToml(fields: Record<string, string>) {
    const body = Object.entries(fields)
      .map(([k, v]) => `${k} = ${v}`)
      .join('\n');

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(body),
    } as Response);
  }

  it('returns a fully populated AnchorConfig when toml has all required fields', async () => {
    mockToml({
      TRANSFER_SERVER_SEP0024: 'https://testanchor.stellar.org/sep24',
      WEB_AUTH_ENDPOINT: 'https://testanchor.stellar.org/auth',
      NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
      ORG_NAME: 'SDF',
      ORG_URL: 'https://stellar.org',
    });

    const config = await discoverAnchor('testanchor.stellar.org', 'testnet');

    expect(config).toEqual({
      domain: 'testanchor.stellar.org',
      transferServerSep24: 'https://testanchor.stellar.org/sep24',
      webAuthEndpoint: 'https://testanchor.stellar.org/auth',
      networkPassphrase: 'Test SDF Network ; September 2015',
      orgName: 'SDF',
      orgUrl: 'https://stellar.org',
    });
  });

  it('falls back to the default network passphrase when toml omits NETWORK_PASSPHRASE', async () => {
    mockToml({
      TRANSFER_SERVER_SEP0024: 'https://testanchor.stellar.org/sep24',
      WEB_AUTH_ENDPOINT: 'https://testanchor.stellar.org/auth',
    });

    const config = await discoverAnchor('testanchor.stellar.org', 'testnet');

    expect(config.networkPassphrase).toBe('Test SDF Network ; September 2015');
  });

  it('falls back to the mainnet passphrase when network is mainnet', async () => {
    mockToml({
      TRANSFER_SERVER_SEP0024: 'https://yellowcard.io/sep24',
      WEB_AUTH_ENDPOINT: 'https://yellowcard.io/auth',
    });

    const config = await discoverAnchor('yellowcard.io', 'mainnet');

    expect(config.networkPassphrase).toBe('Public Global Stellar Network ; September 2015');
  });

  it('throws when TRANSFER_SERVER_SEP0024 is missing', async () => {
    mockToml({
      WEB_AUTH_ENDPOINT: 'https://testanchor.stellar.org/auth',
    });

    await expect(discoverAnchor('testanchor.stellar.org')).rejects.toThrow(
      'Anchor at testanchor.stellar.org does not expose TRANSFER_SERVER_SEP0024'
    );
  });

  it('throws when WEB_AUTH_ENDPOINT is missing', async () => {
    mockToml({
      TRANSFER_SERVER_SEP0024: 'https://testanchor.stellar.org/sep24',
    });

    await expect(discoverAnchor('testanchor.stellar.org')).rejects.toThrow(
      'Anchor at testanchor.stellar.org does not expose WEB_AUTH_ENDPOINT'
    );
  });

  it('propagates fetch errors from fetchStellarToml', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);

    await expect(discoverAnchor('down.example.com')).rejects.toThrow(
      'Failed to fetch stellar.toml from down.example.com: HTTP 503'
    );
  });
});

// ---------------------------------------------------------------------------
// getSep24Info
// ---------------------------------------------------------------------------

describe('getSep24Info', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches /info and returns the parsed JSON body', async () => {
    const info = {
      deposit: { USDC: { enabled: true } },
      withdraw: { USDC: { enabled: true, min_amount: 1, max_amount: 10000 } },
      fee: { enabled: false },
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(info),
    } as Response);

    const result = await getSep24Info('https://testanchor.stellar.org/sep24');

    expect(fetch).toHaveBeenCalledWith('https://testanchor.stellar.org/sep24/info');
    expect(result).toEqual(info);
  });

  it('throws with status and body when the response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Bad Request'),
    } as Response);

    await expect(getSep24Info('https://testanchor.stellar.org/sep24')).rejects.toThrow(
      'SEP-24 /info failed: HTTP 400 — Bad Request'
    );
  });
});
