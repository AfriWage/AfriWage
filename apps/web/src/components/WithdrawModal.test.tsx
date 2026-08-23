// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WithdrawModal } from './WithdrawModal';

const { mockDiscoverOffRampAnchor, mockAuthenticateWithAnchor, mockInitiateWithdrawal } =
  vi.hoisted(() => ({
    mockDiscoverOffRampAnchor: vi.fn(),
    mockAuthenticateWithAnchor: vi.fn(),
    mockInitiateWithdrawal: vi.fn(),
  }));

vi.mock('@AfriWage/sdk', async () => {
  const actual = await vi.importActual<typeof import('@AfriWage/sdk')>('@AfriWage/sdk');
  return {
    ...actual,
    discoverOffRampAnchor: mockDiscoverOffRampAnchor,
    authenticateWithAnchor: mockAuthenticateWithAnchor,
    initiateWithdrawal: mockInitiateWithdrawal,
  };
});

vi.mock('@/lib/freighter', () => ({
  signTransaction: vi.fn().mockResolvedValue('signed-xdr'),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const anchor = {
  domain: 'testanchor.stellar.org',
  orgName: 'Test Anchor',
  transferServerSep24: 'https://testanchor.stellar.org/sep24',
  webAuthEndpoint: 'https://testanchor.stellar.org/auth',
};

const sep24Info = {
  withdraw: { USDC: { enabled: true } },
};

describe('WithdrawModal Component Tests', () => {
  it('renders null when open is false', () => {
    const { container } = render(
      <WithdrawModal open={false} onClose={() => {}} publicKey="GACCOUNT" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('completes the full happy-path flow across all five steps', async () => {
    mockDiscoverOffRampAnchor.mockResolvedValue({ anchor, info: sep24Info });
    mockAuthenticateWithAnchor.mockResolvedValue('mock-sep10-jwt-token');
    mockInitiateWithdrawal.mockResolvedValue({
      type: 'interactive_customer_info_needed',
      url: 'https://testanchor.stellar.org/interactive',
      id: 'withdrawal-1',
    });

    render(
      <WithdrawModal open onClose={() => {}} publicKey="GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" />
    );

    // Step 1: currency
    fireEvent.click(screen.getByText('Nigerian Naira'));
    await waitFor(() => expect(screen.getByLabelText('USDC amount to withdraw')).toBeInTheDocument());

    // Step 2: amount
    fireEvent.change(screen.getByLabelText('USDC amount to withdraw'), {
      target: { value: '50.00' },
    });
    fireEvent.click(screen.getByText('Continue to NGN withdrawal'));

    await waitFor(() => {
      expect(mockInitiateWithdrawal).toHaveBeenCalledWith({
        transferServer: 'https://testanchor.stellar.org/sep24',
        authToken: 'mock-sep10-jwt-token',
        assetCode: 'USDC',
        account: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        amount: '50.0',
        destinationAsset: 'NGN',
      });
    });
  });
});
