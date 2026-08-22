import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  authenticateWithAnchor,
  discoverAnchor,
  discoverOffRampAnchor,
  fetchStellarToml,
  getAnchorDomain,
  getSep24Info,
  initiateWithdrawal,
  parseTomlFields,
  requestSep10Challenge,
  submitSep10Challenge,
} from './anchor';

const DOMAIN = 'testanchor.stellar.org';
const ACCOUNT = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

const TOML = `# Test anchor metadata
NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"
TRANSFER_SERVER_SEP0024 = "https://testanchor.stellar.org/sep24"
WEB_AUTH_ENDPOINT = "https://testanchor.stellar.org/auth"
SIGNING_KEY = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
ORG_NAME = "Test Anchor"
ORG_URL = "https://testanchor.stellar.org"
`;

function tomlResponse(body: string = TOML): Response {
  return new Response(body, { status: 200 });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('parseTomlFields', () => {
  it('parses double-quoted values', () => {
    expect(parseTomlFields('ORG_NAME = "Test Anchor"')).toEqual({ ORG_NAME: 'Test Anchor' });
  });

  it('parses single-quoted values', () => {
    expect(parseTomlFields("ORG_NAME = 'Test Anchor'")).toEqual({ ORG_NAME: 'Test Anchor' });
  });

  it('parses unquoted values', () => {
    expect(parseTomlFields('VERSION = 2.5')).toEqual({ VERSION: '2.5' });
  });

  it('ignores comment lines and blank lines', () => {
    const toml = `# a leading comment\n\nORG_NAME = "Test Anchor"\n   # an indented comment\n`;
    expect(parseTomlFields(toml)).toEqual({ ORG_NAME: 'Test Anchor' });
  });

  it('ignores table header lines', () => {
    const toml = `[DOCUMENTATION]\nORG_NAME = "Test Anchor"\n[[CURRENCIES]]\ncode = "USDC"\n`;
    expect(parseTomlFields(toml)).toEqual({ ORG_NAME: 'Test Anchor', code: 'USDC' });
  });

  it('ignores lines without an "=" separator', () => {
    expect(parseTomlFields('not a key value line')).toEqual({});
  });

  it('omits keys that are absent from the document', () => {
    const fields = parseTomlFields('ORG_NAME = "Test Anchor"');
    expect(fields.TRANSFER_SERVER_SEP0024).toBeUndefined();
  });

  it('trims surrounding whitespace around keys and unquoted values', () => {
    expect(parseTomlFields('  ORG_NAME   =   Test Anchor  ')).toEqual({
      ORG_NAME: 'Test Anchor',
    });
  });

  it('returns an empty object for an empty document', () => {
    expect(parseTomlFields('')).toEqual({});
  });
});

describe('fetchStellarToml', () => {
  it('fetches and parses the well-known stellar.toml for the domain', async () => {
    const fetchMock = vi.fn().mockResolvedValue(tomlResponse());
    vi.stubGlobal('fetch', fetchMock);

    const fields = await fetchStellarToml(DOMAIN);

    expect(fetchMock).toHaveBeenCalledWith(`https://${DOMAIN}/.well-known/stellar.toml`);
    expect(fields.TRANSFER_SERVER_SEP0024).toBe('https://testanchor.stellar.org/sep24');
  });

  it('throws when the toml request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not found', { status: 404 })));

    await expect(fetchStellarToml(DOMAIN)).rejects.toThrow(
      `Failed to fetch stellar.toml from ${DOMAIN}: HTTP 404`
    );
  });
});

describe('discoverAnchor', () => {
  it('resolves anchor config from a well-formed stellar.toml', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(tomlResponse()));

    const anchor = await discoverAnchor(DOMAIN, 'testnet');

    expect(anchor).toEqual({
      domain: DOMAIN,
      transferServerSep24: 'https://testanchor.stellar.org/sep24',
      webAuthEndpoint: 'https://testanchor.stellar.org/auth',
      networkPassphrase: 'Test SDF Network ; September 2015',
      orgName: 'Test Anchor',
      orgUrl: 'https://testanchor.stellar.org',
    });
  });

  it('falls back to the network default passphrase when the toml omits one', async () => {
    const toml = TOML.replace('NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"\n', '');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(tomlResponse(toml)));

    const anchor = await discoverAnchor(DOMAIN, 'mainnet');

    expect(anchor.networkPassphrase).toBe('Public Global Stellar Network ; September 2015');
  });

  it('throws when TRANSFER_SERVER_SEP0024 is missing', async () => {
    const toml = TOML.replace(
      'TRANSFER_SERVER_SEP0024 = "https://testanchor.stellar.org/sep24"\n',
      ''
    );
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(tomlResponse(toml)));

    await expect(discoverAnchor(DOMAIN)).rejects.toThrow(
      `Anchor at ${DOMAIN} does not expose TRANSFER_SERVER_SEP0024`
    );
  });

  it('throws when WEB_AUTH_ENDPOINT is missing', async () => {
    const toml = TOML.replace('WEB_AUTH_ENDPOINT = "https://testanchor.stellar.org/auth"\n', '');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(tomlResponse(toml)));

    await expect(discoverAnchor(DOMAIN)).rejects.toThrow(
      `Anchor at ${DOMAIN} does not expose WEB_AUTH_ENDPOINT`
    );
  });
});

describe('getSep24Info', () => {
  const TRANSFER_SERVER = 'https://testanchor.stellar.org/sep24';
  const INFO = {
    deposit: {},
    withdraw: { USDC: { enabled: true, min_amount: 1, max_amount: 10000 } },
    fee: { enabled: false },
  };

  it('fetches the SEP-24 /info endpoint and returns the parsed body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(INFO));
    vi.stubGlobal('fetch', fetchMock);

    const info = await getSep24Info(TRANSFER_SERVER);

    expect(fetchMock).toHaveBeenCalledWith(`${TRANSFER_SERVER}/info`);
    expect(info).toEqual(INFO);
  });

  it('throws with the response body when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('anchor unavailable', { status: 503 }))
    );

    await expect(getSep24Info(TRANSFER_SERVER)).rejects.toThrow(
      'SEP-24 /info failed: HTTP 503 — anchor unavailable'
    );
  });
});

describe('requestSep10Challenge', () => {
  const WEB_AUTH_ENDPOINT = 'https://testanchor.stellar.org/auth';

  it('requests a challenge transaction for the given account', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ transaction: 'challenge-xdr' }));
    vi.stubGlobal('fetch', fetchMock);

    const transaction = await requestSep10Challenge(WEB_AUTH_ENDPOINT, ACCOUNT);

    expect(fetchMock).toHaveBeenCalledWith(`${WEB_AUTH_ENDPOINT}?account=${ACCOUNT}`);
    expect(transaction).toBe('challenge-xdr');
  });

  it('throws with the response body when the challenge request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('invalid account', { status: 400 }))
    );

    await expect(requestSep10Challenge(WEB_AUTH_ENDPOINT, ACCOUNT)).rejects.toThrow(
      'SEP-10 challenge failed: HTTP 400 — invalid account'
    );
  });
});

describe('submitSep10Challenge', () => {
  const WEB_AUTH_ENDPOINT = 'https://testanchor.stellar.org/auth';

  it('posts the signed transaction and returns the anchor JWT', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ token: 'jwt-token' }));
    vi.stubGlobal('fetch', fetchMock);

    const token = await submitSep10Challenge(WEB_AUTH_ENDPOINT, 'signed-xdr');

    expect(fetchMock).toHaveBeenCalledWith(WEB_AUTH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: 'signed-xdr' }),
    });
    expect(token).toBe('jwt-token');
  });

  it('throws with the response body when submission fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('signature invalid', { status: 401 }))
    );

    await expect(submitSep10Challenge(WEB_AUTH_ENDPOINT, 'signed-xdr')).rejects.toThrow(
      'SEP-10 authentication failed: HTTP 401 — signature invalid'
    );
  });
});

describe('authenticateWithAnchor', () => {
  const WEB_AUTH_ENDPOINT = 'https://testanchor.stellar.org/auth';

  it('requests a challenge, signs it, and submits it for a JWT', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ transaction: 'challenge-xdr' }))
      .mockResolvedValueOnce(jsonResponse({ token: 'jwt-token' }));
    vi.stubGlobal('fetch', fetchMock);
    const signTransaction = vi.fn().mockResolvedValue('signed-xdr');

    const token = await authenticateWithAnchor(WEB_AUTH_ENDPOINT, ACCOUNT, signTransaction);

    expect(signTransaction).toHaveBeenCalledWith('challenge-xdr');
    expect(fetchMock).toHaveBeenNthCalledWith(1, `${WEB_AUTH_ENDPOINT}?account=${ACCOUNT}`);
    expect(fetchMock).toHaveBeenNthCalledWith(2, WEB_AUTH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: 'signed-xdr' }),
    });
    expect(token).toBe('jwt-token');
  });

  it('propagates a signing failure without submitting a challenge', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ transaction: 'challenge-xdr' }));
    vi.stubGlobal('fetch', fetchMock);
    const signTransaction = vi.fn().mockRejectedValue(new Error('user rejected signing'));

    await expect(
      authenticateWithAnchor(WEB_AUTH_ENDPOINT, ACCOUNT, signTransaction)
    ).rejects.toThrow('user rejected signing');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('propagates a challenge request failure without invoking the signer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('invalid account', { status: 400 }))
    );
    const signTransaction = vi.fn();

    await expect(
      authenticateWithAnchor(WEB_AUTH_ENDPOINT, ACCOUNT, signTransaction)
    ).rejects.toThrow('SEP-10 challenge failed: HTTP 400 — invalid account');
    expect(signTransaction).not.toHaveBeenCalled();
  });
});

describe('initiateWithdrawal', () => {
  const TRANSFER_SERVER = 'https://testanchor.stellar.org/sep24';

  it('posts the withdrawal request with auth headers and defaults the language', async () => {
    const interactive = {
      type: 'interactive_customer_info_needed',
      url: 'https://kyc',
      id: 'tx-1',
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(interactive));
    vi.stubGlobal('fetch', fetchMock);

    const result = await initiateWithdrawal({
      transferServer: TRANSFER_SERVER,
      authToken: 'jwt-token',
      assetCode: 'USDC',
      account: ACCOUNT,
      amount: '100',
      destinationAsset: 'NGN',
    });

    expect(fetchMock).toHaveBeenCalledWith(`${TRANSFER_SERVER}/transactions/withdraw/interactive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-token' },
      body: JSON.stringify({
        asset_code: 'USDC',
        account: ACCOUNT,
        amount: '100',
        destination_asset: 'NGN',
        lang: 'en',
      }),
    });
    expect(result).toEqual(interactive);
  });

  it('uses the caller-provided language when given', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ type: 'interactive', url: 'https://kyc', id: 'tx-2' }));
    vi.stubGlobal('fetch', fetchMock);

    await initiateWithdrawal({
      transferServer: TRANSFER_SERVER,
      authToken: 'jwt-token',
      assetCode: 'USDC',
      account: ACCOUNT,
      amount: '100',
      destinationAsset: 'GHS',
      lang: 'fr',
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(body.lang).toBe('fr');
  });

  it('throws with the response body when withdrawal initiation fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('kyc required', { status: 403 }))
    );

    await expect(
      initiateWithdrawal({
        transferServer: TRANSFER_SERVER,
        authToken: 'jwt-token',
        assetCode: 'USDC',
        account: ACCOUNT,
        amount: '100',
        destinationAsset: 'NGN',
      })
    ).rejects.toThrow('SEP-24 withdraw failed: HTTP 403 — kyc required');
  });
});

describe('getAnchorDomain', () => {
  it('resolves the testnet reference anchor for NGN and GHS', () => {
    expect(getAnchorDomain('NGN', 'testnet')).toBe('testanchor.stellar.org');
    expect(getAnchorDomain('GHS', 'testnet')).toBe('testanchor.stellar.org');
  });

  it('resolves the mainnet Yellow Card domain for NGN and GHS', () => {
    expect(getAnchorDomain('NGN', 'mainnet')).toBe('yellowcard.io');
    expect(getAnchorDomain('GHS', 'mainnet')).toBe('yellowcard.io');
  });
});

describe('discoverOffRampAnchor', () => {
  it('discovers the anchor for the currency then fetches its SEP-24 info', async () => {
    const info = { deposit: {}, withdraw: {}, fee: { enabled: true } };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tomlResponse())
      .mockResolvedValueOnce(jsonResponse(info));
    vi.stubGlobal('fetch', fetchMock);

    const result = await discoverOffRampAnchor('NGN', 'testnet');

    expect(fetchMock).toHaveBeenNthCalledWith(1, `https://${DOMAIN}/.well-known/stellar.toml`);
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://testanchor.stellar.org/sep24/info');
    expect(result.anchor.domain).toBe(DOMAIN);
    expect(result.info).toEqual(info);
  });

  it('propagates discovery failures without querying SEP-24 info', async () => {
    const toml = TOML.replace(
      'TRANSFER_SERVER_SEP0024 = "https://testanchor.stellar.org/sep24"\n',
      ''
    );
    const fetchMock = vi.fn().mockResolvedValue(tomlResponse(toml));
    vi.stubGlobal('fetch', fetchMock);

    await expect(discoverOffRampAnchor('GHS', 'testnet')).rejects.toThrow(
      'does not expose TRANSFER_SERVER_SEP0024'
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
