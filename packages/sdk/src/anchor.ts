/**
 * Stellar anchor discovery and SEP-24 off-ramp helpers for NGN/GHS fiat withdrawal.
 */

export type FiatCurrency = 'NGN' | 'GHS';
export type StellarNetwork = 'testnet' | 'mainnet';

export interface AnchorConfig {
  domain: string;
  transferServerSep24: string;
  webAuthEndpoint: string;
  networkPassphrase: string;
  orgName?: string;
  orgUrl?: string;
}

export interface Sep24MethodInfo {
  enabled: boolean;
  min_amount?: number;
  max_amount?: number;
  fee_fixed?: number;
  fee_percent?: number;
}

export interface Sep24AssetInfo {
  enabled: boolean;
  fee_fixed?: number;
  fee_percent?: number;
  min_amount?: number;
  max_amount?: number;
  fields?: Record<string, unknown>;
}

export interface Sep24Info {
  deposit: Record<string, Sep24AssetInfo>;
  withdraw: Record<string, Sep24AssetInfo>;
  fee: { enabled: boolean };
  feature?: Record<string, unknown>;
}

export interface Sep24InteractiveResponse {
  type: string;
  url: string;
  id: string;
}

export interface WithdrawParams {
  transferServer: string;
  authToken: string;
  assetCode: string;
  account: string;
  amount: string;
  destinationAsset: FiatCurrency;
  lang?: string;
}

/** Yellow Card supports NGN and GHS off-ramp on mainnet; testnet uses SDF reference anchor. */
export const ANCHOR_DOMAINS: Record<FiatCurrency, Record<StellarNetwork, string>> = {
  NGN: {
    testnet: 'testanchor.stellar.org',
    mainnet: 'yellowcard.io',
  },
  GHS: {
    testnet: 'testanchor.stellar.org',
    mainnet: 'yellowcard.io',
  },
};

export const NETWORK_PASSPHRASES: Record<StellarNetwork, string> = {
  testnet: 'Test SDF Network ; September 2015',
  mainnet: 'Public Global Stellar Network ; September 2015',
};

/**
 * Resolves the anchor home domain for a fiat currency on the given network.
 */
export function getAnchorDomain(currency: FiatCurrency, network: StellarNetwork): string {
  return ANCHOR_DOMAINS[currency][network];
}

/**
 * Extracts top-level string fields from a stellar.toml document.
 */
export function parseTomlFields(toml: string): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const line of toml.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('[')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    fields[key] = value;
  }

  return fields;
}

/**
 * Fetches and parses a stellar.toml file from an anchor's home domain.
 */
export async function fetchStellarToml(domain: string): Promise<Record<string, string>> {
  const response = await fetch(`https://${domain}/.well-known/stellar.toml`);

  if (!response.ok) {
    throw new Error(`Failed to fetch stellar.toml from ${domain}: HTTP ${response.status}`);
  }

  return parseTomlFields(await response.text());
}

/**
 * Discovers anchor endpoints via stellar.toml (SEP-1).
 */
export async function discoverAnchor(
  domain: string,
  network: StellarNetwork = 'testnet'
): Promise<AnchorConfig> {
  const toml = await fetchStellarToml(domain);

  const transferServerSep24 = toml.TRANSFER_SERVER_SEP0024;
  const webAuthEndpoint = toml.WEB_AUTH_ENDPOINT;

  if (!transferServerSep24) {
    throw new Error(`Anchor at ${domain} does not expose TRANSFER_SERVER_SEP0024`);
  }

  if (!webAuthEndpoint) {
    throw new Error(`Anchor at ${domain} does not expose WEB_AUTH_ENDPOINT`);
  }

  return {
    domain,
    transferServerSep24,
    webAuthEndpoint,
    networkPassphrase: toml.NETWORK_PASSPHRASE ?? NETWORK_PASSPHRASES[network],
    orgName: toml.ORG_NAME,
    orgUrl: toml.ORG_URL,
  };
}

/**
 * Queries the SEP-24 /info endpoint for supported deposit and withdrawal methods.
 */
export async function getSep24Info(transferServer: string): Promise<Sep24Info> {
  const response = await fetch(`${transferServer}/info`);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SEP-24 /info failed: HTTP ${response.status} — ${body}`);
  }

  return response.json() as Promise<Sep24Info>;
}

/**
 * Requests a SEP-10 authentication challenge for the given Stellar account.
 */
export async function requestSep10Challenge(
  webAuthEndpoint: string,
  account: string
): Promise<string> {
  const url = new URL(webAuthEndpoint);
  url.searchParams.set('account', account);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SEP-10 challenge failed: HTTP ${response.status} — ${body}`);
  }

  const json = (await response.json()) as { transaction: string };
  return json.transaction;
}

/**
 * Submits a signed SEP-10 challenge and returns the anchor JWT.
 */
export async function submitSep10Challenge(
  webAuthEndpoint: string,
  signedTransactionXdr: string
): Promise<string> {
  const response = await fetch(webAuthEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction: signedTransactionXdr }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SEP-10 authentication failed: HTTP ${response.status} — ${body}`);
  }

  const json = (await response.json()) as { token: string };
  return json.token;
}

/**
 * Completes SEP-10 web authentication using a caller-provided signing function.
 */
export async function authenticateWithAnchor(
  webAuthEndpoint: string,
  account: string,
  signTransaction: (xdr: string) => Promise<string>
): Promise<string> {
  const challengeXdr = await requestSep10Challenge(webAuthEndpoint, account);
  const signedXdr = await signTransaction(challengeXdr);
  return submitSep10Challenge(webAuthEndpoint, signedXdr);
}

/**
 * Initiates an interactive SEP-24 withdrawal (USDC → local fiat off-ramp).
 */
export async function initiateWithdrawal(
  params: WithdrawParams
): Promise<Sep24InteractiveResponse> {
  const response = await fetch(`${params.transferServer}/transactions/withdraw/interactive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.authToken}`,
    },
    body: JSON.stringify({
      asset_code: params.assetCode,
      account: params.account,
      amount: params.amount,
      destination_asset: params.destinationAsset,
      lang: params.lang ?? 'en',
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SEP-24 withdraw failed: HTTP ${response.status} — ${body}`);
  }

  return response.json() as Promise<Sep24InteractiveResponse>;
}

/**
 * Discovers an anchor and returns its SEP-24 capabilities for the requested currency.
 */
export async function discoverOffRampAnchor(
  currency: FiatCurrency,
  network: StellarNetwork = 'testnet'
): Promise<{ anchor: AnchorConfig; info: Sep24Info }> {
  const domain = getAnchorDomain(currency, network);
  const anchor = await discoverAnchor(domain, network);
  const info = await getSep24Info(anchor.transferServerSep24);

  return { anchor, info };
}
