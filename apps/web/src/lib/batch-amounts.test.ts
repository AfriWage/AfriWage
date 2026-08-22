import { describe, expect, it } from 'vitest';
import { isValidPositiveAmount, sumUsdcAmounts } from './batch-amounts';

describe('batch amount helpers', () => {
  it('sums decimal amounts without floating-point corruption', () => {
    expect(sumUsdcAmounts(['0.1', '0.2'])).toBe('0.30');
    expect(sumUsdcAmounts(['10.50', '20.25', '0.05'])).toBe('30.80');
  });

  it('validates positive decimal amounts', () => {
    expect(isValidPositiveAmount('25.00')).toBe(true);
    expect(isValidPositiveAmount('0.0000001')).toBe(true);
    expect(isValidPositiveAmount('0')).toBe(false);
    expect(isValidPositiveAmount('-1')).toBe(false);
    expect(isValidPositiveAmount('abc')).toBe(false);
  });
});
