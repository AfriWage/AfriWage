import { boolean, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

export const orgSettings = pgTable('org_settings', {
  walletPublicKey: text('wallet_public_key').primaryKey(),
  orgName: text('org_name'),
  contactEmail: text('contact_email'),
  displayCurrency: text('display_currency').default('USD'),
  defaultOfframp: text('default_offramp'),
  twoFaEnabled: boolean('two_fa_enabled').default(false),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * A tenant. Every employee, payroll run, and treasury action is scoped to one
 * organization; `orgSettings` above stays keyed by a single wallet and remains
 * the per-wallet preference store.
 *
 * `treasuryContractId` is the Charter treasury instance deployed for this org
 * through the Charter factory. It is null until the owner provisions one.
 */
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  treasuryContractId: text('treasury_contract_id'),
  /** Charter factory org id (`deploy_treasury` return value) for this org's treasury. */
  charterOrgId: text('charter_org_id'),
  defaultOfframpCurrency: text('default_offramp_currency'),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Wallet membership of an organization.
 *
 * - `owner` — full control, may add/remove members and provision the treasury
 * - `admin` — manage employees, create and submit payroll runs
 * - `payer` — approve/execute payroll runs; maps 1:1 to an approver address on
 *   the org's Charter treasury instance
 */
export const orgMembers = pgTable(
  'org_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    walletPublicKey: text('wallet_public_key').notNull(),
    role: text('role').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    uniqOrgWallet: unique().on(t.orgId, t.walletPublicKey),
  })
);

/**
 * A payable worker belonging to an organization.
 *
 * `wageAmount` is stored as text and parsed with `decimal.js` at every use
 * site — a float would silently lose stroops on a 7-decimal USDC amount.
 */
export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  stellarPublicKey: text('stellar_public_key').notNull(),
  wageAmount: text('wage_amount').notNull(),
  wageCurrency: text('wage_currency').notNull().default('USDC'),
  /** 'NGN' | 'GHS' | null — null means the payout stays on-chain as USDC. */
  payoutOfframpCurrency: text('payout_offramp_currency'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});
