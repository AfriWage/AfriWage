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
    fireEvent.focusIn(screen.getByLabelText('USDC amount'));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    await screen.findByText('Anchor endpoint ready: https://api.yellowcard.io');
  });
});

describe('OffRampSelector withdrawal submission', () => {
  it('submits the entered amount as USDC and confirms the USDC unit', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url === '/api/anchor/yellowcard?action=info') {
        return Promise.resolve(
          new Response(JSON.stringify({ transferServer: 'https://api.yellowcard.io' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ id: 'w-1', status: 'pending' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<OffRampSelector account={account} />);

    fireEvent.change(screen.getByLabelText('Bank name'), { target: { value: 'Access Bank' } });
    fireEvent.change(screen.getByLabelText('Bank account number'), {
      target: { value: '1234567890' },
    });
    fireEvent.change(screen.getByLabelText('USDC amount'), { target: { value: '25.5' } });

    fireEvent.click(screen.getByRole('button', { name: 'Start Yellow Card withdrawal' }));

    await screen.findByText('Withdrawal request created for 25.5 USDC with ID w-1 (pending).');

    const withdrawCall = fetchMock.mock.calls.find(
      ([url]) => url === '/api/anchor/yellowcard?action=withdraw'
    );
    expect(withdrawCall).toBeDefined();
    const [, init] = withdrawCall as [string, { body?: string }];
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      amount: '25.5',
      assetCode: 'USDC',
    });
  });

  it('labels the amount input as USDC', () => {
    render(<OffRampSelector account={account} />);
    expect(screen.getByLabelText('USDC amount')).toBeTruthy();
  });
});
