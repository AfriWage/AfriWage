import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetAnchorInfo, mockGetTransactionStatus, mockInitiateWithdrawal } = vi.hoisted(() => ({
  mockGetAnchorInfo: vi.fn(),
  mockGetTransactionStatus: vi.fn(),
  mockInitiateWithdrawal: vi.fn(),
}));

vi.mock('@AfriWage/sdk', () => ({
  getAnchorInfo: mockGetAnchorInfo,
  getTransactionStatus: mockGetTransactionStatus,
  initiateYellowCardWithdrawal: mockInitiateWithdrawal,
}));

import { GET, POST } from './route';

vi.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/anchor/yellowcard', () => {
  it('returns anchor info for action=info', async () => {
    mockGetAnchorInfo.mockResolvedValue({ transferServer: 'https://api.yellowcard.io' });

    const response = await GET(new Request('http://localhost/api/anchor/yellowcard?action=info'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ transferServer: 'https://api.yellowcard.io' });
  });

  it('returns transaction status for action=status', async () => {
    mockGetTransactionStatus.mockResolvedValue({ id: 'tx-1', status: 'completed' });

    const response = await GET(
      new Request('http://localhost/api/anchor/yellowcard?action=status&id=tx-1')
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 'tx-1', status: 'completed' });
    expect(mockGetTransactionStatus).toHaveBeenCalledWith('tx-1');
  });

  it('requires an id for action=status', async () => {
    const response = await GET(new Request('http://localhost/api/anchor/yellowcard?action=status'));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'Transaction id is required' });
  });

  it('rejects unsupported actions', async () => {
    const response = await GET(
      new Request('http://localhost/api/anchor/yellowcard?action=unknown')
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'Unsupported action' });
  });

  it('returns 502 when fetching anchor info fails', async () => {
    mockGetAnchorInfo.mockRejectedValue(new Error('network error'));

    const response = await GET(new Request('http://localhost/api/anchor/yellowcard?action=info'));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      message: 'Failed to fetch Yellow Card anchor information',
    });
  });
});

describe('POST /api/anchor/yellowcard', () => {
  function jsonRequest(body: unknown, search = '') {
    return new Request(`http://localhost/api/anchor/yellowcard?${search}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  const validBody = {
    amount: '100',
    account: 'GACCOUNT',
    bankAccount: '1234567890',
    bankName: 'Test Bank',
  };

  it('initiates a withdrawal', async () => {
    mockInitiateWithdrawal.mockResolvedValue({ id: 'w-1', status: 'pending' });

    const response = await POST(jsonRequest(validBody, 'action=withdraw'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 'w-1', status: 'pending' });
    expect(mockInitiateWithdrawal).toHaveBeenCalledWith({
      amount: '100',
      account: 'GACCOUNT',
      bankAccount: '1234567890',
      bankName: 'Test Bank',
      assetCode: 'USDC',
      memo: undefined,
    });
  });

  it('rejects unsupported actions', async () => {
    const response = await POST(jsonRequest(validBody, 'action=deposit'));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'Unsupported action' });
    expect(mockInitiateWithdrawal).not.toHaveBeenCalled();
  });

  it('rejects a body with missing fields', async () => {
    const response = await POST(jsonRequest({ amount: '100' }, 'action=withdraw'));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: 'amount, account, bankAccount, and bankName are required',
    });
    expect(mockInitiateWithdrawal).not.toHaveBeenCalled();
  });

  it('returns 502 when the withdrawal fails', async () => {
    mockInitiateWithdrawal.mockRejectedValue(new Error('upstream error'));

    const response = await POST(jsonRequest(validBody, 'action=withdraw'));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      message: 'Failed to create Yellow Card withdrawal',
    });
  });
});
