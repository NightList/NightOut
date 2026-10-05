/**
 * มัดจำ: ข้อความเงื่อนไขริบมัดจำ (หน้า Checkout) · เหตุผลปฏิเสธสลิป (Backoffice) · เบอร์โทรไทย
 * ใช้ร่วม frontend / admin / backend — DB เก็บข้อความที่ลูกค้าเห็นจริงไว้เป็นหลักฐาน (booking_deposit_consents)
 */

/** เปลี่ยนเนื้อหาเงื่อนไขเมื่อไหร่ ให้ขึ้นเวอร์ชันใหม่ (หลักฐานเก่าอ้างเวอร์ชันเดิม) */
export const DEPOSIT_TERMS_VERSION = 'deposit-v1';

export interface DepositTermsInput {
  /** ยอดมัดจำของการจองนี้ (บาท) */
  amount: number;
  /** ยกเลิกล่วงหน้ากี่ชั่วโมงถึงได้เงินคืน (bar_booking_settings.refund_before_hours) */
  refundBeforeHours: number;
  /** มาสายได้กี่นาทีก่อนถือว่าไม่มา (grace_minutes) */
  graceMinutes: number;
  /** เงื่อนไขที่ร้านเขียนเอง */
  barPolicy?: string | null;
}

const baht = (n: number) => `฿${n.toLocaleString('th-TH', { maximumFractionDigits: 2 })}`;

/** ข้อ ๆ ของเงื่อนไข (หน้าเว็บแสดงเป็นรายการ) */
export function depositTermsLines({ amount, refundBeforeHours, graceMinutes, barPolicy }: DepositTermsInput): string[] {
  const lines = [
    refundBeforeHours > 0
      ? `ยกเลิกล่วงหน้าอย่างน้อย ${refundBeforeHours} ชั่วโมงก่อนเวลาจอง ได้รับมัดจำคืนเต็มจำนวน`
      : 'ยกเลิกก่อนถึงเวลาจอง ได้รับมัดจำคืนเต็มจำนวน',
    refundBeforeHours > 0
      ? `ยกเลิกภายใน ${refundBeforeHours} ชั่วโมงก่อนเวลาจอง หรือไม่มาถึงร้านภายใน ${graceMinutes} นาทีหลังเวลาจอง มัดจำ ${baht(amount)} จะถูกริบและโอนให้ร้าน`
      : `ไม่มาถึงร้านภายใน ${graceMinutes} นาทีหลังเวลาจอง มัดจำ ${baht(amount)} จะถูกริบและโอนให้ร้าน`,
    'ถ้าร้านยกเลิกหรือไม่มีโต๊ะให้ ได้รับมัดจำคืนเต็มจำนวน',
  ];
  const policy = barPolicy?.trim();
  if (policy) lines.push(`เงื่อนไขของร้าน: ${policy}`);
  return lines;
}

/** ข้อความเต็มที่ลูกค้ายอมรับ (ส่งไปเก็บเป็นหลักฐาน — ต้องตรงกับที่แสดงข้าง checkbox) */
export function depositTermsText(input: DepositTermsInput): string {
  return [
    `ฉันได้อ่านและยอมรับเงื่อนไขมัดจำ ${baht(input.amount)} ของการจองนี้`,
    ...depositTermsLines(input).map((l, i) => `${i + 1}. ${l}`),
  ].join('\n');
}

/** เหตุผลที่แอดมินปฏิเสธสลิป — ตรงกับ deposit_reject_label() ใน DB */
export const DEPOSIT_REJECT_REASONS = [
  { code: 'FAKE_SLIP', label: 'สลิปปลอม / ตัดต่อ', hint: 'ติดธงที่ลูกค้า · ครบ 2 ครั้ง แบนบัญชีและเบอร์โทร' },
  { code: 'AMOUNT_MISMATCH', label: 'ยอดเงินไม่ตรงกับมัดจำ' },
  { code: 'WRONG_ACCOUNT', label: 'โอนผิดบัญชี' },
  { code: 'UNREADABLE', label: 'สลิปไม่ชัด / อ่านไม่ได้' },
  { code: 'DUPLICATE', label: 'สลิปนี้เคยใช้แล้ว' },
  { code: 'OTHER', label: 'อื่น ๆ (ระบุ)' },
] as const satisfies readonly { code: string; label: string; hint?: string }[];
export type DepositRejectCode = (typeof DEPOSIT_REJECT_REASONS)[number]['code'];
export const DEPOSIT_REJECT_CODES = DEPOSIT_REJECT_REASONS.map((r) => r.code) as [DepositRejectCode, ...DepositRejectCode[]];

/**
 * เบอร์ไทย → E.164 (+66…) · รับ 081-234-5678 / 0812345678 / +66812345678 / 66812345678
 * มือถือ 0[6-9] + 8 หลัก · บ้าน 0[2-7] + 7 หลัก · ไม่ถูกต้อง → null
 */
export function toThaiE164(input: string | null | undefined): string | null {
  if (!input) return null;
  let d = input.replace(/[\s\-().]/g, '');
  if (d.startsWith('+66')) d = `0${d.slice(3)}`;
  else if (/^66\d{8,9}$/.test(d)) d = `0${d.slice(2)}`;
  if (/^0[6-9]\d{8}$/.test(d) || /^0[2-7]\d{7}$/.test(d)) return `+66${d.slice(1)}`;
  return null;
}

/** +66812345678 → 081-234-5678 (เบอร์ต่างประเทศคืนตามเดิม) */
export function formatThaiPhone(e164: string | null | undefined): string {
  if (!e164) return '';
  if (!e164.startsWith('+66')) return e164;
  const d = `0${e164.slice(3)}`;
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
}
