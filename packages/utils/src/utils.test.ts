import { describe, expect, it } from 'vitest';
import {
  DEPOSIT_REJECT_CODES,
  DEPOSIT_REJECT_REASONS,
  canTransition,
  depositTermsLines,
  depositTermsText,
  formatThaiPhone,
  toThaiE164,
  estimatePrice,
  isNewBar,
  isTerminalStatus,
  nextStatuses,
  scoreToStars,
  starsToTier,
} from './index';

describe('booking state machine', () => {
  it('allows staff to check in a confirmed booking', () => {
    expect(canTransition('CONFIRMED', 'CHECKED_IN', 'STAFF')).toBe(true);
  });
  it('does not let a customer confirm their own booking', () => {
    expect(canTransition('PENDING', 'CONFIRMED', 'CUSTOMER')).toBe(false);
  });
  it('only the system can mark NO_SHOW', () => {
    expect(canTransition('CONFIRMED', 'NO_SHOW', 'MERCHANT')).toBe(false);
    expect(canTransition('CONFIRMED', 'NO_SHOW', 'SYSTEM')).toBe(true);
  });
  it('terminal statuses have no exits', () => {
    expect(isTerminalStatus('COMPLETED')).toBe(true);
    expect(nextStatuses('NO_SHOW', 'SYSTEM')).toEqual([]);
  });
});

describe('estimatePrice', () => {
  it('matches the "2 กลม + โซดา 10 + น้ำแข็ง 3" example with 10% SC and 7% VAT', () => {
    const r = estimatePrice({
      items: [
        { name: 'set A', quantity: 2, unitPrice: 1000 },
        { name: 'soda', quantity: 10, unitPrice: 25 },
        { name: 'ice', quantity: 3, unitPrice: 30 },
      ],
      fees: { serviceChargeRate: 10, vatRate: 7, otherFees: 0 },
      pax: 4,
    });
    expect(r.subtotal).toBe(2340);
    expect(r.serviceCharge).toBe(234);
    expect(r.vat).toBe(180.18);
    expect(r.estimatedTotal).toBe(2754.18);
    expect(r.perPerson).toBe(688.55);
  });
});

describe('ranking', () => {
  it('maps score → stars → tier', () => {
    expect(scoreToStars(92)).toBe(5);
    expect(starsToTier(scoreToStars(92))).toBe('S');
    expect(starsToTier(scoreToStars(80))).toBe('A');
    expect(starsToTier(scoreToStars(65))).toBe('B');
    expect(starsToTier(scoreToStars(10))).toBe('C');
  });
  it('flags bars with fewer than 5 reviews as new', () => {
    expect(isNewBar(4)).toBe(true);
    expect(isNewBar(5)).toBe(false);
  });
});

describe('deposit helpers', () => {
  it('normalizes Thai phone numbers to E.164', () => {
    expect(toThaiE164('081-234-5678')).toBe('+66812345678');
    expect(toThaiE164('+66 81 234 5678')).toBe('+66812345678');
    expect(toThaiE164('66812345678')).toBe('+66812345678');
    expect(toThaiE164('02-123-4567')).toBe('+6621234567');
    expect(toThaiE164('0112345678')).toBeNull();
    expect(toThaiE164('12345')).toBeNull();
    expect(formatThaiPhone('+66812345678')).toBe('081-234-5678');
  });
  it('builds the deposit forfeiture terms the customer accepts', () => {
    const t = depositTermsText({ amount: 1000, refundBeforeHours: 24, graceMinutes: 30, barPolicy: 'หักจากค่าอาหาร' });
    expect(t).toContain('฿1,000');
    expect(t).toContain('24 ชั่วโมง');
    expect(t).toContain('30 นาที');
    expect(t).toContain('ถูกริบ');
    expect(t).toContain('4. เงื่อนไขของร้าน: หักจากค่าอาหาร');
    expect(depositTermsLines({ amount: 500, refundBeforeHours: 0, graceMinutes: 15 })).toHaveLength(3);
  });
  it('has a label for every reject code', () => {
    expect(DEPOSIT_REJECT_CODES).toContain('FAKE_SLIP');
    expect(DEPOSIT_REJECT_REASONS.every((r) => r.label.length > 0)).toBe(true);
  });
});
