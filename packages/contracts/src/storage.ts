import { z } from 'zod';
import { objectPath } from './common';

/** โดเมน storage — ขอ URL อัปโหลด / URL ชั่วคราวของไฟล์ (สิทธิ์จริงตัดสินโดย Storage policy ของแต่ละ bucket) */

/** bucket ที่หน้าเว็บอัปโหลด/ขอ URL ได้ */
export const UPLOAD_BUCKETS = ['deposit-slips', 'review-media', 'promo-slips', 'bar-verifications', 'team-photos', 'site-media'] as const;
export const UploadBucket = z.enum(UPLOAD_BUCKETS);
export type UploadBucket = z.infer<typeof UploadBucket>;
/** bucket ที่เป็น public — ตอบ public_url กลับไปด้วย */
export const PUBLIC_BUCKETS: readonly UploadBucket[] = ['team-photos', 'site-media'];

/** POST /storage/signed-urls */
export const SignedUrlsBody = z.object({
  bucket: UploadBucket,
  paths: z.array(objectPath).min(1).max(500).describe('path ของไฟล์ใน bucket'),
  expires_in: z.number().int().min(60).max(24 * 3600).default(6 * 3600).describe('อายุ URL (วินาที)'),
});
export type SignedUrlsBody = z.input<typeof SignedUrlsBody>;
export interface SignedUrlsResult {
  /** path → URL เฉพาะไฟล์ที่มีสิทธิ์ */
  urls: Record<string, string>;
}

/** POST /storage/upload-url */
export const UploadUrlBody = z.object({ bucket: UploadBucket, path: objectPath.describe('path ปลายทาง เช่น <user_id>/<booking_id>-123.jpg') });
export type UploadUrlBody = z.infer<typeof UploadUrlBody>;
export interface UploadUrlResult {
  upload_url: string;
  path: string;
  /** เฉพาะ bucket public เช่น team-photos */
  public_url: string | null;
}
