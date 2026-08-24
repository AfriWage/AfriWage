// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BatchPage from './page';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('lucide-react', () => ({
  AlertCircle: () => <span data-testid="icon-alert" />,
  CheckCircle2: () => <span data-testid="icon-check" />,
  Download: () => <span data-testid="icon-download" />,
  FileUp: () => <span data-testid="icon-fileup" />,
  Loader2: () => <span data-testid="icon-loader" />,
  Upload: () => <span data-testid="icon-upload" />,
  XCircle: () => <span data-testid="icon-x" />,
}));

vi.mock('@/components/WalletConnect', () => ({
  WalletConnect: ({ onConnect }: { onConnect?: (pk: string) => void }) => (
    <button type="button" onClick={() => onConnect?.('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5')}>
      connect
    </button>
  ),
}));

vi.mock('@/components/dashboard-shell', () => ({
  DashboardShell: ({ children, actions }: { children: ReactNode; actions?: ReactNode }) => (
    <div>
      {actions}
      {children}
    </div>
  ),
  SurfaceCard: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('papaparse', () => ({
  default: { unparse: (data: unknown) => JSON.stringify(data) },
}));

const validRows = Array.from({ length: 250 }, (_, index) => ({
  address: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA${index % 10}`,
  amount: '10.00',
  memo: `Memo ${index}`,
}));

vi.mock('@/lib/batch-payment-csv', () => ({
  MAX_BATCH_PAYMENTS: 100,
  isBatchFileTooLarge: () => false,
  parseBatchCsv: () => ({ rows: validRows, parseErrors: [] }),
  validateBatchFile: () => ({ valid: true }),
}));

const { sendBatchPaymentsViaFreighter } = vi.hoisted(() => ({
  sendBatchPaymentsViaFreighter: vi.fn(),
}));

vi.mock('@/lib/payment-client', () => ({
  sendBatchPaymentsViaFreighter: (...args: unknown[]) => sendBatchPaymentsViaFreighter(...args),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  sendBatchPaymentsViaFreighter.mockResolvedValue({ hash: 'abc123' });
});

async function uploadAndConfirm() {
  render(<BatchPage />);
  fireEvent.click(screen.getByText('connect'));
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['dummy'], 'payments.csv', { type: 'text/csv' });
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => expect(screen.getByText('reviewTitle')).toBeTruthy());
  fireEvent.click(screen.getByText('confirmSendAll'));
}

describe('BatchPage chunk failure handling', () => {
  it('does not report a run as complete when a chunk fails and keeps later chunks pending', async () => {
    // First chunk (100 rows) fails; chunks two and three are never attempted.
    sendBatchPaymentsViaFreighter.mockRejectedValueOnce(new Error('network down'));

    await uploadAndConfirm();

    await waitFor(() => expect(screen.getByText('failedTitle')).toBeTruthy());

    // The run must not be reported as complete.
    expect(screen.queryByText('completeTitle')).toBeNull();

    // The failed chunk error is exposed.
    expect(screen.getByText(/network down/)).toBeTruthy();

    // Rows in the later, unattempted chunks remain pending.
    const pendingLabels = screen.getAllByText('pending');
    expect(pendingLabels.length).toBe(150);

    // The failed chunk rows are marked failed, none are reported as sent.
    expect(screen.getAllByText('failed').length).toBe(100);
    expect(screen.queryByText('sent')).toBeNull();
  });

  it('retrying does not resend rows whose transaction already succeeded', async () => {
    // First attempt: chunk one succeeds, chunk two fails, chunk three unattempted.
    sendBatchPaymentsViaFreighter
      .mockResolvedValueOnce({ hash: 'chunk-one' })
      .mockRejectedValueOnce(new Error('network down'));

    await uploadAndConfirm();
    await waitFor(() => expect(screen.getByText('failedTitle')).toBeTruthy());

    // Retry: only the 150 pending rows (chunks two and three) should be sent.
    sendBatchPaymentsViaFreighter
      .mockResolvedValueOnce({ hash: 'chunk-two' })
      .mockResolvedValueOnce({ hash: 'chunk-three' });
    fireEvent.click(screen.getByText('retry'));

    await waitFor(() => expect(screen.getByText('completeTitle')).toBeTruthy());

    // Chunk one sent once; retry sends chunks two and three (150 rows total).
    expect(sendBatchPaymentsViaFreighter).toHaveBeenCalledTimes(3);
    expect(sendBatchPaymentsViaFreighter.mock.calls[1][1].length).toBe(100);
    expect(sendBatchPaymentsViaFreighter.mock.calls[2][1].length).toBe(50);
  });
});
