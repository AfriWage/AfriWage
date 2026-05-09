import { NextResponse } from 'next/server';
import { StrKey } from '@stellar/stellar-sdk';

interface AccountResponse {
  address: string;
  xlmBalance: string;
  usdcBalance: string;
  isActive: boolean;
  updatedAt: string;
}

export async function GET(
  _request: Request,
  { params }: { params: { address: string } }
) {
  const { address } = params;

  // Validate address
  if (!StrKey.isValidEd25519PublicKey(address)) {
    return NextResponse.json(
      { error: 'Invalid Stellar address' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);

    if (response.status === 404) {
      return NextResponse.json(
        { isActive: false, xlmBalance: '0', usdcBalance: '0' },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15',
          },
        }
      );
    }

    if (!response.ok) {
      throw new Error(`Horizon API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Find balances
    const nativeBalance = data.balances.find((b: { asset_type: string }) => b.asset_type === 'native');
    const usdcBalanceObj = data.balances.find(
      (b: { asset_code?: string }) => b.asset_code === 'USDC'
    );

    const result: AccountResponse = {
      address,
      xlmBalance: nativeBalance ? nativeBalance.balance : '0',
      usdcBalance: usdcBalanceObj ? usdcBalanceObj.balance : '0',
      isActive: true,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15',
      },
    });
  } catch (error) {
    console.error('Error fetching account data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
