import { SendPaymentParamsSchema } from '@AfriWage/sdk';
import { StrKey } from '@stellar/stellar-sdk';
import { Decimal } from 'decimal.js';
import { z } from 'zod';
import { badRequest } from './api-errors';
import { ORG_ROLES } from './org-roles';

/**
 * Request validation for the organization, employee and payroll routes.
 *
 * Follows `build-payment.ts`: zod describes the shape, an explicit `parse*`
 * function is the only way in, and a failure raises a typed error carrying the
 * field name rather than leaking a zod issue tree to the client.
 */

/** Fiat off-ramp currencies the existing Yellow Card / SEP-24 flow supports. */
export const OFFRAMP_CURRENCIES = ['NGN', 'GHS'] as const;

export type OfframpCurrency = (typeof OFFRAMP_CURRENCIES)[number];

/** Only USDC is payable today — `build-payment.ts` builds USDC operations only. */
export const WAGE_CURRENCIES = ['USDC'] as const;

const OfframpCurrencySchema = z.enum(OFFRAMP_CURRENCIES);

const StellarPublicKeySchema = z
  .string()
  .trim()
  .refine((value) => StrKey.isValidEd25519PublicKey(value), 'must be a valid Stellar public key');

/**
 * Amount format, reused from the SDK so the accepted precision matches what
 * `build-payment.ts` will later put on the wire. The `Decimal` check on top
 * rejects zero, which the regex alone accepts.
 */
const AmountFormatSchema = SendPaymentParamsSchema.shape.amount;

const PositiveAmountSchema = AmountFormatSchema.refine((value) => {
  // zod's `.regex()` is a non-fatal check, so this refinement still runs for a
  // value that already failed the format check. `new Decimal('abc')` throws,
  // and an escaping DecimalError would surface as a 500 where a 400 is right.
  try {
    const amount = new Decimal(value);
    return amount.isFinite() && amount.gt(0);
  } catch {
    return false;
  }
}, 'must be greater than zero');

const NameSchema = z
  .string()
  .trim()
  .min(1, 'must not be empty')
  .max(120, 'must be 120 characters or fewer');

/**
 * Runs a schema and converts a failure into a 400 naming the offending field.
 *
 * zod's default message for a nested issue omits the path, so a client seeing
 * "Invalid amount format" would not know which of a dozen fields it referred
 * to. Prefixing the path keeps the error actionable.
 */
function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);

  if (!result.success) {
    const [issue] = result.error.issues;
    const path = issue.path.join('.');
    throw badRequest(path ? `${path} ${issue.message}` : issue.message);
  }

  return result.data;
}

const CreateOrganizationSchema = z.object({
  name: NameSchema,
  defaultOfframpCurrency: OfframpCurrencySchema.nullish().transform((value) => value ?? null),
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;

export function parseCreateOrganization(body: unknown): CreateOrganizationInput {
  return parseOrThrow(CreateOrganizationSchema, body);
}

const AddMemberSchema = z.object({
  walletPublicKey: StellarPublicKeySchema,
  role: z.enum(ORG_ROLES),
});

export type AddMemberInput = z.infer<typeof AddMemberSchema>;

export function parseAddMember(body: unknown): AddMemberInput {
  return parseOrThrow(AddMemberSchema, body);
}

const CreateEmployeeSchema = z.object({
  name: NameSchema,
  stellarPublicKey: StellarPublicKeySchema,
  wageAmount: PositiveAmountSchema,
  wageCurrency: z.enum(WAGE_CURRENCIES).default('USDC'),
  payoutOfframpCurrency: OfframpCurrencySchema.nullish().transform((value) => value ?? null),
});

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;

export function parseCreateEmployee(body: unknown): CreateEmployeeInput {
  return parseOrThrow(CreateEmployeeSchema, body);
}

const UpdateEmployeeSchema = z
  .object({
    id: z.string().uuid('must be a valid employee id'),
    name: NameSchema.optional(),
    stellarPublicKey: StellarPublicKeySchema.optional(),
    wageAmount: PositiveAmountSchema.optional(),
    wageCurrency: z.enum(WAGE_CURRENCIES).optional(),
    payoutOfframpCurrency: OfframpCurrencySchema.nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 1,
    'at least one field besides id must be provided'
  );

export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;

export function parseUpdateEmployee(body: unknown): UpdateEmployeeInput {
  return parseOrThrow(UpdateEmployeeSchema, body);
}
