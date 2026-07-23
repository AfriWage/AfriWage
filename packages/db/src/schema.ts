import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const orgSettings = pgTable('org_settings', {
  walletPublicKey: text('wallet_public_key').primaryKey(),
  orgName: text('org_name'),
  contactEmail: text('contact_email'),
  displayCurrency: text('display_currency').default('USD'),
  defaultOfframp: text('default_offramp'),
  twoFaEnabled: boolean('two_fa_enabled').default(false),
  updatedAt: timestamp('updated_at').defaultNow(),
});
