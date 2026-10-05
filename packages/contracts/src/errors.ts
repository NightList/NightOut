import { ACCOUNT_ERRORS } from './account';
import { BAR_ERRORS } from './bar';
import { BAR_TEAM_ERRORS } from './bar-team';
import { BOOKING_ERRORS } from './booking';
import { COMMON_ERRORS } from './common';
import { DEPOSIT_ERRORS } from './deposit';
import { PROMOTION_ERRORS } from './promotion';
import { REVIEW_ERRORS } from './review';
import { SITE_TEAM_ERRORS } from './site-team';

/**
 * ข้อความภาษาไทยของรหัส error ทุกโดเมน (รหัสมาจากฟังก์ชันใน DB / NestJS)
 * ส่งให้ Rest.configure({ errorMessages: ERROR_MESSAGES }) ใน main.tsx ของแต่ละแอป
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
};
export type ErrorCode = keyof typeof ERROR_MESSAGES;
