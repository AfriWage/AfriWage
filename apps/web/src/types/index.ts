// Global type definitions for AfriWage web app

export interface PaymentDraft {
  recipientPublicKey: string;
  amount: string;
  memo?: string;
}

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WalletState {
  status: WalletStatus;
  publicKey: string | null;
  error: string | null;
}

export interface AppError {
  code: string;
  message: string;
  details?: string;
}

// Supported African countries for off-ramp
export const SUPPORTED_COUNTRIES = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', flag: '🇿🇦' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', flag: '🇺🇬' },
  { code: 'SN', name: 'Senegal', currency: 'XOF', flag: '🇸🇳' },
  { code: 'CM', name: 'Cameroon', currency: 'XAF', flag: '🇨🇲' },
] as const;

export type CountryCode = (typeof SUPPORTED_COUNTRIES)[number]['code'];
