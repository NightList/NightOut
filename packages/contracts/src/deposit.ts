import { BookingStatus } from '@nightout/types';
import { DEPOSIT_REJECT_CODES } from '@nightout/utils';
import { z } from 'zod';
import { objectPath, text } from './common';

/**
 * โดเมน deposit — ส่งสลิป ตรวจสลิป ปิดยอด คืนมัดจำ สมุดมัดจำของร้าน
 * เงินเข้า PromptPay ของ NightOut · แอดมินเป็นคนตรวจสลิป · ร้านเห็นสถานะเงินแต่ไม่เห็นสลิป
 */

/** POST /bookings/:id/deposit */
export const SubmitDepositBody = z.object({
  slip_path: objectPath.describe('path ใน bucket deposit-slips/<user_id>/…'),
  slip_ref: text(80).nullish().describe('เลขอ้างอิงจากสลิป (กันใช้สลิปซ้ำ)'),
});
export type SubmitDepositBody = z.infer<typeof SubmitDepositBody>;

/** POST /merchant/bookings/:id/refund */
export const RefundDepositBody = z.object({ reason: z.string().trim().min(3).max(300).describe('เหตุผลที่คืนมัดจำ เช่น ไม่มีโต๊ะให้ลูกค้า') });
export type RefundDepositBody = z.infer<typeof RefundDepositBody>;
export interface RefundDepositResult {
  id: string;
  booking_id: string;
  settlement: 'REFUND_PENDING';
  amount: number;
  booking_status: BookingStatus;
}

/** POST /admin/deposits/:id/review */
export const ReviewDepositBody = z
  .object({
    approve: z.boolean(),
    reason_code: z
      .enum(DEPOSIT_REJECT_CODES)
      .optional()
      .describe('เหตุผลที่ปฏิเสธ (ต้องมีเมื่อ approve = false) · FAKE_SLIP = ติดธงลูกค้า ครบ 2 ครั้งแบนบัญชี + เบอร์โทร'),
    reason: z.string().trim().max(500).optional().describe('รายละเอียดเพิ่มเติม (ต้องมีเมื่อ reason_code = OTHER)'),
  })
  .refine((b) => b.approve || b.reason_code, { message: 'REJECT_REASON_REQUIRED', path: ['reason_code'] })
  .refine((b) => b.reason_code !== 'OTHER' || !!b.reason, { message: 'REJECT_REASON_REQUIRED', path: ['reason'] });
export type ReviewDepositBody = z.infer<typeof ReviewDepositBody>;
export interface ReviewDepositResult {
  id: string;
  status: 'VERIFIED' | 'REJECTED';
  reject_code: string | null;
  /** เฉพาะเมื่อปฏิเสธด้วย FAKE_SLIP */
  fake_slip_count?: number;
  banned?: boolean;
}

/** POST /admin/deposits/:id/settle */
export const SettleDepositBody = z.object({ how: z.enum(['PAID_OUT', 'CREDIT', 'REFUNDED']) });
export type SettleDepositBody = z.infer<typeof SettleDepositBody>;

export const DepositStatus = z.enum(['SUBMITTED', 'VERIFIED', 'REJECTED']);
export type DepositStatus = z.infer<typeof DepositStatus>;
export const DepositSettlement = z.enum(['NONE', 'HELD', 'PAYOUT_PENDING', 'PAID_OUT', 'CREDIT', 'REFUND_PENDING', 'REFUNDED']);
export type DepositSettlement = z.infer<typeof DepositSettlement>;

/** GET /merchant/bars/:barId/deposit-ledger (rpc bar_deposit_ledger — ไม่มี path สลิป) */
export interface DepositLedgerRow {
  deposit_id: string;
  booking_id: string;
  booking_code: string;
  booking_datetime: string;
  customer_name: string | null;
  amount: number;
  status: DepositStatus;
  settlement: DepositSettlement;
  verified_at: string | null;
  settled_at: string | null;
  created_at: string;
}

export const DEPOSIT_ERRORS = {
  BOOKING_NOT_AWAITING_DEPOSIT: 'การจองนี้ไม่ต้องส่งสลิปแล้ว',
  NO_DEPOSIT_REQUIRED: 'การจองนี้ไม่ต้องจ่ายมัดจำ',
  INVALID_SLIP_PATH: 'อัปโหลดสลิปไม่สำเร็จ ลองเลือกไฟล์ใหม่',
  SLIP_ALREADY_USED: 'สลิปนี้ถูกใช้ไปแล้ว',
  DEPOSIT_NOT_FOUND: 'ไม่พบรายการมัดจำนี้แล้ว',
  DEPOSIT_ALREADY_REVIEWED: 'สลิปนี้มีคนตรวจไปแล้ว',
  DEPOSIT_NOT_PAYOUT_PENDING: 'รายการนี้ยังไม่ถึงขั้นโอนให้ร้าน',
  DEPOSIT_NOT_REFUND_PENDING: 'รายการนี้ยังไม่ถึงขั้นคืนเงินลูกค้า',
  REJECT_REASON_REQUIRED: 'เลือกเหตุผลที่ปฏิเสธสลิป (ถ้าเลือก "อื่น ๆ" ต้องพิมพ์รายละเอียด)',
  INVALID_REJECT_REASON: 'เหตุผลที่ปฏิเสธสลิปไม่ถูกต้อง',
  REFUND_REASON_REQUIRED: 'ระบุเหตุผลที่คืนมัดจำ (อย่างน้อย 3 ตัวอักษร)',
  REFUND_ALREADY_REQUESTED: 'การจองนี้อนุมัติคืนมัดจำไปแล้ว',
  NO_REFUNDABLE_DEPOSIT: 'ยังไม่มีมัดจำที่คืนได้ (สลิปยังไม่ผ่านการตรวจ หรือโอนให้ร้านไปแล้ว)',
} as const satisfies Record<string, string>;
