import { z } from 'zod';
import { badRequest } from './api-errors';
import { OFFRAMP_CURRENCIES } from './org-currencies';

/**
 * Request validation for the payroll run routes.
 *
 * Same shape as `org-validation.ts`: zod describes it, an explicit parse
 * function is the only way in, and a failure names the offending field.
 */

function parseOrThrow<S extends z.ZodTypeAny>(schema: S, value: unknown): z.infer<S> {
  const result = schema.safeParse(value);

  if (!result.success) {
    const [issue] = result.error.issues;
    const path = issue.path.join('.');
    throw badRequest(path ? `${path} ${issue.message}` : issue.message);
  }

  return result.data;
}

/** Positive decimal with up to the seven places USDC carries. */
const AmountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,7})?$/, 'must be a number with up to 7 decimal places')
  .refine((value) => Number.parseFloat(value) > 0, 'must be greater than zero');

const UuidSchema = z.string().uuid('must be a valid id');

const CreatePayrollRunSchema = z
  .union([
    z.object({
      fromActiveEmployees: z.literal(true),
      items: z.undefined().optional(),
    }),
    z.object({
      fromActiveEmployees: z.literal(false).optional(),
      items: z
        .array(z.object({ employeeId: UuidSchema, amount: AmountSchema.optional() }))
        .min(1, 'must include at least one employee')
        .max(100, 'must include at most 100 employees'),
    }),
  ])
  .transform((value) => ({
    fromActiveEmployees: value.fromActiveEmployees === true,
    items: 'items' in value && value.items ? value.items : [],
  }));

export type CreatePayrollRunInput = z.infer<typeof CreatePayrollRunSchema>;

export function parseCreatePayrollRun(body: unknown): CreatePayrollRunInput {
  return parseOrThrow(CreatePayrollRunSchema, body);
}

/** A 32-byte Stellar transaction hash, hex-encoded. */
const TransactionHashSchema = z
  .string()
  .regex(/^[0-9a-f]{64}$/i, 'must be a 64-character hex transaction hash');

const SubmitRunSchema = z.union([
  z.object({
    // Phase one: build the unsigned spend request for the given budget category.
    categoryId: z.number().int().positive('must be a positive category id'),
    transactionHash: z.undefined().optional(),
  }),
  z.object({
    // Phase two: record the request the member actually submitted.
    transactionHash: TransactionHashSchema,
  }),
]);

export type SubmitRunInput = z.infer<typeof SubmitRunSchema>;

export function parseSubmitRun(body: unknown): SubmitRunInput {
  return parseOrThrow(SubmitRunSchema, body);
}

const ConfirmTransactionSchema = z.object({ transactionHash: TransactionHashSchema });

export function parseConfirmTransaction(body: unknown): { transactionHash: string } {
  return parseOrThrow(ConfirmTransactionSchema, body);
}

const InitiateOfframpSchema = z.object({
  itemId: UuidSchema,
  /**
   * SEP-10 token the worker's wallet obtained from the anchor. AfriWage never
   * stores it — it is used for this one withdrawal call and discarded.
   */
  authToken: z.string().min(1, 'must not be empty'),
  destinationCurrency: z.enum(OFFRAMP_CURRENCIES).optional(),
});

export type InitiateOfframpInput = z.infer<typeof InitiateOfframpSchema>;

export function parseInitiateOfframp(body: unknown): InitiateOfframpInput {
  return parseOrThrow(InitiateOfframpSchema, body);
}
