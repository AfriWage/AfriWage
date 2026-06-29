import type { PaymentResult } from '@AfriWage/sdk';
import { signTransaction } from './freighter';

interface BuildPaymentRequest {
  senderPublicKey: string;
  recipientPublicKey: string;
  amount: string;
  memo?: string;
}

export interface BatchPaymentItem {
  recipientPublicKey: string;
  amount: string;
}

interface BuildBatchPaymentRequest {
  senderPublicKey: string;
  payments: BatchPaymentItem[];
}

async function signAndSubmitPayment(body: BuildPaymentRequest | BuildBatchPaymentRequest) {
  const buildResponse = await fetch('/api/build-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

export async function sendPaymentViaFreighter(
  senderPublicKey: string,
  recipientPublicKey: string,
  amount: string,
  memo?: string
): Promise<PaymentResult> {
  return signAndSubmitPayment({
    senderPublicKey,
    recipientPublicKey,
    amount,
    memo,
  } satisfies BuildPaymentRequest);
}

export async function sendBatchPaymentsViaFreighter(
  senderPublicKey: string,
  payments: BatchPaymentItem[]
): Promise<PaymentResult> {
  return signAndSubmitPayment({
    senderPublicKey,
    payments,
  } satisfies BuildBatchPaymentRequest);
}
