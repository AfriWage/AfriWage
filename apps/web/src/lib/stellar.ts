import { Networks } from '@stellar/stellar-sdk';

export type {
  AnchorConfig,
  Balance,
  FiatCurrency,
  PaymentResult,
  StreamActionResult,
  StreamSnapshot,
  StreamStatus,
  Sep24Info,
  StellarKeypair,
  TransactionRecord,
} from '@AfriWage/sdk';
// Re-export SDK helpers for use in web app
export {
  accountExists,
  cancelStream,
  createKeypair,
  createStream,
  discoverOffRampAnchor,
  claimableAmount,
  fromAtomicAmount,
  establishUsdcTrustline,
  fundTestnetAccount,
  getBalance,
  getTransactionHistory,
  initiateWithdrawal,
  STREAM_DECIMALS,
  sendPayment,
  toAtomicAmount,
  withdraw,
  USDC_ASSET_CODE,
  USDC_ISSUER_TESTNET,
} from '@AfriWage/sdk';

// Network configuration
export const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL ?? 'https://horizon-testnet.stellar.org';

export const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? Networks.TESTNET;

export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? 'testnet';
