import { describe, expect, it } from 'vitest';
import { CreateUserBody, ReorderTeamDto, ReviewDepositDto, TeamMemberBody, UpdateTeamMemberDto } from './admin.dto';

describe('team member DTOs', () => {
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
  it('partial update does not inject defaults', () => {
    expect(UpdateTeamMemberDto.schema.parse({ active: false })).toEqual({ active: false });
  });
  it('order needs uuids', () => {
    expect(ReorderTeamDto.schema.safeParse({ ids: ['x'] }).success).toBe(false);
  });
});

describe('CreateUserBody', () => {
  const base = { email: ' New@Mail.com ', display_name: 'ใหม่', birthdate: '1995-05-05' };
  it('normalizes email and allows customer without bar', () => {
    const r = CreateUserBody.parse({ ...base, account_type: 'CUSTOMER' });
    expect(r.email).toBe('new@mail.com');
  });
  it('requires a bar for bar roles and forbids it otherwise', () => {
    expect(CreateUserBody.safeParse({ ...base, account_type: 'STAFF' }).success).toBe(false);
    expect(CreateUserBody.safeParse({ ...base, account_type: 'OWNER', bar_id: '00000000-0000-4000-8000-000000000001' }).success).toBe(true);
    expect(CreateUserBody.safeParse({ ...base, account_type: 'ADMIN', bar_id: '00000000-0000-4000-8000-000000000001' }).success).toBe(false);
  });
  it('rejects under 20, short passwords', () => {
    const young = new Date();
    young.setFullYear(young.getFullYear() - 19);
    expect(CreateUserBody.safeParse({ ...base, account_type: 'CUSTOMER', birthdate: young.toISOString().slice(0, 10) }).success).toBe(false);
    expect(CreateUserBody.safeParse({ ...base, account_type: 'CUSTOMER', password: 'short' }).success).toBe(false);
  });
});

describe('ReviewDepositDto', () => {
  const s = ReviewDepositDto.schema;
  it('approve needs no reason', () => {
    expect(s.safeParse({ approve: true }).success).toBe(true);
  });
  it('reject needs a reason code, OTHER needs text', () => {
    expect(s.safeParse({ approve: false }).success).toBe(false);
    expect(s.safeParse({ approve: false, reason_code: 'NOPE' }).success).toBe(false);
    expect(s.safeParse({ approve: false, reason_code: 'FAKE_SLIP' }).success).toBe(true);
    expect(s.safeParse({ approve: false, reason_code: 'OTHER' }).success).toBe(false);
    expect(s.safeParse({ approve: false, reason_code: 'OTHER', reason: 'ชื่อบัญชีไม่ตรง' }).success).toBe(true);
  });
});
