import type * as C from '@nightout/contracts';
import { useAdminView, type AdminActionInput } from '@/services/adminData';

/** API ของหน้ารีวิว · backend: domains/backoffice (อ่าน) · domains/review (review.admin.controller.ts) */

export const useReviews = () => useAdminView('admin_reviews', { order: { column: 'created_at', ascending: false } });

/** POST /admin/reviews/:id/moderate — ซ่อน / แสดง / ปิดรายงาน */
export const moderateReviewAction = (reviewId: string, body: C.ModerateReviewBody): AdminActionInput => ({
  method: 'POST',
  path: `reviews/${reviewId}/moderate`,
  body,
});
