import { describe, expect, it } from 'vitest';
import { CreateBookingDto } from './customer.dto';

describe('CreateBookingDto', () => {
  const base = {
    bar_id: '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d',
    zone_id: '786b8848-090f-50da-b21a-90cc60073677',
    datetime: '2026-10-10T21:00:00+07:00',
    pax: 2,
  };
  const terms = { accepted: true, terms_version: 'deposit-v1', terms_text: 'ฉันได้อ่านและยอมรับเงื่อนไขมัดจำ ฿500' };
  it('normalizes a Thai phone to E.164', () => {
    const r = CreateBookingDto.schema.parse({ ...base, contact_phone: '081-234-5678', deposit_terms: terms });
    expect(r.contact_phone).toBe('+66812345678');
  });
  it('rejects a missing or bad phone', () => {
    expect(CreateBookingDto.schema.safeParse({ ...base, deposit_terms: terms }).success).toBe(false);
    expect(CreateBookingDto.schema.safeParse({ ...base, contact_phone: '123', deposit_terms: terms }).success).toBe(false);
  });
  it('terms must be accepted = true', () => {
    const bad = { ...base, contact_phone: '0812345678', deposit_terms: { ...terms, accepted: false } };
    expect(CreateBookingDto.schema.safeParse(bad).success).toBe(false);
  });
});
