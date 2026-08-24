import { Horizon } from '@stellar/stellar-sdk';
import { NextResponse } from 'next/server';

const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const TRANSACTION_HASH_PATTERN = /^[0-9a-f]{64}$/i;

function getHorizonStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;

  const errorLike = error as {
    status?: unknown;
    response?: { status?: unknown };
  };

  if (typeof errorLike.status === 'number') return errorLike.status;
  return typeof errorLike.response?.status === 'number' ? errorLike.response.status : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get('hash');

  if (!hash) {
    return NextResponse.json({ message: 'Transaction hash is required' }, { status: 400 });
  }

  if (!TRANSACTION_HASH_PATTERN.test(hash)) {
    return NextResponse.json({ message: 'Invalid transaction hash' }, { status: 400 });
  }

  try {
    const tx = await server.transactions().transaction(hash).call();

    // Fetch operations to extract payment details
    const opsPage = await server.operations().forTransaction(hash).call();
    const ops = opsPage.records;

    const operations = ops
      .filter((op) => op.type === 'payment')
      .map((op) => {
        const payOp = op as Horizon.HorizonApi.PaymentOperationResponse;
        return {
          sender: payOp.from,
          recipient: payOp.to,
          amount: payOp.amount,
          asset:
            payOp.asset_type === 'native'
              ? 'XLM'
              : `${(payOp as { asset_code?: string }).asset_code ?? 'UNKNOWN'}`,
        };
      });

    // Backward-compatible single-payment fields default to the first payment operation.
    const first = operations[0];

    return NextResponse.json({
      verified: tx.successful,
      hash: tx.hash,
      sender: first?.sender ?? tx.source_account,
      recipient: first?.recipient ?? '',
      amount: first?.amount ?? '0',
      asset: first?.asset ?? 'XLM',
      operations,
      memo: tx.memo_type === 'text' ? tx.memo : undefined,
      createdAt: tx.created_at,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${tx.hash}`,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);

    if (getHorizonStatus(error) === 404) {
      return NextResponse.json(
        { message: 'Transaction not found', verified: false },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Payment verification temporarily unavailable', verified: false },
      { status: 502 }
    );
  }
}
