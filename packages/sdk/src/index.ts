// @AfriWage/sdk — Stellar helpers for instant USDC payroll
// Re-export everything needed by consuming apps

export { accountExists, createKeypair, fundTestnetAccount } from './account';

export {
  establishUsdcTrustline,
  getBalance,
  getTransactionHistory,
  sendPayment,
} from './payment';

export {
  ANCHOR_DOMAINS,
  NETWORK_PASSPHRASES,
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
export type {
  AnchorConfig,
  FiatCurrency,
  Sep24AssetInfo,
  Sep24Info,
  Sep24InteractiveResponse,
  Sep24MethodInfo,
  StellarNetwork,
  WithdrawParams,
} from './anchor';
export type {
  Balance,
  PaymentResult,
  SendPaymentParams,
  StellarKeypair,
  TransactionRecord,
} from './types';
export {
  FRIENDBOT_URL,
  HORIZON_TESTNET_URL,
  USDC_ASSET_CODE,
  USDC_ISSUER_TESTNET,
} from './types';
