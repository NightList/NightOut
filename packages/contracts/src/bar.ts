import { BarCategory, BarStatus, CrowdStatus } from '@nightout/types';
import { z } from 'zod';
import { hhmm, objectPath, text, uuid } from './common';

/**
 * โดเมน bar — ข้อมูลร้าน เมนู โปรของร้าน ค่าธรรมเนียม โซน/โต๊ะ ความปลอดภัย ตั้งค่าการจอง บัญชีรับเงิน ความแน่น
 * สมัครลงร้าน (ลูกค้า) · อนุมัติ/ระงับ/ยืนยัน Safety/ตรวจโปรของร้าน (แอดมิน)
 */

// ----------------------------- ลูกค้า -----------------------------
/** POST /merchant/join */
export const MerchantJoinBody = z.object({
  name: z.string().trim().min(1).max(80),
  category: BarCategory,
  district_id: uuid.nullish(),
  address: z.string().trim().min(3).max(300),
  license: text(100).nullish(),
});
export type MerchantJoinBody = z.infer<typeof MerchantJoinBody>;
export interface MerchantJoinResult {
  id: string;
  slug: string;
  status: 'PENDING_REVIEW';
}

// ----------------------------- ทีมร้าน -----------------------------
export const BarLinkType = z.enum(['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'LINE_OA', 'WEBSITE', 'REVIEW_CLIP']);

/** PATCH /merchant/bars/:barId/info — ส่งเฉพาะ field ที่แก้ */
export const BarInfoBody = z
  .object({
    name: z.string().trim().min(1).max(80),
    description: z.string().trim().max(400).nullable(),
    address: z.string().trim().min(3).max(300),
    phone: z.string().trim().max(30).nullable(),
    district_id: uuid.nullable(),
    style_keys: z.array(z.string().max(40)).max(20),
    hours: z
      .array(
        z.object({
          day_of_week: z.number().int().min(0).max(6),
          open_time: hhmm.nullable(),
          close_time: hhmm.nullable(),
          is_closed: z.boolean(),
        }),
      )
      .max(7),
    links: z.array(z.object({ type: BarLinkType, url: z.url().startsWith('https://') })).max(10),
  })
  .partial();
export type BarInfoBody = z.infer<typeof BarInfoBody>;

/** PUT /merchant/bars/:barId/menu — แทนที่ทั้งหมด */
export const MenuBody = z.object({
  items: z
    .array(
      z.object({
        id: z.string().max(80).nullish(),
        category: z.string().trim().max(40),
        name: z.string().trim().min(1).max(80),
        price: z.number().min(0).max(1_000_000),
        available: z.boolean(),
        image_path: objectPath.nullish().describe('รูปเมนูใน bucket bar-media/<bar_id>/menu/… · ไม่ส่ง = คงรูปเดิม · null = ลบรูป'),
      }),
    )
    .max(500),
});
export type MenuBody = z.infer<typeof MenuBody>;

/** รูปแกลเลอรีร้านได้สูงสุดกี่รูป (DB ตรวจซ้ำใน bar_media_save) */
export const BAR_GALLERY_MAX = 10;

/** PUT /merchant/bars/:barId/media · PUT /admin/bars/:id/media — แกลเลอรีทั้งชุดตามลำดับ + รูปปก (ต้องอยู่ในแกลเลอรี) */
export const BarMediaBody = z
  .object({
    paths: z
      .array(objectPath)
      .max(BAR_GALLERY_MAX)
      .refine((p) => new Set(p).size === p.length, 'รูปซ้ำกัน')
      .describe('path ใน bucket bar-media/<bar_id>/gallery/… เรียงตามที่แสดง'),
    cover_path: objectPath.nullable().describe('รูปปก — ต้องเป็นหนึ่งใน paths · null = ไม่มีปก (ใช้รูปแทน)'),
  })
  .refine((b) => b.cover_path === null || b.paths.includes(b.cover_path), { message: 'รูปปกต้องอยู่ในแกลเลอรี', path: ['cover_path'] });
export type BarMediaBody = z.infer<typeof BarMediaBody>;
export interface BarMediaResult {
  bar_id: string;
  count: number;
  cover_image_url: string | null;
  paths: string[];
}

/** PUT /admin/menu-items/:id/image — ตั้ง/ลบรูปเมนู 1 รายการแทนร้าน */
export const MenuItemImageBody = z.object({ path: objectPath.nullable().describe('path ใน bar-media/<bar_id>/menu/… · null = ลบรูป') });
export type MenuItemImageBody = z.infer<typeof MenuItemImageBody>;
export interface MenuItemImageResult {
  id: string;
  bar_id: string;
  image_path: string | null;
}

/** PUT /merchant/bars/:barId/promotions — แทนที่ทั้งหมด (โปรใหม่/แก้ข้อความ → รอแอดมินตรวจ) */
export const BarPromotionsBody = z.object({
  items: z
    .array(
      z.object({
        id: z.string().max(80).nullish(),
        title: z.string().trim().min(1).max(60),
        description: z.string().trim().max(160).nullish(),
        cutoff_time: hhmm.nullish(),
        days: z.array(z.number().int().min(0).max(6)).max(7).nullish(),
        active: z.boolean(),
      }),
    )
    .max(30),
});
export type BarPromotionsBody = z.infer<typeof BarPromotionsBody>;
export interface BarPromotionsResult {
  bar_id: string;
  count: number;
  pending: number;
}

/** PUT /merchant/bars/:barId/fees */
export const FeesBody = z.object({
  service_charge: z.number().min(0).max(30).describe('%'),
  vat: z.number().min(0).max(10).describe('%'),
  other: z.number().min(0).max(100_000).describe('บาทต่อบิล'),
});
export type FeesBody = z.infer<typeof FeesBody>;

/** PUT /merchant/bars/:barId/zones — แทนที่ทั้งหมด */
export const ZonesBody = z.object({
  zones: z
    .array(
      z.object({
        id: z.string().max(80).nullish(),
        name: z.string().trim().min(1).max(60),
        capacity_pax: z.number().int().min(1).max(2000),
        default_duration_minutes: z.number().int().min(30).max(720),
        tables: z
          .array(z.object({ id: z.string().max(80).nullish(), name: z.string().trim().min(1).max(30), seats: z.number().int().min(1).max(50) }))
          .max(200),
      }),
    )
    .max(30),
});
export type ZonesBody = z.infer<typeof ZonesBody>;

export const SafetyValue = z.enum(['YES', 'NO', 'UNKNOWN']);
export type SafetyValue = z.infer<typeof SafetyValue>;
/** PUT /merchant/bars/:barId/safety/:key */
export const SafetyBody = z.object({ value: SafetyValue });
export type SafetyBody = z.infer<typeof SafetyBody>;
/** PUT /merchant/bars/:barId/safety/:key/evidence */
export const EvidenceBody = z.object({ path: objectPath.describe('path ใน bucket bar-verifications/<bar_id>/…') });
export type EvidenceBody = z.infer<typeof EvidenceBody>;

/** PATCH /merchant/bars/:barId/booking-settings — ส่งเฉพาะ field ที่แก้ */
export const BookingSettingsBody = z
  .object({
    deposit_amount: z.number().min(0).max(100_000),
    deposit_unit: z.enum(['PER_TABLE', 'PER_PERSON']),
    deposit_policy: z.string().trim().max(500),
    grace_minutes: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60), z.literal(90)]),
    pr_male: z.number().int().min(0).max(99),
    pr_female: z.number().int().min(0).max(99),
    pr_lgbtq: z.number().int().min(0).max(99),
  })
  .partial();
export type BookingSettingsBody = z.infer<typeof BookingSettingsBody>;

/** PUT /merchant/bars/:barId/payout-account — เลขบัญชีถูกเข้ารหัสที่ API ก่อนลง DB */
export const PayoutAccountBody = z.object({
  bank_code: z.string().trim().min(2).max(40),
  account_name: z.string().trim().min(1).max(120),
  account_no: z.string().regex(/^\d{10,15}$/, 'เลขบัญชี 10–15 หลัก'),
});
export type PayoutAccountBody = z.infer<typeof PayoutAccountBody>;

/** POST /merchant/bars/:barId/crowd */
export const CrowdBody = z.object({ status: CrowdStatus });
export type CrowdBody = z.infer<typeof CrowdBody>;

// ----------------------------- แอดมิน -----------------------------
/** PATCH /admin/bars/:id/status */
export const SetBarStatusBody = z.object({ status: BarStatus, reason: z.string().trim().min(1).max(500).optional() });
export type SetBarStatusBody = z.infer<typeof SetBarStatusBody>;
export const BAR_ERRORS = {
  NOT_BAR_MEMBER: 'บัญชีนี้ไม่ได้อยู่ในทีมของร้านนี้',
  NOT_BAR_MANAGER: 'เฉพาะเจ้าของหรือผู้จัดการร้านเท่านั้น',
  NOT_BAR_OWNER: 'เฉพาะเจ้าของร้านเท่านั้น',
  INVALID_LINK: 'ลิงก์โซเชียลไม่ตรงกับแพลตฟอร์ม (ต้องขึ้นต้นด้วย https://)',
  INVALID_PROMOTION: 'ชื่อโปรต้องยาว 1–60 ตัวอักษร',
  INVALID_FEES: 'ค่าธรรมเนียมไม่ถูกต้อง',
  INVALID_PAYOUT_ACCOUNT: 'ข้อมูลบัญชีไม่ครบ',
  APPLICATION_PENDING: 'คุณมีร้านที่รอตรวจอยู่แล้ว',
  INVALID_BAR_INFO: 'กรอกชื่อร้านและที่อยู่ให้ครบ',
  SAFETY_FEATURE_NOT_FOUND: 'ไม่พบมาตรการนี้',
  INVALID_EVIDENCE_PATH: 'อัปโหลดหลักฐานไม่สำเร็จ',
  INVALID_MENU_ITEM: 'กรอกชื่อรายการและราคา (ไม่ติดลบ) ให้ครบ',
  INVALID_MENU_IMAGE: 'รูปเมนูไม่ถูกต้องหรืออัปโหลดไม่สำเร็จ — ลองอัปโหลดใหม่',
  INVALID_BAR_MEDIA: `รูปร้านไม่ถูกต้อง (สูงสุด ${BAR_GALLERY_MAX} รูป · รูปปกต้องอยู่ในแกลเลอรี) — ลองอัปโหลดใหม่`,
  MENU_ITEM_NOT_FOUND: 'ไม่พบรายการเมนูนี้ (อาจถูกลบไปแล้ว)',
} as const satisfies Record<string, string>;
