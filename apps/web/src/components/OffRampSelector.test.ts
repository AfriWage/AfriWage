import React from 'react';
import { type ReactTestInstance, type ReactTestRenderer, act, create } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OffRampSelector } from './OffRampSelector';
import { SendPaymentForm } from './SendPaymentForm';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function changeInput(root: ReactTestInstance, id: string, value: string): void {
  act(() => {
    root.findByProps({ id }).props.onChange({ target: { value } });
  });
}

async function openOffRamp(renderer: ReactTestRenderer): Promise<void> {
  await act(async () => {
    renderer.root.findByProps({ 'aria-controls': 'yellowcard-off-ramp' }).props.onClick();
  });
}

describe('OffRampSelector lazy discovery', () => {
  it('does not mount or fetch anchor info for a disconnected sender', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const renderer = create(React.createElement(SendPaymentForm, {}));

    expect(renderer.root.findAllByType(OffRampSelector)).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('mounts without fetching for a connected send-only user', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const renderer = create(React.createElement(SendPaymentForm, { senderPublicKey: 'GACCOUNT' }));

    expect(renderer.root.findAllByType(OffRampSelector)).toHaveLength(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches on first open and reuses the loaded info on reopen', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ transferServer: 'https://anchor.example.test' }));
    vi.stubGlobal('fetch', fetchMock);
    const renderer = create(React.createElement(OffRampSelector, { account: 'GACCOUNT' }));

    expect(fetchMock).not.toHaveBeenCalled();
    await openOffRamp(renderer);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/anchor/yellowcard?action=info');

    act(() => {
      renderer.root.findByProps({ 'aria-controls': 'yellowcard-off-ramp' }).props.onClick();
    });
    await openOffRamp(renderer);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(renderer.toJSON())).toContain('anchor.example.test');
  });

  it.each([
    [
      'success',
      jsonResponse({ id: 'withdrawal-1', status: 'pending' }),
      'Withdrawal request created with ID withdrawal-1 (pending).',
    ],
    ['error', jsonResponse({ message: 'Withdrawal unavailable' }, 503), 'Withdrawal unavailable'],
  ])('preserves the withdrawal %s state', async (_label, withdrawalResponse, expectedMessage) => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ transferServer: 'https://anchor.example.test' }))
      .mockResolvedValueOnce(withdrawalResponse);
    vi.stubGlobal('fetch', fetchMock);
    const renderer = create(React.createElement(OffRampSelector, { account: 'GACCOUNT' }));

    await openOffRamp(renderer);
    changeInput(renderer.root, 'bank-name', 'Access Bank');
    changeInput(renderer.root, 'bank-account', '1234567890');
    changeInput(renderer.root, 'offramp-amount', '25');

    const submit = renderer.root
      .findAllByType('button')
      .find((button) => String(button.props.children).includes('Start Yellow Card withdrawal'));
    expect(submit).toBeDefined();
    await act(async () => {
      await submit?.props.onClick();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/anchor/yellowcard?action=withdraw',
      expect.objectContaining({ method: 'POST' })
    );
    expect(JSON.stringify(renderer.toJSON())).toContain(expectedMessage);
  });
});
