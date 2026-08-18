import { NextResponse } from 'next/server';
import { NotFoundError } from '@stellar/stellar-sdk';
import { getBalance } from '@AfriWage/sdk';

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
    const balances = await getBalance(address);

    return NextResponse.json({
      address,
      exists: true,
      balances,
    });
  } catch (error) {
    // `getBalance` already proves whether the account exists, so a confirmed
    // Horizon 404 is mapped to the not-found response instead of a preflight
    // `accountExists` request that would load the same account a second time.
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { message: 'Account not found on testnet', address, exists: false },
        { status: 404 }
      );
    }

    console.error('Error fetching account:', error);
    return NextResponse.json(
      { message: 'Failed to fetch account from Stellar network' },
      { status: 502 }
    );
  }
}
