import { ThemeMode, UserRole } from '@nightout/types';
import { z } from 'zod';
import { uuid } from './common';

/**
 * โดเมน account — โปรไฟล์ ความชอบ แจ้งเตือน ร้านโปรด ลบบัญชี (ลูกค้า)
 * ผู้ใช้ ชั้นบัญชี (roles) แบน/ปลดแบน (Backoffice — ADR 0005)
 */

// ----------------------------- ฉัน -----------------------------
/** GET /me/profile */
export interface MyProfile {
  id: string;
  display_name: string;
  role: UserRole;
  /** ชื่อไทยของชั้นบัญชี (ตาราง roles) */
  role_label: string;
  can_enter_backoffice: boolean;
  /** เบอร์ล่าสุดที่ใช้จอง (E.164) — หน้า Checkout เติมให้ */
  phone_e164: string | null;
  /** ถูกระงับการจองเมื่อ (null = ปกติ) */
  banned_at: string | null;
}

/** PATCH /me/profile — ส่งเฉพาะ field ที่แก้ */
export const UpdateProfileBody = z
  .object({
    display_name: z.string().trim().min(1).max(60),
    style_ids: z.array(uuid).max(20),
    district_ids: z.array(uuid).max(20),
    budget_per_person: z.number().min(0).max(1_000_000).nullable(),
    usual_pax: z.number().int().min(1).max(50).nullable(),
    theme: ThemeMode,
    onboarded: z.boolean(),
  })
  .partial();
export type UpdateProfileBody = z.infer<typeof UpdateProfileBody>;

/** POST /me/notifications/read — ไม่ส่ง ids = อ่านทั้งหมด */
export const MarkReadBody = z.object({ ids: z.array(uuid).max(500).nullish() });
export type MarkReadBody = z.infer<typeof MarkReadBody>;

/** POST /me/favorites/:barId/toggle */
export interface ToggleFavoriteResult {
  bar_id: string;
  favorite: boolean;
}

// ----------------------------- Backoffice -----------------------------
/** ประเภทบัญชีที่แอดมินเลือกตอนสร้าง → ชั้นบัญชี + บทบาทในร้าน · ADMIN / SUPER_ADMIN สร้างได้เฉพาะ SUPER_ADMIN */
export const ACCOUNT_TYPES = {
  CUSTOMER: { role: 'CUSTOMER', bar_role: null },
  OWNER: { role: 'MERCHANT', bar_role: 'OWNER' },
  MANAGER: { role: 'MERCHANT', bar_role: 'MANAGER' },
  STAFF: { role: 'STAFF', bar_role: 'STAFF' },
  ADMIN: { role: 'ADMIN', bar_role: null },
  SUPER_ADMIN: { role: 'SUPER_ADMIN', bar_role: null },
} as const satisfies Record<string, { role: UserRole; bar_role: 'OWNER' | 'MANAGER' | 'STAFF' | null }>;
export type AccountType = keyof typeof ACCOUNT_TYPES;
export const AccountType = z.enum(['CUSTOMER', 'OWNER', 'MANAGER', 'STAFF', 'ADMIN', 'SUPER_ADMIN']);

/** ชั้นที่ผู้เรียกเลือกตอนสร้างบัญชีได้ (ADR 0005) */
export const canCreateRole = (actorRole: string | undefined, role: UserRole) =>
  actorRole === 'SUPER_ADMIN' || (role !== 'ADMIN' && role !== 'SUPER_ADMIN');

const isAdult = (d: string) => {
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() - 20);
  return new Date(`${d}T00:00:00Z`) <= limit;
};

/** POST /admin/users */
export const CreateUserBody = z
  .object({
    email: z.string().trim().toLowerCase().max(254).pipe(z.email()).describe('อีเมลที่ใช้เข้าสู่ระบบ'),
    display_name: z.string().trim().min(1).max(60).describe('ชื่อที่แสดง'),
    account_type: AccountType.describe('ลูกค้า / เจ้าของร้าน / ผู้จัดการร้าน / พนักงานร้าน / แอดมิน / ซูเปอร์แอดมิน (2 แบบหลังเฉพาะ SUPER_ADMIN)'),
    bar_id: uuid.nullish().describe('ร้าน — ต้องใส่เมื่อเป็นเจ้าของ / ผู้จัดการ / พนักงานร้าน'),
    birthdate: z.iso.date().refine(isAdult, 'ต้องอายุ 20 ปีขึ้นไป').describe('YYYY-MM-DD · ต้องอายุ 20 ปีขึ้นไป'),
    password: z.string().min(10).max(72).optional().describe('ไม่ใส่ = ระบบสุ่มให้ แล้วตอบกลับครั้งเดียว'),
  })
  .refine((v) => (ACCOUNT_TYPES[v.account_type].bar_role === null) === !v.bar_id, {
    message: 'เจ้าของ / ผู้จัดการ / พนักงานร้าน ต้องเลือกร้าน · ลูกค้า / แอดมิน / ซูเปอร์แอดมิน ห้ามเลือกร้าน',
    path: ['bar_id'],
  });
export type CreateUserBody = z.input<typeof CreateUserBody>;
export interface CreateUserResult {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  bar_id: string | null;
  bar_role: string | null;
  /** เฉพาะเมื่อระบบสุ่มให้ — แสดงครั้งเดียว ไม่ถูกเก็บ */
  password: string | null;
}

/** PATCH /admin/users/:id */
export const UpdateUserAccountBody = z.object({
  email: z
    .email()
    .transform((v) => v.trim().toLowerCase())
    .optional(),
  display_name: z.string().trim().min(1).max(60).optional(),
  phone_e164: z
    .string()
    .trim()
    .regex(/^\+[1-9][0-9]{7,14}$/, 'INVALID_PHONE')
    .nullable()
    .optional(),
  password: z.string().min(10).max(72).optional(),
});
export type UpdateUserAccountBody = z.infer<typeof UpdateUserAccountBody>;

/** PATCH /admin/users/:id/role (SUPER_ADMIN) */
export const SetUserRoleBody = z.object({ role: UserRole.describe('ชั้นบัญชีใหม่ (ตาราง roles)') });
export type SetUserRoleBody = z.infer<typeof SetUserRoleBody>;

/** POST /admin/users/:id/unban */
export const UnbanUserBody = z.object({ reason: z.string().trim().max(300).optional().describe('เหตุผลที่ปลดแบน (บันทึกใน audit log)') });
export type UnbanUserBody = z.infer<typeof UnbanUserBody>;
export interface UnbanUserResult {
  id: string;
  banned: false;
  phones_unbanned: number;
  flags_cleared: number;
}

/** GET /admin/roles */
export interface AccountRoleOption {
  code: UserRole;
  label_th: string;
  sort_order: number;
  can_enter_backoffice: boolean;
  /** ผู้เรียกเลือกชั้นนี้ตอนสร้างบัญชีได้ */
  can_create: boolean;
  /** ผู้เรียกแก้บัญชีอื่นเป็นชั้นนี้ได้ (เฉพาะซูเปอร์แอดมิน) */
  can_assign: boolean;
}

export const ACCOUNT_ERRORS = {
  INVALID_DISPLAY_NAME: 'ชื่อที่แสดงต้องยาว 1–60 ตัวอักษร',
  HAS_ACTIVE_BOOKINGS: 'ยังมีการจองที่ยังไม่จบ — ยกเลิกหรือรอให้จบก่อนลบบัญชี',
  EMAIL_EXISTS: 'อีเมลนี้มีบัญชีอยู่แล้ว — ถ้าชั้นบัญชีผิด ให้ซูเปอร์แอดมินแก้จากรายชื่อผู้ใช้',
  INVALID_ACCOUNT_TYPE: 'ประเภทบัญชีกับร้านไม่ตรงกัน (เจ้าของ/ผู้จัดการ/พนักงานต้องเลือกร้าน)',
  AGE_UNDER_20: 'ผู้ใช้ต้องอายุ 20 ปีขึ้นไป',
  SELF_ONLY: 'แอดมินแก้ไขได้เฉพาะบัญชีของตัวเอง',
  INVALID_ACCOUNT: 'ข้อมูลบัญชีไม่ถูกต้องหรือไม่สามารถเปลี่ยนแปลงได้',
  LAST_SUPER_ADMIN: 'ต้องมีซูเปอร์แอดมินอย่างน้อย 1 คน — ตั้งคนอื่นเป็นซูเปอร์แอดมินก่อน',
} as const satisfies Record<string, string>;
