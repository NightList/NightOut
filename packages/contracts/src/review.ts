import { z } from 'zod';
import { objectPath, text, uuid } from './common';

/** โดเมน review — เขียนรีวิว รายงาน แอดมินจัดการรีวิว */

export const ReviewMediaItem = z.object({
  path: objectPath,
  kind: z.enum(['IMAGE', 'VIDEO']),
  thumb_path: z.string().max(300).nullish(),
  duration_sec: z.number().int().min(0).max(60).nullish(),
  size_bytes: z.number().int().min(0).nullish(),
});
export type ReviewMediaItem = z.infer<typeof ReviewMediaItem>;

/** POST /bookings/:id/review */
export const AddReviewBody = z.object({
  review_id: uuid.describe('หน้าเว็บสร้าง UUID เองเพื่อใช้เป็นโฟลเดอร์ไฟล์ก่อนบันทึก'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(500),
  media: z.array(ReviewMediaItem).max(6).default([]),
});
export type AddReviewBody = z.input<typeof AddReviewBody>;

export const ReviewReportReason = z.enum(['SPAM', 'OFFENSIVE', 'FAKE', 'PRIVACY', 'OTHER']);
export type ReviewReportReason = z.infer<typeof ReviewReportReason>;

/** POST /reviews/:id/report */
export const ReportReviewBody = z.object({ reason: ReviewReportReason, detail: text(300).nullish() });
export type ReportReviewBody = z.infer<typeof ReportReviewBody>;

/** POST /admin/reviews/:id/moderate */
export const ModerateReviewBody = z.object({
  action: z.enum(['KEEP', 'HIDE', 'REMOVE', 'RESTORE']),
  reason: z.string().trim().min(1).max(500).optional(),
});
export type ModerateReviewBody = z.infer<typeof ModerateReviewBody>;

export const REVIEW_ERRORS = {
  REVIEW_REQUIRES_CHECKIN: 'รีวิวได้หลังเช็กอินที่ร้านแล้วเท่านั้น',
  REVIEW_EXISTS: 'คุณรีวิวการจองนี้แล้ว',
  INVALID_RATING: 'ให้คะแนน 1–5 ดาว',
  REVIEW_MEDIA_LIMIT: 'แนบไฟล์ได้สูงสุด 6 ไฟล์',
  INVALID_MEDIA_PATH: 'อัปโหลดไฟล์รีวิวไม่สำเร็จ',
  REVIEW_NOT_FOUND: 'ไม่พบรีวิวนี้',
} as const satisfies Record<string, string>;
