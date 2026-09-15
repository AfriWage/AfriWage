import { Keypair } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';
import {
  parseAddMember,
  parseCreateEmployee,
  parseCreateOrganization,
  parseUpdateEmployee,
} from './org-validation';

const PUBLIC_KEY = Keypair.random().publicKey();
const EMPLOYEE_ID = '7a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d';

describe('parseCreateOrganization', () => {
  it('trims the name and defaults the off-ramp currency to null', () => {
    expect(parseCreateOrganization({ name: '  Kano Logistics  ' })).toEqual({
      name: 'Kano Logistics',
      defaultOfframpCurrency: null,
    });
  });

  it.each([['NGN'], ['GHS']])('accepts %s as an off-ramp currency', (currency) => {
    expect(parseCreateOrganization({ name: 'Org', defaultOfframpCurrency: currency })).toEqual({
      name: 'Org',
      defaultOfframpCurrency: currency,
    });
  });

  it('normalises an explicit null off-ramp currency', () => {
    expect(parseCreateOrganization({ name: 'Org', defaultOfframpCurrency: null })).toMatchObject({
      defaultOfframpCurrency: null,
    });
  });

  it.each([
    [{}, 'name'],
    [{ name: '' }, 'name'],
    [{ name: 'a'.repeat(121) }, 'name'],
    [{ name: 'Org', defaultOfframpCurrency: 'KES' }, 'defaultOfframpCurrency'],
  ])('rejects %j naming the offending field', (body, field) => {
    expect(() => parseCreateOrganization(body)).toThrow(new RegExp(field));
  });
});

describe('parseAddMember', () => {
  it.each([['owner'], ['admin'], ['payer']])('accepts the %s role', (role) => {
    expect(parseAddMember({ walletPublicKey: PUBLIC_KEY, role })).toEqual({
      walletPublicKey: PUBLIC_KEY,
      role,
    });
  });

  it('rejects a role outside the known set', () => {
    expect(() => parseAddMember({ walletPublicKey: PUBLIC_KEY, role: 'superuser' })).toThrow(
      /role/
    );
  });

  it('rejects a secret key passed as the wallet public key', () => {
    expect(() =>
      parseAddMember({ walletPublicKey: Keypair.random().secret(), role: 'payer' })
    ).toThrow(/walletPublicKey/);
  });
});

describe('parseCreateEmployee', () => {
  const valid = {
    name: 'Amina Yusuf',
    stellarPublicKey: PUBLIC_KEY,
    wageAmount: '250.50',
  };

  it('defaults the wage currency to USDC and the off-ramp to null', () => {
    expect(parseCreateEmployee(valid)).toEqual({
      name: 'Amina Yusuf',
      stellarPublicKey: PUBLIC_KEY,
      wageAmount: '250.50',
      wageCurrency: 'USDC',
      payoutOfframpCurrency: null,
    });
  });

  it('accepts the full seven decimal places USDC supports', () => {
    expect(parseCreateEmployee({ ...valid, wageAmount: '0.0000001' })).toMatchObject({
      wageAmount: '0.0000001',
    });
  });

  it('keeps the wage as the exact string it was given', () => {
    expect(parseCreateEmployee({ ...valid, wageAmount: '1000000.1234567' })).toMatchObject({
      wageAmount: '1000000.1234567',
    });
  });

  it.each([
    ['0', 'zero'],
    ['0.00', 'zero with decimals'],
    ['-5', 'a negative amount'],
    ['1.12345678', 'more than seven decimal places'],
    ['1e3', 'scientific notation'],
    ['abc', 'a non-numeric string'],
  ])('rejects a wage of %s (%s)', (wageAmount) => {
    expect(() => parseCreateEmployee({ ...valid, wageAmount })).toThrow(/wageAmount/);
  });

  it('rejects an unsupported wage currency', () => {
    expect(() => parseCreateEmployee({ ...valid, wageCurrency: 'NGN' })).toThrow(/wageCurrency/);
  });

  it('rejects an invalid Stellar public key', () => {
    expect(() => parseCreateEmployee({ ...valid, stellarPublicKey: 'nope' })).toThrow(
      /stellarPublicKey/
    );
  });
});

describe('parseUpdateEmployee', () => {
  it('accepts a single changed field alongside the id', () => {
    expect(parseUpdateEmployee({ id: EMPLOYEE_ID, active: false })).toEqual({
      id: EMPLOYEE_ID,
      active: false,
    });
  });

  it('allows clearing the off-ramp currency so a payout stays on-chain', () => {
    expect(parseUpdateEmployee({ id: EMPLOYEE_ID, payoutOfframpCurrency: null })).toEqual({
      id: EMPLOYEE_ID,
      payoutOfframpCurrency: null,
    });
  });

  it('rejects an update carrying no changes', () => {
    expect(() => parseUpdateEmployee({ id: EMPLOYEE_ID })).toThrow(/at least one field/);
  });

  it('rejects a malformed employee id', () => {
    expect(() => parseUpdateEmployee({ id: 'nope', active: false })).toThrow(/id/);
  });

  it('applies the same wage rules as creation', () => {
    expect(() => parseUpdateEmployee({ id: EMPLOYEE_ID, wageAmount: '0' })).toThrow(/wageAmount/);
  });
});
