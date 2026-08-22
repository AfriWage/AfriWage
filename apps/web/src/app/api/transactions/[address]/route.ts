import { NextResponse } from 'next/server';
import { NotFoundError } from '@stellar/stellar-sdk';
import { getTransactionHistory } from '@AfriWage/sdk';

export async function GET(
  _request: Request,
  { params }: { params: { address: string } }
) {
  const { address } = params;

  if (!address || address.length !== 56 || !address.startsWith('G')) {
    return NextResponse.json(
      { message: 'Invalid Stellar public key' },
      { status: 400 }
    );
  }

  try {
    const transactions = await getTransactionHistory(address);

    return NextResponse.json({
      address,
      transactions,
    });
  } catch (error) {
    // `getTransactionHistory` already performs an account-scoped Horizon
    // request, so a confirmed 404 is mapped to the not-found response instead
    // of a preflight `accountExists` request that would hit Horizon twice.
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { message: 'Account not found on testnet', address, transactions: [] },
        { status: 404 }
      );
    }

    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { message: 'Failed to fetch transactions from Stellar network' },
      { status: 502 }
    );
  }
}
