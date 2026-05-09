import { NextResponse } from 'next/server';

interface PaymentProof {
  hash: string;
  verified: boolean;
  status: 'success' | 'failed';
  sender: string;
  recipient: string;
  amount: string;
  asset: 'USDC' | 'XLM' | string;
  memo?: string;
  fee: string;
  ledger: number;
  createdAt: string;
  explorerUrl: string;
  receiptUrl: string;
}

interface HorizonOperation {
  type: string;
  from?: string;
  to?: string;
  amount?: string;
  asset_type: string;
  asset_code?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get('hash');

  if (!hash) {
    return NextResponse.json({ error: 'Transaction hash is required' }, { status: 400 });
  }

  try {
    // Fetch transaction and operations in parallel
    const [txResponse, opsResponse] = await Promise.all([
      fetch(`https://horizon-testnet.stellar.org/transactions/${hash}`),
      fetch(`https://horizon-testnet.stellar.org/transactions/${hash}/operations`)
    ]);

    if (txResponse.status === 404) {
      return NextResponse.json({ verified: false, error: 'Transaction not found' }, { status: 404 });
    }

    const txData = await txResponse.json();
    const opsData = await opsResponse.json();
    const paymentOp = opsData._embedded.records.find(
      (op: HorizonOperation) => op.type === 'payment' || op.type === 'path_payment_strict_receive'
    );

    if (!txData.successful) {
      return NextResponse.json({ 
        verified: false, 
        status: 'failed', 
        hash 
      });
    }

    const result: PaymentProof = {
      hash,
      verified: true,
      status: 'success',
      sender: paymentOp?.from ?? txData.source_account,
      recipient: paymentOp?.to ?? '',
      amount: paymentOp?.amount ?? '0',
      asset: paymentOp ? (paymentOp.asset_type === 'native' ? 'XLM' : paymentOp.asset_code ?? 'other') : 'unknown',
      memo: txData.memo,
      fee: (txData.fee_charged / 10000000).toString(),
      ledger: txData.ledger,
      createdAt: txData.created_at,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      receiptUrl: `https://afriwage.vercel.app/receipt/${hash}`,
    };

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
