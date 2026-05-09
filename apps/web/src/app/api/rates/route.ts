import { NextResponse } from 'next/server';

interface ExchangeRates {
  NGN: number;
  GHS: number;
  KES: number;
  ZAR: number;
  TZS: number;
  UGX: number;
  XOF: number;
  XAF: number;
  updatedAt: string;
}

const FALLBACK_RATES: Omit<ExchangeRates, 'updatedAt'> = {
  NGN: 1650,
  GHS: 15.2,
  KES: 129,
  ZAR: 18.4,
  TZS: 2600,
  UGX: 3750,
  XOF: 610,
  XAF: 610,
};

export async function GET() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=ngn,ghs,kes,zar,tzs,ugx,xof,xaf',
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API responded with status ${response.status}`);
    }

    const data = await response.json();
    const rates = data['usd-coin'];

    const result: ExchangeRates = {
      NGN: rates.ngn,
      GHS: rates.ghs,
      KES: rates.kes,
      ZAR: rates.zar,
      TZS: rates.tzs,
      UGX: rates.ugx,
      XOF: rates.xof,
      XAF: rates.xaf,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Error fetching rates, using fallback:', error);
    
    return NextResponse.json(
      { ...FALLBACK_RATES, updatedAt: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    );
  }
}
