// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OffRampSelector } from './OffRampSelector';

const account = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('OffRampSelector anchor discovery', () => {
  it('does not call the anchor info route on mount', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<OffRampSelector account={account} />);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('discovers the anchor once on the first off-ramp interaction and reuses it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ transferServer: 'https://api.yellowcard.io' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<OffRampSelector account={account} />);

    fireEvent.focusIn(screen.getByLabelText('Bank name'));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/anchor/yellowcard?action=info');

    // Further interaction reuses the cached discovery instead of refetching.
    fireEvent.focusIn(screen.getByLabelText('Bank account number'));
    fireEvent.focusIn(screen.getByLabelText('NGN amount'));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    await screen.findByText('Anchor endpoint ready: https://api.yellowcard.io');
  });
});
