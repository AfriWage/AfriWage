import { describe, expect, it } from 'vitest';
import { formatAmount } from './stellar-format';

describe('formatAmount', () => {
  it('uses USDC precision when the asset is USDC', () => {
    expect(formatAmount('50.123', 'USDC')).toBe('50.12 USDC');
  });

  it('uses XLM precision when the asset is XLM', () => {
    expect(formatAmount('100.5', 'XLM')).toBe('100.5000000 XLM');
  });

  it('does not treat an empty asset as XLM', () => {
    expect(formatAmount('100.5', '')).toBe('100.50 ');
  });
});
