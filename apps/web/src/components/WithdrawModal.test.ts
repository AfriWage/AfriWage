import { describe, expect, it } from 'vitest';
import { validateWithdrawAmount } from './WithdrawModal';

describe('validateWithdrawAmount', () => {
  it('accepts a valid positive decimal amount within balance', () => {
    expect(validateWithdrawAmount('10.50', '100')).toBeNull();
    expect(validateWithdrawAmount('100', '100')).toBeNull();
    expect(validateWithdrawAmount('0.01', '0.01')).toBeNull();
  });

  it('rejects malformed decimal strings', () => {
    expect(validateWithdrawAmount('abc', '100')).toBe('Enter a valid amount');
    expect(validateWithdrawAmount('1.2.3', '100')).toBe('Enter a valid amount');
    expect(validateWithdrawAmount('--5', '100')).toBe('Enter a valid amount');
    expect(validateWithdrawAmount('1e999', '100')).toBe('Enter a valid amount');
  });

  it('rejects zero and negative amounts', () => {
    expect(validateWithdrawAmount('0', '100')).toBe('Amount must be greater than zero');
    expect(validateWithdrawAmount('0.00', '100')).toBe('Amount must be greater than zero');
    expect(validateWithdrawAmount('-5', '100')).toBe('Amount must be greater than zero');
  });

  it('rejects amounts exceeding the supported precision', () => {
    expect(validateWithdrawAmount('10.123', '100')).toBe(
      'Amount cannot have more than 2 decimal places'
    );
    expect(validateWithdrawAmount('0.001', '100')).toBe(
      'Amount cannot have more than 2 decimal places'
    );
  });

  it('rejects amounts greater than the available balance', () => {
    expect(validateWithdrawAmount('100.01', '100')).toBe(
      'Amount exceeds your available USDC balance'
    );
    expect(validateWithdrawAmount('50', '49.99')).toBe(
      'Amount exceeds your available USDC balance'
    );
  });

  it('returns null for an empty or blank input', () => {
    expect(validateWithdrawAmount('', '100')).toBeNull();
    expect(validateWithdrawAmount('   ', '100')).toBeNull();
  });

  it('treats an unparseable balance as zero', () => {
    expect(validateWithdrawAmount('1', 'not-a-number')).toBe(
      'Amount exceeds your available USDC balance'
    );
  });
});
