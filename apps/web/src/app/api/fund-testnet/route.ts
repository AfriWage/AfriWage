import { NextResponse } from 'next/server';
import { fundTestnetAccount } from '@AfriWage/sdk';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address } = body;

    if (
      !address ||
      typeof address !== 'string' ||
      address.length !== 56 ||
      !address.startsWith('G')
    ) {
      return NextResponse.json({ message: 'Invalid Stellar public key' }, { status: 400 });
    }

    const result = await fundTestnetAccount(address);

    return NextResponse.json({
      funded: result.funded,
      publicKey: result.publicKey,
      message: 'Account funded with 10,000 testnet XLM',
    });
  } catch (error) {
    console.error('Error funding testnet account:', error);
    const message = error instanceof Error ? error.message : 'Failed to fund account';
    return NextResponse.json({ message, funded: false }, { status: 502 });
  }
}
