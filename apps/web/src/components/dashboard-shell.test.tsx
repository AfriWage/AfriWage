// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardShell } from './dashboard-shell';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/dashboard',
  Link: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => null,
}));

vi.mock('@/components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => null,
}));

const validKey = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('DashboardShell treasury wallet', () => {
  it('does not render or copy a non-Stellar placeholder treasury address', () => {
    vi.stubEnv('NEXT_PUBLIC_TREASURY_WALLET', 'GA4FWQ7RZ6K2...H9X2');

    render(
      <DashboardShell title="Dashboard" description="desc">
        {null}
      </DashboardShell>
    );

    expect(screen.getByText('treasuryNotConfigured')).toBeTruthy();
    expect(screen.queryByText('GA4FWQ7RZ6K2...H9X2')).toBeNull();
    expect(screen.queryByRole('button', { name: 'copyTreasuryWallet' })).toBeNull();
  });

  it('renders a clear, non-actionable state when no treasury wallet is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_TREASURY_WALLET', '');

    render(
      <DashboardShell title="Dashboard" description="desc">
        {null}
      </DashboardShell>
    );

    expect(screen.getByText('treasuryNotConfigured')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'copyTreasuryWallet' })).toBeNull();
  });

  it('renders a validated treasury address and copies that same address', async () => {
    vi.stubEnv('NEXT_PUBLIC_TREASURY_WALLET', validKey);

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    render(
      <DashboardShell title="Dashboard" description="desc">
        {null}
      </DashboardShell>
    );

    expect(screen.getByText(validKey)).toBeTruthy();
    expect(screen.queryByText('treasuryNotConfigured')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'copyTreasuryWallet' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(validKey));
  });
});
