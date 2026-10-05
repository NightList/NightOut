import { BookingStatus } from '@nightout/types';
import { DEPOSIT_TERMS_VERSION, toThaiE164 } from '@nightout/utils';
import { z } from 'zod';
import { isoDatetime, text, uuid } from './common';

/**
 * โดเมน booking — จองโต๊ะ ยกเลิก เปลี่ยนสถานะ เช็กอิน ย้ายโต๊ะ โซนว่าง บัตรแชร์
 * backend: apps/backend/src/domains/booking · frontend: services/api/booking.ts
 */

// ----------------------------- ลูกค้า -----------------------------
export const DepositTermsBody = z.object({
  accepted: z.literal(true).describe('ลูกค้าติ๊กยอมรับเงื่อนไขริบมัดจำแล้ว'),
  terms_version: z.string().trim().min(1).max(40).describe(`เวอร์ชันของข้อความเงื่อนไข (ปัจจุบัน ${DEPOSIT_TERMS_VERSION})`),
  terms_text: z.string().trim().min(20).max(4000).describe('ข้อความเงื่อนไขที่แสดงข้าง checkbox (เก็บเป็นหลักฐาน)'),
});

/** POST /bookings */
export const CreateBookingBody = z.object({
  bar_id: uuid,
  zone_id: uuid,
  datetime: isoDatetime,
  pax: z.number().int().min(1).max(50),
  promotion_id: uuid.nullish(),
  note: text(200).nullish(),
  contact_phone: z
    .string()
    .max(20)
    .transform((v, ctx) => {
      const e164 = toThaiE164(v);
      if (!e164) ctx.addIssue({ code: 'custom', message: 'INVALID_PHONE' });
      return e164 ?? v;
    })
    .describe('เบอร์โทรที่ติดต่อได้ (เบอร์ไทย เช่น 081-234-5678) — เก็บเป็น E.164 · เบอร์ที่โดนแบนจองไม่ได้'),
  deposit_terms: DepositTermsBody.nullish().describe('ต้องส่งเมื่อการจองมีมัดจำ (ทุกร้านเก็บมัดจำ) — ไม่ส่ง = DEPOSIT_TERMS_REQUIRED'),
});
export type CreateBookingBody = z.input<typeof CreateBookingBody>;

export const CreateBookingResult = z.object({
  id: uuid,
  code: z.string(),
  status: BookingStatus,
  deposit_required: z.number(),
});
export type CreateBookingResult = z.infer<typeof CreateBookingResult>;

/** POST /bookings/:id/cancel */
export const CancelBookingBody = z.object({ reason: text(200).nullish() });
export type CancelBookingBody = z.infer<typeof CancelBookingBody>;

// ----------------------------- ร้าน -----------------------------
/** POST /merchant/bookings/:id/status */
export const TeamBookingStatusBody = z.object({
  to: z.enum(['CONFIRMED', 'REJECTED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED_BY_MERCHANT']),
  reason: text(200).nullish(),
});
export type TeamBookingStatusBody = z.infer<typeof TeamBookingStatusBody>;

/** POST /merchant/bookings/:id/move */
export const MoveBookingBody = z.object({
  zone_id: uuid.describe('โซนปลายทาง'),
  table_id: uuid.nullish().describe('โต๊ะปลายทาง (null = ไม่ระบุโต๊ะ ใช้ได้เฉพาะโซนที่ไม่มีโต๊ะ/เปิดจองแบบไม่ระบุโต๊ะ)'),
  reason: text(200).nullish().describe('เหตุผล (บันทึกใน audit log)'),
});
export type MoveBookingBody = z.infer<typeof MoveBookingBody>;
export interface MoveBookingResult {
  id: string;
  zone_id: string;
  zone_name: string;
  table_id: string | null;
  table_name: string | null;
}

/** POST /merchant/bars/:barId/check-in */
export const CheckInBody = z.object({ code: z.string().trim().min(3).max(120).describe('รหัสจอง NL-XXXXXX หรือข้อความจาก QR') });
export type CheckInBody = z.infer<typeof CheckInBody>;
export interface CheckInResult {
  id: string;
  code: string;
  pax: number;
  zone_name: string | null;
  customer_name: string | null;
}

/** GET merchant/bars/:barId/bookings/:id/table-options */
export interface TableOption {
  zone_id: string;
  zone_name: string;
  table_id: string | null;
  table_name: string | null;
  seats: number | null;
  available: boolean;
  is_current: boolean;
  zone_remaining_pax: number;
}

// ----------------------------- สาธารณะ -----------------------------
/** GET /bars/:barId/zone-availability?datetime= */
export const ZoneAvailabilityQuery = z.object({ datetime: isoDatetime.describe('เวลาที่จะจอง (ISO 8601 มี timezone)') });
export type ZoneAvailabilityQuery = z.infer<typeof ZoneAvailabilityQuery>;
export interface ZoneAvailabilityRow {
  zone_id: string;
  zone_name: string;
  capacity_pax: number;
  remaining_pax: number;
  free_tables: number;
  total_tables: number;
  full: boolean;
}

/** GET /share-cards/:token */
export interface ShareCard {
  booking_datetime: string;
  pax: number;
  status: string;
  zone_name: string;
  bar_name: string;
  bar_slug: string;
  address: string;
  lat: number;
  lng: number;
  host_first_name: string;
  going_count: number;
}

export const BOOKING_ERRORS = {
  BAR_NOT_FOUND: 'ไม่พบร้านนี้ หรือร้านยังไม่เปิดให้จอง',
  ZONE_NOT_FOUND: 'ไม่พบโซนนี้',
  ZONE_FULL: 'โซนนี้เต็มแล้วในช่วงเวลานั้น ลองเลือกโซนหรือเวลาอื่น',
  PAX_OUT_OF_RANGE: 'จำนวนคนเกินที่ร้านรับต่อการจอง',
  BOOKING_TOO_SOON: 'ต้องจองล่วงหน้ามากกว่านี้ ลองเลือกเวลาที่ช้าลง',
  BOOKING_TOO_FAR: 'จองล่วงหน้าไกลเกินที่ร้านเปิดรับ',
  PROMOTION_NOT_AVAILABLE: 'โปรโมชันนี้ใช้กับวัน/เวลาที่เลือกไม่ได้',
  BOOKING_NOT_FOUND: 'ไม่พบการจองนี้',
  INVALID_BOOKING_TRANSITION: 'เปลี่ยนสถานะการจองนี้ไม่ได้แล้ว (สถานะอาจเปลี่ยนไปแล้ว ลองรีเฟรช)',
  BOOKING_NOT_CONFIRMED: 'การจองนี้ยังไม่ได้ยืนยัน หรือเช็กอินไปแล้ว',
  CONTACT_PHONE_REQUIRED: 'กรอกเบอร์โทรที่ร้านติดต่อได้',
  INVALID_PHONE: 'เบอร์โทรไม่ถูกต้อง (เช่น 081-234-5678)',
  DEPOSIT_TERMS_REQUIRED: 'กรุณาติ๊กยอมรับเงื่อนไขมัดจำก่อนจอง',
  ACCOUNT_BANNED: 'บัญชีนี้ถูกระงับการจอง เพราะตรวจพบสลิปไม่ถูกต้องซ้ำ — ติดต่อ NightOut หากคิดว่าเป็นความผิดพลาด',
  PHONE_BANNED: 'เบอร์โทรนี้ถูกระงับการจอง — ติดต่อ NightOut หากคิดว่าเป็นความผิดพลาด',
  BOOKING_NOT_MOVABLE: 'ย้ายโต๊ะได้เฉพาะการจองที่ยังไม่จบ (ยังไม่ปิดโต๊ะ/ยกเลิก)',
  TABLE_NOT_FOUND: 'ไม่พบโต๊ะนี้ในโซนที่เลือก',
  TABLE_REQUIRED: 'โซนนี้ต้องเลือกโต๊ะ',
  TABLE_TAKEN: 'โต๊ะนี้มีการจองอื่นในช่วงเวลาเดียวกัน — เลือกโต๊ะอื่น',
  BOOKING_SAME_TABLE: 'การจองนี้อยู่ที่โต๊ะนี้อยู่แล้ว',
} as const satisfies Record<string, string>;
