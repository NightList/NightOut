import { describe, expect, it } from 'vitest';
import { CreateBookingBody, ERROR_MESSAGES, ReorderTeamBody, ReviewDepositBody, TeamMemberBody, UpdateTeamMemberBody } from './index';
import { canCreateRole, CreateUserBody } from './account';

describe('booking', () => {
  const base = {
    bar_id: '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d',
    zone_id: '786b8848-090f-50da-b21a-90cc60073677',
    datetime: '2026-10-10T21:00:00+07:00',
    pax: 2,
  };
  const terms = { accepted: true as const, terms_version: 'deposit-v1', terms_text: 'ฉันได้อ่านและยอมรับเงื่อนไขมัดจำ ฿500' };
  it('normalizes a Thai phone to E.164', () => {
    expect(CreateBookingBody.parse({ ...base, contact_phone: '081-234-5678', deposit_terms: terms }).contact_phone).toBe('+66812345678');
  });
  it('rejects a missing or bad phone, and terms not accepted', () => {
    expect(CreateBookingBody.safeParse({ ...base, deposit_terms: terms }).success).toBe(false);
    expect(CreateBookingBody.safeParse({ ...base, contact_phone: '123', deposit_terms: terms }).success).toBe(false);
    expect(CreateBookingBody.safeParse({ ...base, contact_phone: '0812345678', deposit_terms: { ...terms, accepted: false } }).success).toBe(false);
  });
});

describe('deposit review', () => {
  it('approve needs no reason · reject needs a code · OTHER needs text', () => {
    expect(ReviewDepositBody.safeParse({ approve: true }).success).toBe(true);
    expect(ReviewDepositBody.safeParse({ approve: false }).success).toBe(false);
    expect(ReviewDepositBody.safeParse({ approve: false, reason_code: 'NOPE' }).success).toBe(false);
    expect(ReviewDepositBody.safeParse({ approve: false, reason_code: 'FAKE_SLIP' }).success).toBe(true);
    expect(ReviewDepositBody.safeParse({ approve: false, reason_code: 'OTHER' }).success).toBe(false);
    expect(ReviewDepositBody.safeParse({ approve: false, reason_code: 'OTHER', reason: 'ชื่อบัญชีไม่ตรง' }).success).toBe(true);
  });
});

describe('site-team', () => {
  it('accepts a full member and applies defaults', () => {
    const r = TeamMemberBody.parse({ nickname: ' แสน ', contacts: { github: 'https://github.com/san' } });
    expect(r).toMatchObject({ nickname: 'แสน', roles: [], skills: [], active: true, contacts: { github: 'https://github.com/san' } });
  });
  it('rejects unsafe links and bad values', () => {
    expect(TeamMemberBody.safeParse({ nickname: '' }).success).toBe(false);
    expect(TeamMemberBody.safeParse({ nickname: 'a', photo_url: 'javascript:alert(1)' }).success).toBe(false);
    expect(TeamMemberBody.safeParse({ nickname: 'a', photo_url: 'data:image/png;base64,x' }).success).toBe(false);
    expect(TeamMemberBody.safeParse({ nickname: 'a', contacts: { facebook: 'http://fb.com/x' } }).success).toBe(false);
    expect(TeamMemberBody.safeParse({ nickname: 'a', contacts: { email: 'not-mail' } }).success).toBe(false);
    expect(TeamMemberBody.safeParse({ nickname: 'a', roles: Array(7).fill('x') }).success).toBe(false);
  });
  it('partial update does not inject defaults · order needs uuids', () => {
    expect(UpdateTeamMemberBody.parse({ active: false })).toEqual({ active: false });
    expect(ReorderTeamBody.safeParse({ ids: ['x'] }).success).toBe(false);
  });
});

describe('account', () => {
  const base = { email: ' New@Mail.com ', display_name: 'ใหม่', birthdate: '1995-05-05' };
  it('normalizes email and ties bar to account type', () => {
    expect(CreateUserBody.parse({ ...base, account_type: 'CUSTOMER' }).email).toBe('new@mail.com');
    expect(CreateUserBody.safeParse({ ...base, account_type: 'STAFF' }).success).toBe(false);
    expect(CreateUserBody.safeParse({ ...base, account_type: 'ADMIN', bar_id: '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d' }).success).toBe(false);
    expect(CreateUserBody.safeParse({ ...base, account_type: 'OWNER', bar_id: '00000000-0000-4000-8000-000000000001' }).success).toBe(true);
    expect(CreateUserBody.safeParse({ ...base, account_type: 'SUPER_ADMIN' }).success).toBe(true);
    expect(CreateUserBody.safeParse({ ...base, birthdate: '2020-01-01', account_type: 'CUSTOMER' }).success).toBe(false);
    expect(CreateUserBody.safeParse({ ...base, account_type: 'CUSTOMER', password: 'short' }).success).toBe(false);
  });
  it('admin creates only customer / merchant / staff · super admin creates all', () => {
    expect(canCreateRole('ADMIN', 'CUSTOMER') && canCreateRole('ADMIN', 'MERCHANT') && canCreateRole('ADMIN', 'STAFF')).toBe(true);
    expect(canCreateRole('ADMIN', 'ADMIN')).toBe(false);
    expect(canCreateRole('SUPER_ADMIN', 'SUPER_ADMIN')).toBe(true);
  });
});

describe('errors', () => {
  it('every domain contributes and nothing collides silently', () => {
    expect(ERROR_MESSAGES.ZONE_FULL).toContain('เต็ม');
    expect(ERROR_MESSAGES.TEAM_MEMBER_NOT_FOUND).toBeTruthy();
    expect(ERROR_MESSAGES.LAST_SUPER_ADMIN).toBeTruthy();
    expect(Object.keys(ERROR_MESSAGES).length).toBeGreaterThan(70);
  });
});
