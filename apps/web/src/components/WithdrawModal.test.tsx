// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WithdrawModal } from './WithdrawModal';
import {
  authenticateWithAnchor,
  discoverOffRampAnchor,
  initiateWithdrawal,
} from '@AfriWage/sdk';
import { signTransaction } from '@/lib/freighter';

vi.mock('@AfriWage/sdk', async () => {
  const actual = await vi.importActual('@AfriWage/sdk');
  return {
    ...actual,
    discoverOffRampAnchor: vi.fn(),
    authenticateWithAnchor: vi.fn(),
    initiateWithdrawal: vi.fn(),
  };
});

vi.mock('@/lib/freighter', () => ({
  signTransaction: vi.fn(),
}));

const mockDiscoverOffRampAnchor = vi.mocked(discoverOffRampAnchor);
const mockAuthenticateWithAnchor = vi.mocked(authenticateWithAnchor);
const mockInitiateWithdrawal = vi.mocked(initiateWithdrawal);
const mockSignTransaction = vi.mocked(signTransaction);

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  publicKey: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  usdcBalance: '100.00',
  network: 'testnet' as const,
};

const sampleAnchor = {
  domain: 'testanchor.stellar.org',
  transferServerSep24: 'https://testanchor.stellar.org/sep24',
  webAuthEndpoint: 'https://testanchor.stellar.org/auth',
  networkPassphrase: 'Test SDF Network ; September 2015',
  orgName: 'SDF Test Anchor',
};

const sampleSep24Info = {
  deposit: {},
  withdraw: {
    USDC: { enabled: true },
  },
  fee: { enabled: true },
};

describe('WithdrawModal Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders null when open is false', () => {
    const { container } = render(<WithdrawModal {...defaultProps} open={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('completes the full happy-path flow across all five steps', async () => {
    mockDiscoverOffRampAnchor.mockResolvedValueOnce({
      anchor: sampleAnchor,
      info: sampleSep24Info,
    });
    mockAuthenticateWithAnchor.mockResolvedValueOnce('mock-sep10-jwt-token');
    mockInitiateWithdrawal.mockResolvedValueOnce({
      url: 'https://testanchor.stellar.org/sep24/interactive?id=tx_123',
      id: 'tx_123',
      type: 'interactive_customer_info_needed',
    });
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<WithdrawModal {...defaultProps} />);

    // Step 1: Currency selection
    expect(screen.getByText('Withdraw to Bank')).toBeTruthy();
    expect(screen.getByText('Select destination currency')).toBeTruthy();
    expect(screen.getByText('NGN')).toBeTruthy();
    expect(screen.getByText('GHS')).toBeTruthy();

    fireEvent.click(screen.getByText('NGN'));

    // Step 2: Anchor discovery & Amount input
    expect(mockDiscoverOffRampAnchor).toHaveBeenCalledWith('NGN', 'testnet');
    await waitFor(() => {
      expect(screen.getByText('SDF Test Anchor')).toBeTruthy();
    });
    expect(screen.getByText('SEP-24: https://testanchor.stellar.org/sep24')).toBeTruthy();
    expect(screen.getByText('Available: 100.00 USDC')).toBeTruthy();

    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '50.0' } });

    const submitBtn = screen.getByRole('button', { name: 'Continue to NGN withdrawal' });
    expect((submitBtn as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(submitBtn);

    // Step 3: Processing & Step 4: Interactive flow
    await waitFor(() => {
      expect(mockAuthenticateWithAnchor).toHaveBeenCalledWith(
        'https://testanchor.stellar.org/auth',
        defaultProps.publicKey,
        mockSignTransaction
      );
    });

    expect(mockInitiateWithdrawal).toHaveBeenCalledWith({
      transferServer: 'https://testanchor.stellar.org/sep24',
      authToken: 'mock-sep10-jwt-token',
      assetCode: 'USDC',
      account: defaultProps.publicKey,
      amount: '50.00',
      destinationAsset: 'NGN',
    });

    await waitFor(() => {
      expect(screen.getByText('Complete withdrawal in anchor window')).toBeTruthy();
    });

    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://testanchor.stellar.org/sep24/interactive?id=tx_123',
      '_blank',
      'noopener,noreferrer'
    );

    const reOpenLink = screen.getByRole('link', { name: /Re-open anchor window/i });
    expect(reOpenLink.getAttribute('href')).toBe(
      'https://testanchor.stellar.org/sep24/interactive?id=tx_123'
    );

    // Step 5: Done action
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('transitions to error step when anchor discovery fails', async () => {
    mockDiscoverOffRampAnchor.mockRejectedValueOnce(
      new Error('Failed to discover anchor for currency NGN')
    );

    render(<WithdrawModal {...defaultProps} />);

    fireEvent.click(screen.getByText('NGN'));

    await waitFor(() => {
      expect(screen.getByText('Failed to discover anchor for currency NGN')).toBeTruthy();
    });

    // Clicking "Try again" resets to initial currency selection step
    const tryAgainBtn = screen.getByRole('button', { name: 'Try again' });
    fireEvent.click(tryAgainBtn);

    expect(screen.getByText('Select destination currency')).toBeTruthy();
  });

  it('transitions to error step when SEP-10 auth fails', async () => {
    mockDiscoverOffRampAnchor.mockResolvedValueOnce({
      anchor: sampleAnchor,
      info: sampleSep24Info,
    });
    mockAuthenticateWithAnchor.mockRejectedValueOnce(
      new Error('User declined Freighter transaction signing')
    );

    render(<WithdrawModal {...defaultProps} />);

    fireEvent.click(screen.getByText('NGN'));

    await waitFor(() => {
      expect(screen.getByText('SDF Test Anchor')).toBeTruthy();
    });

    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue to NGN withdrawal' }));

    await waitFor(() => {
      expect(screen.getByText('User declined Freighter transaction signing')).toBeTruthy();
    });
  });

  it('transitions to error step when withdrawal initiation fails', async () => {
    mockDiscoverOffRampAnchor.mockResolvedValueOnce({
      anchor: sampleAnchor,
      info: sampleSep24Info,
    });
    mockAuthenticateWithAnchor.mockResolvedValueOnce('mock-token');
    mockInitiateWithdrawal.mockRejectedValueOnce(
      new Error('Anchor returned status 500 internal error')
    );

    render(<WithdrawModal {...defaultProps} />);

    fireEvent.click(screen.getByText('GHS'));

    await waitFor(() => {
      expect(screen.getByText('SDF Test Anchor')).toBeTruthy();
    });

    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue to GHS withdrawal' }));

    await waitFor(() => {
      expect(screen.getByText('Anchor returned status 500 internal error')).toBeTruthy();
    });
  });

  it('displays warning when USDC withdrawal is not enabled on anchor', async () => {
    mockDiscoverOffRampAnchor.mockResolvedValueOnce({
      anchor: sampleAnchor,
      info: {
        deposit: {},
        withdraw: { USDC: { enabled: false } },
        fee: { enabled: true },
      },
    });

    render(<WithdrawModal {...defaultProps} />);

    fireEvent.click(screen.getByText('NGN'));

    await waitFor(() => {
      expect(
        screen.getByText('USDC withdrawal may not be enabled on this anchor for testnet.')
      ).toBeTruthy();
    });
  });

  it('disables continue button for invalid or zero amounts', async () => {
    mockDiscoverOffRampAnchor.mockResolvedValueOnce({
      anchor: sampleAnchor,
      info: sampleSep24Info,
    });

    render(<WithdrawModal {...defaultProps} />);

    fireEvent.click(screen.getByText('NGN'));

    await waitFor(() => {
      expect(screen.getByText('SDF Test Anchor')).toBeTruthy();
    });

    const submitBtn = screen.getByRole('button', { name: 'Continue to NGN withdrawal' });

    // Empty amount
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true);

    // Zero amount
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '0' } });
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true);

    // Negative amount
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '-10' } });
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true);

    // Valid positive amount
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '15' } });
    expect((submitBtn as HTMLButtonElement).disabled).toBe(false);
  });

  it('resets internal step state when open changes from true to false and back to true', async () => {
    mockDiscoverOffRampAnchor.mockResolvedValueOnce({
      anchor: sampleAnchor,
      info: sampleSep24Info,
    });

    const { rerender } = render(<WithdrawModal {...defaultProps} open={true} />);

    fireEvent.click(screen.getByText('NGN'));

    await waitFor(() => {
      expect(screen.getByText('SDF Test Anchor')).toBeTruthy();
    });

    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '42' } });

    // Close modal
    rerender(<WithdrawModal {...defaultProps} open={false} />);
    expect(screen.queryByText('Withdraw to Bank')).toBeNull();

    // Reopen modal
    rerender(<WithdrawModal {...defaultProps} open={true} />);
    expect(screen.getByText('Select destination currency')).toBeTruthy();
    expect(screen.queryByDisplayValue('42')).toBeNull();
  });

  it('triggers onClose when backdrop or close button is clicked', () => {
    render(<WithdrawModal {...defaultProps} />);

    const backdrop = screen.getByLabelText('Close withdraw modal');
    fireEvent.click(backdrop);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
