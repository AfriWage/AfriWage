import { NextResponse } from 'next/server';
import { StrKey } from '@stellar/stellar-sdk';
import { headers } from 'next/headers';

// Rate limiter: Map IP address to [count, lastResetTime]
const rateLimiter = new Map<string, [number, number]>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 3;

interface FundRequest {
  address: string;
}

export async function POST(request: Request) {
  // Rate limiting check
  const ip = headers().get('x-forwarded-for') ?? 'anonymous';
  const now = Date.now();
  const limitEntry = rateLimiter.get(ip);

  if (limitEntry) {
    const [count, lastReset] = limitEntry;
    if (now - lastReset < RATE_LIMIT_WINDOW) {
      if (count >= MAX_REQUESTS) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }
      rateLimiter.set(ip, [count + 1, lastReset]);
    } else {
      rateLimiter.set(ip, [1, now]);
    }
  } else {
    rateLimiter.set(ip, [1, now]);
  }

  // Parse and validate body
  const body: FundRequest = await request.json();
  const { address } = body;

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  if (!StrKey.isValidEd25519PublicKey(address)) {
    return NextResponse.json({ error: 'Invalid Stellar address' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://friendbot.stellar.org?addr=${address}`, {
      method: 'GET',
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        address,
        amount: '10000',
        asset: 'XLM',
        message: 'Account funded with 10,000 XLM on Stellar testnet',
        explorerUrl: `https://stellar.expert/explorer/testnet/account/${address}`,
      });
    }

    if (response.status === 400) {
      return NextResponse.json({
        success: false,
        error: 'Account already funded. Each testnet address can only be funded once via Friendbot.',
      }, { status: 400 });
    }

    throw new Error('Friendbot failed');
  } catch (error) {
    console.error('Funding error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fund account. Please try again.',
    }, { status: 500 });
  }
}
