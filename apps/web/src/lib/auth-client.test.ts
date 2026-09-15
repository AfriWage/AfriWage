import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetPublicKey, mockSignTransaction } = vi.hoisted(() => ({
  mockGetPublicKey: vi.fn(),
  mockSignTransaction: vi.fn(),
}));

vi.mock('./freighter', () => ({
  getPublicKey: mockGetPublicKey,
  signTransaction: mockSignTransaction,
}));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

import { loginWithFreighter } from './auth-client';

const WALLET = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  mockGetPublicKey.mockResolvedValue(WALLET);
  mockSignTransaction.mockResolvedValue('signed-xdr');
});

afterEach(() => {
  fetchMock.mockReset();
  mockGetPublicKey.mockReset();
  mockSignTransaction.mockReset();
});

describe('loginWithFreighter', () => {
  it('runs challenge, sign and verify in order', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ transaction: 'challenge-xdr' }))
      .mockResolvedValueOnce(jsonResponse({ walletPublicKey: WALLET }));

    await expect(loginWithFreighter()).resolves.toBe(WALLET);

    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/challenge');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ publicKey: WALLET });
    expect(mockSignTransaction).toHaveBeenCalledWith('challenge-xdr');
    expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/verify');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ transaction: 'signed-xdr' });
  });

  it('returns the key the server authenticated, not the one the wallet offered', async () => {
    const serverKey = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ transaction: 'challenge-xdr' }))
      .mockResolvedValueOnce(jsonResponse({ walletPublicKey: serverKey }));

    await expect(loginWithFreighter()).resolves.toBe(serverKey);
  });

  it('does not sign anything when the challenge request fails', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'nope' }, 400));

    await expect(loginWithFreighter()).rejects.toThrow('nope');
    expect(mockSignTransaction).not.toHaveBeenCalled();
  });

  it('surfaces a rejected signature without calling verify', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ transaction: 'challenge-xdr' }));
    mockSignTransaction.mockRejectedValue(new Error('User declined'));

    await expect(loginWithFreighter()).rejects.toThrow('User declined');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
