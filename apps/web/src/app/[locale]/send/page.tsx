import type { Metadata } from 'next';
import SendPageClient from './send-page-client';

export const metadata: Metadata = {
  title: 'Send Payment',
  description: 'Send USDC instantly to any Stellar address on testnet.',
};

export default function SendPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  return <SendPageClient searchParams={searchParams ?? {}} />;
}
