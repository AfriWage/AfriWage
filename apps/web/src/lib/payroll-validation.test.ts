import { describe, expect, it } from 'vitest';
import {
  parseConfirmTransaction,
  parseCreatePayrollRun,
  parseInitiateOfframp,
  parseSubmitRun,
} from './payroll-validation';

const EMPLOYEE_ID = '7a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d';
const ITEM_ID = '9b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e';
const TX_HASH = 'a'.repeat(64);

describe('parseCreatePayrollRun', () => {
  it('accepts a run built from every active employee', () => {
    expect(parseCreatePayrollRun({ fromActiveEmployees: true })).toEqual({
      fromActiveEmployees: true,
      items: [],
    });
  });

  it('accepts explicit items, defaulting the amount to the stored wage', () => {
    expect(parseCreatePayrollRun({ items: [{ employeeId: EMPLOYEE_ID }] })).toEqual({
      fromActiveEmployees: false,
      items: [{ employeeId: EMPLOYEE_ID }],
    });
  });

  it('accepts an explicit per-item amount override', () => {
    expect(
      parseCreatePayrollRun({ items: [{ employeeId: EMPLOYEE_ID, amount: '250.50' }] })
    ).toMatchObject({ items: [{ employeeId: EMPLOYEE_ID, amount: '250.50' }] });
  });

  it('rejects a run with neither a source nor items', () => {
    expect(() => parseCreatePayrollRun({})).toThrow();
  });

  it('rejects an empty item list rather than creating a run that pays nobody', () => {
    expect(() => parseCreatePayrollRun({ items: [] })).toThrow();
  });

  it('rejects more items than one transaction can carry', () => {
    const items = Array.from({ length: 101 }, () => ({ employeeId: EMPLOYEE_ID }));

    expect(() => parseCreatePayrollRun({ items })).toThrow();
  });

  it.each([['0'], ['-1'], ['1.12345678'], ['abc']])('rejects an amount of %s', (amount) => {
    expect(() => parseCreatePayrollRun({ items: [{ employeeId: EMPLOYEE_ID, amount }] })).toThrow();
  });

  it('rejects a malformed employee id', () => {
    expect(() => parseCreatePayrollRun({ items: [{ employeeId: 'nope' }] })).toThrow();
  });
});

describe('parseSubmitRun', () => {
  it('accepts the build phase with a category id', () => {
    expect(parseSubmitRun({ categoryId: 1 })).toEqual({ categoryId: 1 });
  });

  it('accepts the record phase with a transaction hash', () => {
    expect(parseSubmitRun({ transactionHash: TX_HASH })).toEqual({ transactionHash: TX_HASH });
  });

  it('rejects a body with neither', () => {
    expect(() => parseSubmitRun({})).toThrow();
  });

  it.each([[0], [-1], [1.5]])('rejects a category id of %s', (categoryId) => {
    expect(() => parseSubmitRun({ categoryId })).toThrow();
  });

  it('rejects a truncated transaction hash', () => {
    expect(() => parseSubmitRun({ transactionHash: 'abc' })).toThrow();
  });
});

describe('parseConfirmTransaction', () => {
  it('accepts a 64-character hex hash', () => {
    expect(parseConfirmTransaction({ transactionHash: TX_HASH })).toEqual({
      transactionHash: TX_HASH,
    });
  });

  it('rejects a missing hash', () => {
    expect(() => parseConfirmTransaction({})).toThrow(/transactionHash/);
  });
});

describe('parseInitiateOfframp', () => {
  it('accepts an item id and anchor token', () => {
    expect(parseInitiateOfframp({ itemId: ITEM_ID, authToken: 'jwt' })).toEqual({
      itemId: ITEM_ID,
      authToken: 'jwt',
    });
  });

  it('accepts an explicit destination currency', () => {
    expect(
      parseInitiateOfframp({ itemId: ITEM_ID, authToken: 'jwt', destinationCurrency: 'NGN' })
    ).toMatchObject({ destinationCurrency: 'NGN' });
  });

  it('rejects an unsupported destination currency', () => {
    expect(() =>
      parseInitiateOfframp({ itemId: ITEM_ID, authToken: 'jwt', destinationCurrency: 'KES' })
    ).toThrow(/destinationCurrency/);
  });

  it('rejects an empty anchor token', () => {
    expect(() => parseInitiateOfframp({ itemId: ITEM_ID, authToken: '' })).toThrow(/authToken/);
  });
});
