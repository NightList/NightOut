import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';

/** API ของหน้ารีวิวของร้าน · backend: domains/review */

/** POST /reviews/:id/report */
export async function reportReview(reviewId: string, reason: C.ReviewReportReason = 'OTHER', detail?: string) {
  await Rest.post(`/reviews/${reviewId}/report`, { reason, detail: detail ?? null } satisfies C.ReportReviewBody);
}
