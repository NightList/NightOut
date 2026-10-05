import { createZodDto } from 'nestjs-zod';
import { DEPOSIT_REJECT_CODES } from '@nightout/utils';
import { z } from 'zod';

const reason = z.string().trim().min(1).max(500).optional();

export class SetBarStatusDto extends createZodDto(
  z.object({ status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED']), reason }),
) {}
export class SetEditorPickDto extends createZodDto(z.object({ value: z.boolean() })) {}
export class ReviewDto extends createZodDto(z.object({ approve: z.boolean(), reason })) {}
export class ReviewDepositDto extends createZodDto(
  z
    .object({
      approve: z.boolean(),
      reason_code: z
        .enum(DEPOSIT_REJECT_CODES)
        .optional()
        .describe('เหตุผลที่ปฏิเสธ (ต้องมีเมื่อ approve = false) · FAKE_SLIP = ติดธงลูกค้า ครบ 2 ครั้งแบนบัญชี + เบอร์โทร'),
      reason: z.string().trim().max(500).optional().describe('รายละเอียดเพิ่มเติม (ต้องมีเมื่อ reason_code = OTHER)'),
    })
    .refine((b) => b.approve || b.reason_code, { message: 'REJECT_REASON_REQUIRED', path: ['reason_code'] })
    .refine((b) => b.reason_code !== 'OTHER' || !!b.reason, { message: 'REJECT_REASON_REQUIRED', path: ['reason'] }),
) {}
export class UnbanUserDto extends createZodDto(
  z.object({ reason: z.string().trim().max(300).optional().describe('เหตุผลที่ปลดแบน (บันทึกใน audit log)') }),
) {}
export class SettleDepositDto extends createZodDto(z.object({ how: z.enum(['PAID_OUT', 'CREDIT', 'REFUNDED']) })) {}
export class ModerateReviewDto extends createZodDto(
  z.object({ action: z.enum(['KEEP', 'HIDE', 'REMOVE', 'RESTORE']), reason }),
) {}
export class SetUserRoleDto extends createZodDto(
  z.object({ role: z.enum(['CUSTOMER', 'MERCHANT', 'STAFF', 'ADMIN']) }),
) {}

// ----------------------------- ทีมงานหน้า /about -----------------------------
const https = z.url().startsWith('https://').max(300);
/** ช่องทางติดต่อ — ว่าง = ไม่แสดงไอคอนนั้น (DB เก็บเฉพาะ key เหล่านี้) */
const TeamContacts = z
  .object({
    facebook: https.describe('URL เต็ม (https://)'),
    instagram: https,
    tiktok: https,
    github: https,
    linkedin: https,
    line: z.string().trim().max(120).describe('LINE ID หรือ URL'),
    email: z.email().max(120),
    phone: z.string().trim().regex(/^[0-9+\-\s()]{6,20}$/, 'เบอร์โทรไม่ถูกต้อง'),
  })
  .partial();

export const TeamMemberBody = z.object({
  nickname: z.string().trim().min(1).max(40).describe('ชื่อที่แสดงบนการ์ด เช่น "แสน"'),
  full_name: z.string().trim().max(80).nullish().describe('ชื่อจริง (แสดงในแผงโปรไฟล์)'),
  roles: z.array(z.string().trim().min(1).max(40)).max(6).default([]).describe('ตำแหน่ง · ตัวแรก = ตำแหน่งหลัก'),
  bio: z.string().trim().max(1000).nullish().describe('แนะนำตัว'),
  skills: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  photo_url: z
    .string()
    .trim()
    .max(500)
    // http:// ไว้สำหรับ Supabase ในเครื่อง (http://127.0.0.1:54321) · javascript:/data: ไม่ผ่าน
    .regex(/^(https?:\/\/|\/)/, 'ต้องเป็น URL http(s):// หรือ path ที่ขึ้นต้นด้วย /')
    .nullish()
    .describe('URL รูป (team-photos) หรือ path ใน public/ เช่น /images/teams/san.webp'),
  contacts: TeamContacts.default({}),
  active: z.boolean().default(true).describe('false = ซ่อนจากหน้าเกี่ยวกับเรา'),
});

export class CreateTeamMemberDto extends createZodDto(TeamMemberBody) {}
/** แก้บางส่วน — ส่งเฉพาะ field ที่ต้องการแก้ (ไม่มีค่าเริ่มต้น จะได้ไม่ทับของเดิม) */
export class UpdateTeamMemberDto extends createZodDto(
  TeamMemberBody.extend({
    roles: z.array(z.string().trim().min(1).max(40)).max(6),
    skills: z.array(z.string().trim().min(1).max(40)).max(20),
    contacts: TeamContacts,
    active: z.boolean(),
  }).partial(),
) {}
export class ReorderTeamDto extends createZodDto(
  z.object({ ids: z.array(z.uuid()).min(1).max(200).describe('id ทีมงานเรียงจากบนลงล่าง') }),
) {}

// ----------------------------- เพิ่มผู้ใช้ -----------------------------
/** ประเภทบัญชีที่แอดมินเลือก → role ของระบบ + บทบาทในร้าน */
export const ACCOUNT_TYPES = {
  CUSTOMER: { role: 'CUSTOMER', bar_role: null },
  ADMIN: { role: 'ADMIN', bar_role: null },
  OWNER: { role: 'MERCHANT', bar_role: 'OWNER' },
  MANAGER: { role: 'MERCHANT', bar_role: 'MANAGER' },
  STAFF: { role: 'STAFF', bar_role: 'STAFF' },
} as const;
export type AccountType = keyof typeof ACCOUNT_TYPES;

const isAdult = (d: string) => {
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() - 20);
  return new Date(`${d}T00:00:00Z`) <= limit;
};

export const CreateUserBody = z
  .object({
    email: z.string().trim().toLowerCase().max(254).pipe(z.email()).describe('อีเมลที่ใช้เข้าสู่ระบบ'),
    display_name: z.string().trim().min(1).max(60).describe('ชื่อที่แสดง'),
    account_type: z.enum(['CUSTOMER', 'ADMIN', 'OWNER', 'MANAGER', 'STAFF']).describe('ลูกค้า / แอดมิน / เจ้าของร้าน / ผู้จัดการร้าน / พนักงานร้าน'),
    bar_id: z.uuid().nullish().describe('ร้าน — ต้องใส่เมื่อเป็นเจ้าของ / ผู้จัดการ / พนักงานร้าน'),
    birthdate: z.iso.date().refine(isAdult, 'ต้องอายุ 20 ปีขึ้นไป').describe('YYYY-MM-DD · ต้องอายุ 20 ปีขึ้นไป'),
    password: z.string().min(10).max(72).optional().describe('ไม่ใส่ = ระบบสุ่มให้ แล้วตอบกลับครั้งเดียว'),
  })
  .refine((v) => (ACCOUNT_TYPES[v.account_type].bar_role === null) === !v.bar_id, {
    message: 'เจ้าของ / ผู้จัดการ / พนักงานร้าน ต้องเลือกร้าน · ลูกค้า / แอดมิน ห้ามเลือกร้าน',
    path: ['bar_id'],
  });
export class CreateUserDto extends createZodDto(CreateUserBody) {}
