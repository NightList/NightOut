import type * as C from '@nightout/contracts';
import type { ReviewMedia } from '@nightout/mock';
import { Rest } from '@nightout/utils/rest';
import { uploadReviewMedia } from '@/services/api/storage';
import { me } from '@/services/sync';

/** API ของหน้าเขียนรีวิว · backend: domains/review */

/** อัปโหลดรูป/วิดีโอเข้า review-media แล้ว POST /bookings/:id/review */
export async function addReview(bookingId: string, rating: number, comment: string, media: ReviewMedia[]) {
  const reviewId = crypto.randomUUID();
  const uploaded = await uploadReviewMedia(me().id, reviewId, media);
  await Rest.post(`/bookings/${bookingId}/review`, { review_id: reviewId, rating, comment, media: uploaded } satisfies C.AddReviewBody);
}
