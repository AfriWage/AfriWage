import {
  getNetworkDetails,
  signTransaction as freighterSignTransaction,
} from '@stellar/freighter-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NETWORK_PASSPHRASE } from './stellar';
import {
  detectNetworkMismatch,
  detectWalletNetworkMismatch,
  signTransaction,
  type WalletNetworkDetails,
} from './freighter';

vi.mock('@stellar/freighter-api', () => ({
  getAddress: vi.fn(),
  isConnected: vi.fn(),
  requestAccess: vi.fn(),
  signTransaction: vi.fn(),
  getNetworkDetails: vi.fn(),
}));

const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
const MAINNET_PASSPHRASE = 'Public Global Stellar Network ; September 2015';

const mockedGetNetworkDetails = vi.mocked(getNetworkDetails);
const mockedFreighterSignTransaction = vi.mocked(freighterSignTransaction);

describe('detectNetworkMismatch', () => {
  it('returns null when the wallet network matches the expected passphrase', () => {
    const wallet: WalletNetworkDetails = {
      network: 'TESTNET',
      networkPassphrase: TESTNET_PASSPHRASE,
    };

    expect(detectNetworkMismatch(wallet, TESTNET_PASSPHRASE)).toBeNull();
  });

  it('names the expected and actual networks when they differ', () => {
    const wallet: WalletNetworkDetails = {
      network: 'PUBLIC',
      networkPassphrase: MAINNET_PASSPHRASE,
    };

    expect(detectNetworkMismatch(wallet, TESTNET_PASSPHRASE)).toEqual({
      expectedNetwork: 'Testnet',
      actualNetwork: 'Mainnet',
    });
  });

  it('falls back to the raw network code for an unknown wallet network', () => {
    const wallet: WalletNetworkDetails = {
      network: 'CUSTOM_NET',
      networkPassphrase: 'Custom passphrase',
    };

    expect(detectNetworkMismatch(wallet, TESTNET_PASSPHRASE)).toEqual({
      expectedNetwork: 'Testnet',
      actualNetwork: 'CUSTOM_NET',
    });
  });

  it('falls back to a generic label for an unknown expected passphrase', () => {
    const wallet: WalletNetworkDetails = {
      network: 'TESTNET',
      networkPassphrase: TESTNET_PASSPHRASE,
    };

    expect(detectNetworkMismatch(wallet, 'Some custom passphrase')).toEqual({
      expectedNetwork: 'Unknown network',
      actualNetwork: 'Testnet',
    });
  });
});

describe('detectWalletNetworkMismatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads the wallet network and returns null when networks match', async () => {
    mockedGetNetworkDetails.mockResolvedValue({
      network: 'TESTNET',
      networkUrl: 'https://horizon-testnet.stellar.org',
      networkPassphrase: TESTNET_PASSPHRASE,
    });

    await expect(detectWalletNetworkMismatch(TESTNET_PASSPHRASE)).resolves.toBeNull();
    expect(mockedGetNetworkDetails).toHaveBeenCalledTimes(1);
  });

  it('returns the expected vs actual networks when they differ', async () => {
    mockedGetNetworkDetails.mockResolvedValue({
      network: 'PUBLIC',
      networkUrl: 'https://horizon.stellar.org',
      networkPassphrase: MAINNET_PASSPHRASE,
    });

    await expect(detectWalletNetworkMismatch(TESTNET_PASSPHRASE)).resolves.toEqual({
      expectedNetwork: 'Testnet',
      actualNetwork: 'Mainnet',
    });
  });

  it('fails open (returns null) when reading the network throws', async () => {
    mockedGetNetworkDetails.mockRejectedValue(new Error('Extension unavailable'));

    await expect(detectWalletNetworkMismatch(TESTNET_PASSPHRASE)).resolves.toBeNull();
  });

  it('fails open (returns null) when Freighter reports an error', async () => {
    mockedGetNetworkDetails.mockResolvedValue({
      network: 'TESTNET',
      networkUrl: 'https://horizon-testnet.stellar.org',
      networkPassphrase: TESTNET_PASSPHRASE,
      error: { code: 1, message: 'boom' },
    });

    await expect(detectWalletNetworkMismatch(TESTNET_PASSPHRASE)).resolves.toBeNull();
  });
});

describe('signTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signs with the app network passphrase', async () => {
    mockedFreighterSignTransaction.mockResolvedValue({
      signedTxXdr: 'signed-xdr',
      signerAddress: 'G...',
    });

    await expect(signTransaction('tx-xdr')).resolves.toBe('signed-xdr');
    expect(mockedFreighterSignTransaction).toHaveBeenCalledWith('tx-xdr', {
      networkPassphrase: NETWORK_PASSPHRASE,
    });
  });
});
