// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SendPaymentForm } from './SendPaymentForm';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const account = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('SendPaymentForm off-ramp gating', () => {
  it('does not mount the off-ramp selector without a connected wallet', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<SendPaymentForm />);

    expect(screen.queryByText('Off-ramp provider')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('mounts the off-ramp selector for a connected wallet without discovering on mount', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<SendPaymentForm senderPublicKey={account} />);

    expect(screen.getByText('Off-ramp provider')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
