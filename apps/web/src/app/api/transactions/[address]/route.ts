import { NextResponse } from 'next/server';
import { StrKey } from '@stellar/stellar-sdk';

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: string;
  asset: string;
  counterparty: string;
  memo?: string;
  hash: string;
  createdAt: string;
  explorerUrl: string;
}

interface HorizonPayment {
  id: string;
  source_account: string;
  amount: string;
  asset_type: string;
  asset_code?: string;
  to: string;
  from: string;
  memo?: string;
  transaction_hash: string;
  created_at: string;
  paging_token: string;
}

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  const { address } = params;
  const { searchParams } = new URL(request.url);

  // Validate address
  if (!StrKey.isValidEd25519PublicKey(address)) {
    return NextResponse.json({ error: 'Invalid Stellar address' }, { status: 400 });
  }

  // Parse query params
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);
  const cursor = searchParams.get('cursor') ?? '';
  const filter = searchParams.get('filter') ?? 'all';

  try {
    const horizonUrl = new URL(`https://horizon-testnet.stellar.org/accounts/${address}/payments`);
    horizonUrl.searchParams.append('limit', limit.toString());
    horizonUrl.searchParams.append('order', 'desc');
    if (cursor) horizonUrl.searchParams.append('cursor', cursor);

    const response = await fetch(horizonUrl.toString());
    
    if (response.status === 404) {
      return NextResponse.json({ transactions: [], nextCursor: null, total: 0 });
    }

    if (!response.ok) {
      throw new Error(`Horizon API error: ${response.status}`);
    }

    const data = await response.json();
    const records: HorizonPayment[] = data._embedded.records;

    const transformedTransactions: Transaction[] = records.map((record) => {
      const isSent = record.source_account === address;
      
      return {
        id: record.id,
        type: isSent ? 'sent' : 'received',
        amount: record.amount,
        asset: record.asset_type === 'native' ? 'XLM' : record.asset_code ?? 'other',
        counterparty: isSent ? record.to : record.from,
        memo: record.memo,
        hash: record.transaction_hash,
        createdAt: record.created_at,
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${record.transaction_hash}`,
      };
    });

    // Apply filtering
    let filtered = transformedTransactions;
    if (filter === 'sent') filtered = transformedTransactions.filter(t => t.type === 'sent');
    if (filter === 'received') filtered = transformedTransactions.filter(t => t.type === 'received');

    const nextCursor = records.length > 0 ? records[records.length - 1].paging_token : null;

    return NextResponse.json(
      { 
        transactions: filtered, 
        nextCursor, 
        total: filtered.length 
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=5',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
