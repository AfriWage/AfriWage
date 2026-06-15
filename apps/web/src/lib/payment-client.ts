import type { PaymentResult } from '@AfriWage/sdk';
import { signTransaction } from './freighter';

interface BuildPaymentRequest {
  senderPublicKey: string;
  recipientPublicKey: string;
  amount: string;
  memo?: string;
}

export async function sendPaymentViaFreighter(
  senderPublicKey: string,
  recipientPublicKey: string,
  amount: string,
  memo?: string
): Promise<PaymentResult> {
  const buildResponse = await fetch('/api/build-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderPublicKey,
      recipientPublicKey,
      amount,
      memo,
    } satisfies BuildPaymentRequest),
  });

  if (!buildResponse.ok) {
    const errorBody = (await buildResponse.json()) as { message?: string };
    throw new Error(errorBody.message ?? 'Failed to build transaction');
  }

  const { xdr } = (await buildResponse.json()) as { xdr: string };
  const signedXdr = await signTransaction(xdr);

  const submitResponse = await fetch('/api/submit-tx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signedXdr }),
  });

  if (!submitResponse.ok) {
    const errorBody = (await submitResponse.json()) as { message?: string };
    throw new Error(errorBody.message ?? 'Failed to submit transaction');
  }

  return (await submitResponse.json()) as PaymentResult;
}
