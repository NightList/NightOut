import { ACCOUNT_ERRORS } from './account';
import { BAR_ERRORS } from './bar';
import { BAR_TEAM_ERRORS } from './bar-team';
import { BOOKING_ERRORS } from './booking';
import { COMMON_ERRORS } from './common';
import { DEPOSIT_ERRORS } from './deposit';
import { PROMOTION_ERRORS } from './promotion';
import { REVIEW_ERRORS } from './review';
import { SITE_TEAM_ERRORS } from './site-team';
import { SITE_CONTENT_ERRORS } from './site-content';

/**
 * ข้อความภาษาไทยของรหัส error ทุกโดเมน (รหัสมาจากฟังก์ชันใน DB / NestJS)
 * backend ใส่ข้อความใน err_msg ของทุกคำตอบ (errorMessageOf) · หน้าเว็บส่งให้ Rest.configure({ errorMessages }) ไว้ใช้สำรอง
 * รหัสใหม่ → เพิ่มใน *_ERRORS ของโดเมนนั้น ไม่ใช่ที่นี่
 */
export const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  ...COMMON_ERRORS,
  ...BOOKING_ERRORS,
  ...DEPOSIT_ERRORS,
  ...REVIEW_ERRORS,
  ...BAR_ERRORS,
  ...BAR_TEAM_ERRORS,
  ...ACCOUNT_ERRORS,
  ...PROMOTION_ERRORS,
  ...SITE_TEAM_ERRORS,
  ...SITE_CONTENT_ERRORS,
};
export type ErrorCode = keyof typeof ERROR_MESSAGES;

/** ข้อความไทยของรหัส — ตรงตัวก่อน แล้วค่อยหารหัสที่อยู่ในข้อความ (เช่น "SUPABASE_UNREACHABLE: timeout") · ไม่รู้จัก = คืนรหัสเดิม */
export function errorMessageOf(code: string): string {
  return ERROR_MESSAGES[code] ?? Object.entries(ERROR_MESSAGES).find(([k]) => code.includes(k))?.[1] ?? code;
}
