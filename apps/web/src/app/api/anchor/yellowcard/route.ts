import { NextResponse } from 'next/server';
import {
  getAnchorInfo,
  getTransactionStatus,
  initiateYellowCardWithdrawal,
  SendPaymentParamsSchema,
} from '@AfriWage/sdk';
import { StrKey } from '@stellar/stellar-sdk';
import { z } from 'zod';

const YellowCardWithdrawalSchema = z.object({
  amount: SendPaymentParamsSchema.shape.amount.refine((val) => Number.parseFloat(val) > 0, {
    message: 'amount must be a positive decimal amount',
  }),
  account: z
    .string()
    .refine((val) => StrKey.isValidEd25519PublicKey(val), {
      message: 'account must be a valid Stellar public key',
    }),
  bankAccount: z.string().trim().min(1, 'bankAccount is required'),
  bankName: z.string().trim().min(1, 'bankName is required'),
  assetCode: z.string().optional(),
  memo: z.string().optional(),
});
import { getAnchorInfo, getTransactionStatus, initiateYellowCardWithdrawal } from '@AfriWage/sdk';

function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const id = searchParams.get('id');

  if (action === 'info') {
    try {
      const info = await getAnchorInfo();
      return NextResponse.json(info);
    } catch (error) {
      console.error('Error fetching Yellow Card info:', error);
      return NextResponse.json(
        { message: 'Failed to fetch Yellow Card anchor information' },
        { status: 502 }
      );
    }
  }

  if (action === 'status') {
    if (!id) {
      return badRequest('Transaction id is required');
    }

    try {
      const status = await getTransactionStatus(id);
      return NextResponse.json(status);
    } catch (error) {
      console.error('Error fetching Yellow Card transaction status:', error);
      return NextResponse.json({ message: 'Failed to fetch transaction status' }, { status: 502 });
    }
  }

  return badRequest('Unsupported action');
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action !== 'withdraw') {
    return badRequest('Unsupported action');
  }

  try {
    const body = await request.json();
    const result = YellowCardWithdrawalSchema.safeParse(body);

    if (!result.success) {
      const issue = result.error.issues[0];
      return badRequest(issue?.message || 'Invalid withdrawal parameters');
    }

    const { amount, account, bankAccount, bankName, assetCode, memo } = result.data;

    const response = await initiateYellowCardWithdrawal({
      amount,
      account,
      bankAccount,
      bankName,
      assetCode: typeof assetCode === 'string' && assetCode.length > 0 ? assetCode : 'USDC',
      memo: typeof memo === 'string' && memo.length > 0 ? memo : undefined,
    // The amount is denominated in the withdrawal asset. Only USDC is supported
    // by the Yellow Card off-ramp; reject any other asset code so a local-currency
    // value is never silently interpreted as a USDC amount.
    const assetCode = typeof body.assetCode === 'string' ? body.assetCode : 'USDC';
    if (assetCode !== 'USDC') {
      return badRequest('Only USDC withdrawals are supported');
    }

    const response = await initiateYellowCardWithdrawal({
      amount: body.amount,
      account: body.account,
      bankAccount: body.bankAccount,
      bankName: body.bankName,
      assetCode,
      memo: typeof body.memo === 'string' ? body.memo : undefined,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating Yellow Card withdrawal:', error);
    return NextResponse.json(
      { message: 'Failed to create Yellow Card withdrawal' },
      { status: 502 }
    );
  }
}
