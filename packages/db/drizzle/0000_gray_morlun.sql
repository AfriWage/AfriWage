CREATE TABLE IF NOT EXISTS "org_settings" (
	"wallet_public_key" text PRIMARY KEY NOT NULL,
	"org_name" text,
	"contact_email" text,
	"display_currency" text DEFAULT 'USD',
	"default_offramp" text,
	"two_fa_enabled" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now()
);
