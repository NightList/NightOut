import { describe, expect, it } from 'vitest';
import { CreateBookingBody, ERROR_MESSAGES, errorMessageOf, ReorderTeamBody, ReviewDepositBody, TeamMemberBody, UpdateTeamMemberBody } from './index';
import { canCreateRole, CreateUserBody } from './account';
import { UpdateHomeCategoryBody, UpdateHomeContentBody, UpdateHomePopularBody } from './site-content';
import { BAR_GALLERY_MAX, BarMediaBody, MenuBody, MenuItemImageBody } from './bar';
import { PUBLIC_BUCKETS, UploadBucket } from './storage';

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

describe('site-content', () => {
  it('partial update keeps only sent fields', () => {
    expect(UpdateHomeContentBody.parse({ categories_title: ' คืนนี้อยากได้ฟีลไหน ' })).toEqual({ categories_title: 'คืนนี้อยากได้ฟีลไหน' });
    expect(UpdateHomeContentBody.parse({ hero_image_url: null })).toEqual({ hero_image_url: null });
  });
  it('rejects unsafe images and external links', () => {
    expect(UpdateHomeCategoryBody.safeParse({ image_url: 'javascript:alert(1)' }).success).toBe(false);
    expect(UpdateHomeCategoryBody.safeParse({ link_to: 'https://evil.example' }).success).toBe(false);
    expect(UpdateHomeCategoryBody.safeParse({ link_to: '//evil.example' }).success).toBe(false);
    expect(UpdateHomeCategoryBody.safeParse({ title: '' }).success).toBe(false);
    expect(UpdateHomeCategoryBody.safeParse({ link_to: '/search?style=Rooftop' }).success).toBe(true);
  });
  it('popular bars: up to 8 unique uuids', () => {
    const id = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
    expect(UpdateHomePopularBody.safeParse({ bar_ids: [] }).success).toBe(true);
    expect(UpdateHomePopularBody.safeParse({ bar_ids: [1, 2, 3, 4, 5, 6, 7, 8].map(id) }).success).toBe(true);
    expect(UpdateHomePopularBody.safeParse({ bar_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(id) }).success).toBe(false);
    expect(UpdateHomePopularBody.safeParse({ bar_ids: [id(1), id(1)] }).success).toBe(false);
    expect(UpdateHomePopularBody.safeParse({ bar_ids: ['not-a-uuid'] }).success).toBe(false);
    expect(UpdateHomeContentBody.safeParse({ popular_title: ' ' }).success).toBe(false);
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

describe('bar media', () => {
  const bar = '96e5917b-2acc-5f7f-b4ca-fc9a3b00f07d';
  const g = (n: number) => `${bar}/gallery/${n}.webp`;
  it('gallery: up to BAR_GALLERY_MAX unique paths, cover must be one of them', () => {
    expect(BarMediaBody.safeParse({ paths: [], cover_path: null }).success).toBe(true);
    expect(BarMediaBody.safeParse({ paths: [g(1), g(2)], cover_path: g(2) }).success).toBe(true);
    expect(BarMediaBody.safeParse({ paths: [g(1)], cover_path: g(2) }).success).toBe(false);
    expect(BarMediaBody.safeParse({ paths: [g(1), g(1)], cover_path: null }).success).toBe(false);
    expect(BarMediaBody.safeParse({ paths: Array.from({ length: BAR_GALLERY_MAX + 1 }, (_, i) => g(i)), cover_path: null }).success).toBe(false);
    expect(BarMediaBody.safeParse({ paths: [`${bar}/../x.webp`], cover_path: null }).success).toBe(false);
  });
  it('menu image: optional per item (missing = keep, null = remove) · admin body takes path or null', () => {
    const item = { category: 'อาหาร', name: 'ข้าว', price: 60, available: true };
    expect(MenuBody.safeParse({ items: [item] }).success).toBe(true);
    expect(MenuBody.safeParse({ items: [{ ...item, image_path: null }] }).success).toBe(true);
    expect(MenuBody.safeParse({ items: [{ ...item, image_path: `${bar}/menu/a.jpg` }] }).success).toBe(true);
    expect(MenuBody.safeParse({ items: [{ ...item, image_path: '/etc/passwd' }] }).success).toBe(false);
    expect(MenuItemImageBody.safeParse({ path: null }).success).toBe(true);
    expect(MenuItemImageBody.safeParse({}).success).toBe(false);
  });
  it('bar-media is an uploadable public bucket', () => {
    expect(UploadBucket.safeParse('bar-media').success).toBe(true);
    expect(PUBLIC_BUCKETS).toContain('bar-media');
  });
});

describe('errors', () => {
  it('every domain contributes and nothing collides silently', () => {
    expect(ERROR_MESSAGES.ZONE_FULL).toContain('เต็ม');
    expect(ERROR_MESSAGES.TEAM_MEMBER_NOT_FOUND).toBeTruthy();
    expect(ERROR_MESSAGES.LAST_SUPER_ADMIN).toBeTruthy();
    expect(ERROR_MESSAGES.TEAM_MEMBER_NOT_OWN).toBeTruthy();
    expect(ERROR_MESSAGES.TEAM_MEMBER_EMAIL_LOCKED).toBeTruthy();
    expect(ERROR_MESSAGES.INVALID_BAR_MEDIA).toContain('รูป');
    expect(ERROR_MESSAGES.INVALID_MENU_IMAGE).toBeTruthy();
    expect(ERROR_MESSAGES.INVALID_MENU_ITEM).toBeTruthy();
    expect(Object.keys(ERROR_MESSAGES).length).toBeGreaterThan(70);
  });

  it('errorMessageOf: exact code → embedded code → unknown stays as-is', () => {
    expect(errorMessageOf('ZONE_FULL')).toBe(ERROR_MESSAGES.ZONE_FULL);
    expect(errorMessageOf('SUPABASE_UNREACHABLE: fetch failed')).toBe(ERROR_MESSAGES.SUPABASE_UNREACHABLE);
    expect(errorMessageOf('SOMETHING_NEW')).toBe('SOMETHING_NEW');
  });
});
