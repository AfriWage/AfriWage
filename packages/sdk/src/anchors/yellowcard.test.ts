import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAnchorInfo,
  getTransactionStatus,
  initiateDeposit,
  initiateWithdrawal,
} from './yellowcard';

const TRANSFER_SERVER = 'https://transfer.yellowcard.io';
const ACCOUNT = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

const TOML = `# Yellow Card anchor metadata
NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"
TRANSFER_SERVER = "${TRANSFER_SERVER}"
TRANSFER_SERVER_SEP0024 = "https://sep24.yellowcard.io"
KYC_SERVER = "https://kyc.yellowcard.io"
AUTH_SERVER = "https://auth.yellowcard.io"
WEB_AUTH_ENDPOINT = "https://web-auth.yellowcard.io"
SIGNING_KEY = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
DIRECT_PAYMENT_SERVER = "https://direct.yellowcard.io"
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

/** Serves the anchor TOML first, then the given responses in order. */
function mockFetchSequence(...responses: Response[]) {
  const fetchMock = vi.fn();
  fetchMock.mockResolvedValueOnce(tomlResponse());

  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function requestBody(fetchMock: ReturnType<typeof vi.fn>, callIndex: number): unknown {
  const init = fetchMock.mock.calls[callIndex]?.[1] as RequestInit | undefined;
  return JSON.parse(String(init?.body));
}

beforeEach(() => {
  vi.stubEnv('YELLOWCARD_API_KEY', 'test-api-key');
  vi.stubEnv('YELLOWCARD_API_URL', 'https://api.yellowcard.test');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('getAnchorInfo', () => {
  it('fetches the TOML from the configured API base URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(tomlResponse());
    vi.stubGlobal('fetch', fetchMock);

    await getAnchorInfo();

    expect(fetchMock).toHaveBeenCalledWith('https://api.yellowcard.test/.well-known/stellar.toml');
  });

  it('falls back to the default anchor URL when none is configured', async () => {
    vi.stubEnv('YELLOWCARD_API_URL', undefined);
    const fetchMock = vi.fn().mockResolvedValue(tomlResponse());
    vi.stubGlobal('fetch', fetchMock);

    await getAnchorInfo();

    expect(fetchMock).toHaveBeenCalledWith('https://api.yellowcard.io/.well-known/stellar.toml');
  });

  it('strips a trailing slash from the configured API base URL', async () => {
    vi.stubEnv('YELLOWCARD_API_URL', '  https://api.yellowcard.test/  ');
    const fetchMock = vi.fn().mockResolvedValue(tomlResponse());
    vi.stubGlobal('fetch', fetchMock);

    await getAnchorInfo();

    expect(fetchMock).toHaveBeenCalledWith('https://api.yellowcard.test/.well-known/stellar.toml');
  });

  it('parses every supported TOML field', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(tomlResponse()));

    await expect(getAnchorInfo()).resolves.toEqual({
      networkPassphrase: 'Test SDF Network ; September 2015',
      transferServer: TRANSFER_SERVER,
      transferServerSep0024: 'https://sep24.yellowcard.io',
      kycServer: 'https://kyc.yellowcard.io',
      authServer: 'https://auth.yellowcard.io',
      webAuthEndpoint: 'https://web-auth.yellowcard.io',
      signingKey: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      directPaymentServer: 'https://direct.yellowcard.io',
    });
  });

  it('ignores comments, blank lines, unknown keys and lines without a separator', async () => {
    const toml = [
      '# leading comment',
      '',
      '   ',
      '[DOCUMENTATION]',
      'ORG_NAME = "Yellow Card"',
      '   # indented comment',
      `TRANSFER_SERVER = "${TRANSFER_SERVER}"`,
      'not a key value line',
    ].join('\n');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(tomlResponse(toml)));

    await expect(getAnchorInfo()).resolves.toEqual({ transferServer: TRANSFER_SERVER });
  });

  it('handles single-quoted, unquoted and CRLF-delimited values', async () => {
    const toml = ["KYC_SERVER = 'https://kyc.yellowcard.io'", 'SIGNING_KEY = GTESTKEY'].join(
      '\r\n'
    );
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(tomlResponse(toml)));

    await expect(getAnchorInfo()).resolves.toEqual({
      kycServer: 'https://kyc.yellowcard.io',
      signingKey: 'GTESTKEY',
    });
  });

  it('keeps "=" characters that appear inside a value', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(tomlResponse('TRANSFER_SERVER = "https://yc.io/sep6?v=1"'))
    );

    await expect(getAnchorInfo()).resolves.toEqual({
      transferServer: 'https://yc.io/sep6?v=1',
    });
  });

  it('throws when the TOML request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));

    await expect(getAnchorInfo()).rejects.toThrow('Failed to fetch Yellow Card anchor TOML');
  });
});

describe('initiateDeposit', () => {
  it('posts the expected SEP-6 deposit body to the transfer server', async () => {
    const fetchMock = mockFetchSequence(jsonResponse({ id: 'dep-1', status: 'pending_user' }));

    await expect(
      initiateDeposit({ amount: '150.50', account: ACCOUNT, memo: 'payroll-42' })
    ).resolves.toEqual({ id: 'dep-1', status: 'pending_user' });

    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe(`${TRANSFER_SERVER}/transactions/deposit`);
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-api-key',
    });
    expect(requestBody(fetchMock, 1)).toEqual({
      asset_code: 'USDC',
      amount: '150.50',
      account: ACCOUNT,
      memo: 'payroll-42',
    });
  });

  it('defaults the asset code to USDC and omits an absent memo', async () => {
    const fetchMock = mockFetchSequence(jsonResponse({ id: 'dep-2' }));

    await initiateDeposit({ amount: '10', account: ACCOUNT });

    expect(requestBody(fetchMock, 1)).toEqual({
      asset_code: 'USDC',
      amount: '10',
      account: ACCOUNT,
    });
  });

  it('forwards an explicit asset code', async () => {
    const fetchMock = mockFetchSequence(jsonResponse({ id: 'dep-3' }));

    await initiateDeposit({ amount: '10', account: ACCOUNT, assetCode: 'NGNC' });

    expect(requestBody(fetchMock, 1)).toMatchObject({ asset_code: 'NGNC' });
  });

  it('falls back to the SEP-24 transfer server when TRANSFER_SERVER is absent', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        tomlResponse('TRANSFER_SERVER_SEP0024 = "https://sep24.yellowcard.io"')
      )
      .mockResolvedValueOnce(jsonResponse({ id: 'dep-4' }));
    vi.stubGlobal('fetch', fetchMock);

    await initiateDeposit({ amount: '10', account: ACCOUNT });

    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://sep24.yellowcard.io/transactions/deposit');
  });

  it('throws when the anchor exposes no transfer server', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(tomlResponse('KYC_SERVER = "https://kyc.io"'))
    );

    await expect(initiateDeposit({ amount: '10', account: ACCOUNT })).rejects.toThrow(
      'Yellow Card transfer server endpoint is not available'
    );
  });

  it('surfaces the anchor error message on a failed request', async () => {
    mockFetchSequence(jsonResponse({ message: 'amount below minimum' }, 400));

    await expect(initiateDeposit({ amount: '0.01', account: ACCOUNT })).rejects.toThrow(
      'amount below minimum'
    );
  });

  it('surfaces a plain-text error body', async () => {
    mockFetchSequence(new Response('upstream unavailable', { status: 503 }));

    await expect(initiateDeposit({ amount: '10', account: ACCOUNT })).rejects.toThrow(
      'upstream unavailable'
    );
  });

  it('falls back to a generic message when the error payload has none', async () => {
    mockFetchSequence(jsonResponse({ code: 'unknown' }, 500));

    await expect(initiateDeposit({ amount: '10', account: ACCOUNT })).rejects.toThrow(
      'Yellow Card request failed'
    );
  });
});

describe('initiateWithdrawal', () => {
  it('posts the expected bank-account withdrawal body', async () => {
    const fetchMock = mockFetchSequence(jsonResponse({ id: 'wd-1', status: 'pending_anchor' }));

    await expect(
      initiateWithdrawal({
        amount: '75.25',
        account: ACCOUNT,
        bankAccount: '0123456789',
        bankName: 'GTBank',
        assetCode: 'USDC',
        memo: 'invoice-7',
      })
    ).resolves.toEqual({ id: 'wd-1', status: 'pending_anchor' });

    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe(`${TRANSFER_SERVER}/transactions/withdraw`);
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-api-key',
    });
    expect(requestBody(fetchMock, 1)).toEqual({
      asset_code: 'USDC',
      amount: '75.25',
      account: ACCOUNT,
      memo: 'invoice-7',
      type: 'bank_account',
      dest_extra: {
        account_number: '0123456789',
        bank_name: 'GTBank',
      },
    });
  });

  it('defaults the asset code to USDC and omits an absent memo', async () => {
    const fetchMock = mockFetchSequence(jsonResponse({ id: 'wd-2' }));

    await initiateWithdrawal({
      amount: '20',
      account: ACCOUNT,
      bankAccount: '0123456789',
      bankName: 'GTBank',
    });

    expect(requestBody(fetchMock, 1)).toEqual({
      asset_code: 'USDC',
      amount: '20',
      account: ACCOUNT,
      type: 'bank_account',
      dest_extra: { account_number: '0123456789', bank_name: 'GTBank' },
    });
  });

  it('surfaces the anchor error message on a failed request', async () => {
    mockFetchSequence(jsonResponse({ message: 'unsupported bank' }, 422));

    await expect(
      initiateWithdrawal({
        amount: '20',
        account: ACCOUNT,
        bankAccount: '0123456789',
        bankName: 'Unknown Bank',
      })
    ).rejects.toThrow('unsupported bank');
  });
});

describe('getTransactionStatus', () => {
  it('requests the transaction by id with the API key', async () => {
    const fetchMock = mockFetchSequence(jsonResponse({ id: 'tx-1', status: 'completed' }));

    await expect(getTransactionStatus('tx-1')).resolves.toEqual({
      id: 'tx-1',
      status: 'completed',
    });

    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe(`${TRANSFER_SERVER}/transaction?id=tx-1`);
    expect(init.method).toBe('GET');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer test-api-key' });
    expect(init.body).toBeUndefined();
  });

  it('encodes ids that need escaping', async () => {
    const fetchMock = mockFetchSequence(jsonResponse({ id: 'a b&c', status: 'pending_anchor' }));

    await getTransactionStatus('a b&c');

    expect(fetchMock.mock.calls[1]?.[0]).toBe(`${TRANSFER_SERVER}/transaction?id=a+b%26c`);
  });

  it('surfaces the anchor error message when the transaction is unknown', async () => {
    mockFetchSequence(jsonResponse({ message: 'transaction not found' }, 404));

    await expect(getTransactionStatus('missing')).rejects.toThrow('transaction not found');
  });
});

describe('missing YELLOWCARD_API_KEY', () => {
  const cases: Array<[string, () => Promise<unknown>]> = [
    ['initiateDeposit', () => initiateDeposit({ amount: '10', account: ACCOUNT })],
    [
      'initiateWithdrawal',
      () =>
        initiateWithdrawal({
          amount: '10',
          account: ACCOUNT,
          bankAccount: '0123456789',
          bankName: 'GTBank',
        }),
    ],
    ['getTransactionStatus', () => getTransactionStatus('tx-1')],
  ];

  for (const [name, call] of cases) {
    it(`throws from ${name} when the key is unset`, async () => {
      vi.stubEnv('YELLOWCARD_API_KEY', undefined);
      const fetchMock = mockFetchSequence(jsonResponse({ id: 'never-reached' }));

      await expect(call()).rejects.toThrow('YELLOWCARD_API_KEY is not configured');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  }

  it('throws when the key is blank', async () => {
    vi.stubEnv('YELLOWCARD_API_KEY', '   ');
    mockFetchSequence(jsonResponse({ id: 'never-reached' }));

    await expect(initiateDeposit({ amount: '10', account: ACCOUNT })).rejects.toThrow(
      'YELLOWCARD_API_KEY is not configured'
    );
  });
});

describe('no real network access', () => {
  it('never calls fetch outside the stubbed mock', async () => {
    const fetchMock = mockFetchSequence(jsonResponse({ id: 'dep-1' }));

    await initiateDeposit({ amount: '10', account: ACCOUNT });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [url] of fetchMock.mock.calls) {
      expect(String(url)).toMatch(/^https:\/\/(api|transfer)\.yellowcard\.(test|io)\//);
    }
  });
});
