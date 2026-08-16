import { describe, expect, it } from 'vitest';
import {
  addAmounts,
  formatAmountForDisplay,
  parseAmount,
  parseAndValidateAmount,
  parseHorizonAmount,
  prepareAmountForStellar,
} from './amount-utils';

describe('amount-utils', () => {
  it('preserves precision when summing decimal amounts', () => {
    const total = addAmounts(parseAmount('0.1'), parseAmount('0.2'));

    expect(total.toFixed(2)).toBe('0.30');
  });

  it('formats USDC Horizon balances with more than two decimal places', () => {
    const amount = parseHorizonAmount('12.3456', 'USDC balance');

    expect(prepareAmountForStellar(amount, 'USDC')).toBe('12.35');
  });

  it('formats XLM with seven decimal places', () => {
    const amount = parseHorizonAmount('100.5', 'XLM balance');

    expect(formatAmountForDisplay(amount, 'XLM')).toBe('100.5000000');
  });

  it('rejects user-supplied USDC amounts with more than two decimal places', () => {
    expect(() => parseAndValidateAmount('1.234', 'USDC', 'amount')).toThrow(
      'must have at most 2 decimal places for USDC'
    );
  });

  it('accepts user-supplied USDC amounts with up to two decimal places', () => {
    expect(parseAndValidateAmount('25.50', 'USDC', 'amount').toFixed(2)).toBe('25.50');
  });
});
