import type * as C from '@nightout/contracts';
import type { ReviewMedia } from '@nightout/mock';
import { Rest } from '@nightout/utils/rest';
import { uploadReviewMedia } from '@/services/api/storage';
import { me, refresh } from '@/services/sync';

/** review — เขียนรีวิว รายงาน · backend: domains/review · สัญญา: contracts review.ts */

export async function addReview(bookingId: string, rating: number, comment: string, media: ReviewMedia[]) {
  const reviewId = crypto.randomUUID();
  const uploaded = await uploadReviewMedia(me().id, reviewId, media);
  await Rest.post(`/bookings/${bookingId}/review`, { review_id: reviewId, rating, comment, media: uploaded } satisfies C.AddReviewBody);
  await refresh({ public: true });
}

export async function reportReview(reviewId: string, reason: C.ReviewReportReason = 'OTHER', detail?: string) {
  await Rest.post(`/reviews/${reviewId}/report`, { reason, detail: detail ?? null } satisfies C.ReportReviewBody);
  await refresh();
}
