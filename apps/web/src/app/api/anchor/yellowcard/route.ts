import { NextResponse } from 'next/server';
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

    if (
      typeof body.amount !== 'string' ||
      typeof body.account !== 'string' ||
      typeof body.bankAccount !== 'string' ||
      typeof body.bankName !== 'string'
    ) {
      return badRequest('amount, account, bankAccount, and bankName are required');
    }

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
