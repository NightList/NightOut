import { z } from 'zod';

/**
 * ชิ้นส่วน zod ที่ทุกโดเมนใช้ร่วม — key ของ API เป็น snake_case เสมอ
 * ไฟล์โดเมน (booking.ts, deposit.ts …) ประกอบจากตัวนี้
 */
export const uuid = z.uuid();
export const text = (max: number) => z.string().trim().max(max);
export const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'รูปแบบเวลา HH:MM');
export const isoDatetime = z.iso.datetime({ offset: true });
/** path ใน Storage bucket — ห้าม .. / ขึ้นต้นด้วย / (โฟลเดอร์แรกต้องเป็นเจ้าของ ตาม policy) */
export const objectPath = z
  .string()
  .min(3)
  .max(300)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._\-/]*$/)
  .refine((p) => !p.includes('..') && !p.includes('//'), 'invalid path');

/** body อนุมัติ/ปฏิเสธ + เหตุผล (ใช้กับโปรโมท, โปรของร้าน) */
export const ApproveBody = z.object({ approve: z.boolean(), reason: z.string().trim().min(1).max(500).optional() });
export type ApproveBody = z.infer<typeof ApproveBody>;

/** รหัส error ที่ไม่ผูกกับโดเมนไหน (auth / ระบบ) */
export const COMMON_ERRORS = {
  USER_NOT_FOUND: 'ไม่พบบัญชีผู้ใช้ (อาจถูกลบไปแล้ว) ลองออกจากระบบแล้วเข้าใหม่',
  NOT_ADMIN: 'บัญชีนี้ไม่มีสิทธิ์แอดมิน',
  MFA_REQUIRED: 'ต้องยืนยันรหัส 6 หลักจากแอป Authenticator ใหม่อีกครั้ง',
  SUPER_ADMIN_REQUIRED: 'เฉพาะซูเปอร์แอดมิน — แอดมินสร้างได้แค่บัญชีลูกค้า ร้านค้า และพนักงาน และแก้ชั้นบัญชีไม่ได้',
  PAYOUT_ENCRYPTION_KEY: 'หลังบ้านยังไม่ได้ตั้ง PAYOUT_ENCRYPTION_KEY',
  // เซิร์ฟเวอร์คุยกับ Supabase ไม่ได้ (ดูสาเหตุเต็มใน log ของ Vercel หรือ GET /api/health?deep=1)
  SUPABASE_URL_NOT_CONFIGURED: 'เซิร์ฟเวอร์ยังไม่ได้ตั้ง SUPABASE_URL — ใส่ใน Environment Variables ของ deploy แล้ว Redeploy',
  SUPABASE_UNREACHABLE: 'เซิร์ฟเวอร์ติดต่อฐานข้อมูล (Supabase) ไม่ได้ ลองใหม่อีกครั้ง',
  SUPABASE_BAD_RESPONSE: 'ฐานข้อมูล (Supabase) ตอบกลับผิดปกติ — อาจถูกพักหรือเกินโควตา ลองใหม่อีกครั้ง',
} as const satisfies Record<string, string>;
