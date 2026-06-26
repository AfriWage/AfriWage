export interface AnchorTomlInfo {
  transferServer?: string;
  transferServerSep0024?: string;
  kycServer?: string;
  authServer?: string;
  webAuthEndpoint?: string;
  signingKey?: string;
  networkPassphrase?: string;
  directPaymentServer?: string;
}

export interface AnchorDepositParams {
  amount: string;
  account: string;
  assetCode?: string;
  memo?: string;
}

export interface AnchorWithdrawalParams {
  amount: string;
  account: string;
  bankAccount: string;
  bankName: string;
  assetCode?: string;
  memo?: string;
}

export interface AnchorTransaction {
  id?: string;
  status?: string;
  message?: string;
  [key: string]: unknown;
}

export interface AnchorTransactionStatus extends AnchorTransaction {
  id: string;
  status: string;
}

const DEFAULT_ANCHOR_URL = 'https://api.yellowcard.io';

function sanitizeUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function parseTomlValue(rawValue: string): string {
  const trimmed = rawValue.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseStellarToml(rawToml: string): AnchorTomlInfo {
  const info: AnchorTomlInfo = {};

  for (const line of rawToml.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = parseTomlValue(trimmed.slice(separatorIndex + 1));

    if (key === 'TRANSFER_SERVER') {
      info.transferServer = value;
    } else if (key === 'TRANSFER_SERVER_SEP0024') {
      info.transferServerSep0024 = value;
    } else if (key === 'KYC_SERVER') {
      info.kycServer = value;
    } else if (key === 'AUTH_SERVER') {
      info.authServer = value;
    } else if (key === 'WEB_AUTH_ENDPOINT') {
      info.webAuthEndpoint = value;
    } else if (key === 'SIGNING_KEY') {
      info.signingKey = value;
    } else if (key === 'NETWORK_PASSPHRASE') {
      info.networkPassphrase = value;
    } else if (key === 'DIRECT_PAYMENT_SERVER') {
      info.directPaymentServer = value;
    }
  }

  return info;
}

async function getApiBaseUrl(): Promise<string> {
  const configuredUrl = process.env.YELLOWCARD_API_URL?.trim();
  return sanitizeUrl(configuredUrl || DEFAULT_ANCHOR_URL);
}

async function getApiKey(): Promise<string> {
  const apiKey = process.env.YELLOWCARD_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('YELLOWCARD_API_KEY is not configured');
  }

  return apiKey;
}

async function getTransferServer(): Promise<string> {
  const anchorInfo = await getAnchorInfo();
  const transferServer = anchorInfo.transferServer ?? anchorInfo.transferServerSep0024;

  if (!transferServer) {
    throw new Error('Yellow Card transfer server endpoint is not available');
  }

  return transferServer;
}

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === 'string'
        ? payload
        : payload && typeof payload === 'object' && 'message' in payload
          ? String((payload as { message?: unknown }).message)
          : 'Yellow Card request failed';

    throw new Error(message);
  }

  return payload as T;
}

export async function getAnchorInfo(): Promise<AnchorTomlInfo> {
  const baseUrl = await getApiBaseUrl();
  const response = await fetch(`${baseUrl}/.well-known/stellar.toml`);

  if (!response.ok) {
    throw new Error('Failed to fetch Yellow Card anchor TOML');
  }

  const tomlText = await response.text();
  return parseStellarToml(tomlText);
}

export async function initiateDeposit(params: AnchorDepositParams): Promise<AnchorTransaction> {
  const transferServer = await getTransferServer();
  const apiKey = await getApiKey();
  const url = new URL('/transactions/deposit', transferServer).toString();

  return requestJson<AnchorTransaction>(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      asset_code: params.assetCode ?? 'USDC',
      amount: params.amount,
      account: params.account,
      memo: params.memo,
    }),
  });
}

export async function initiateWithdrawal(
  params: AnchorWithdrawalParams
): Promise<AnchorTransaction> {
  const transferServer = await getTransferServer();
  const apiKey = await getApiKey();
  const url = new URL('/transactions/withdraw', transferServer).toString();

  return requestJson<AnchorTransaction>(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      asset_code: params.assetCode ?? 'USDC',
      amount: params.amount,
      account: params.account,
      memo: params.memo,
      type: 'bank_account',
      dest_extra: {
        account_number: params.bankAccount,
        bank_name: params.bankName,
      },
    }),
  });
}

export async function getTransactionStatus(id: string): Promise<AnchorTransactionStatus> {
  const transferServer = await getTransferServer();
  const apiKey = await getApiKey();
  const url = new URL('/transaction', transferServer);
  url.searchParams.set('id', id);

  return requestJson<AnchorTransactionStatus>(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}
