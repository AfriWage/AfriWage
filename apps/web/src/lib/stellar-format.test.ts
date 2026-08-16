import { describe, expect, it } from 'vitest';
import { formatAmount } from './stellar-format';

describe('formatAmount', () => {
  it('uses USDC precision when the asset is USDC', () => {
    expect(formatAmount('50.123', 'USDC')).toBe('50.12 USDC');
    expect(formatAmount('1234.5', 'USDC')).toBe('1,234.50 USDC');
  });

  it('uses XLM precision and preserves grouping when the asset is XLM', () => {
    expect(formatAmount('100.5', 'XLM')).toBe('100.5000000 XLM');
    expect(formatAmount('1234.5', 'XLM')).toBe('1,234.5000000 XLM');
  });

  it('does not treat an empty asset as XLM', () => {
    expect(formatAmount('100.5', '')).toBe('100.50 ');
  });
});
