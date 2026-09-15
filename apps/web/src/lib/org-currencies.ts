/**
 * Currency vocabularies shared by request validation and the UI.
 *
 * Kept import-free for the same reason as `org-roles.ts`: client components
 * need these lists, and importing them from `org-validation.ts` would drag
 * `next/server` and the Sentry SDK into the browser bundle.
 */

/** Fiat off-ramp currencies the existing Yellow Card / SEP-24 flow supports. */
export const OFFRAMP_CURRENCIES = ['NGN', 'GHS'] as const;

export type OfframpCurrency = (typeof OFFRAMP_CURRENCIES)[number];

/** Only USDC is payable today — `build-payment.ts` builds USDC operations only. */
export const WAGE_CURRENCIES = ['USDC'] as const;

export type WageCurrency = (typeof WAGE_CURRENCIES)[number];
