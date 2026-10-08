import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';

/** API ของหน้ารายละเอียดการจอง · backend: domains/booking */

/** POST /bookings/:id/cancel — ลูกค้ายกเลิกการจองของตัวเอง */
export async function cancelBooking(bookingId: string, reason?: string) {
  await Rest.post(`/bookings/${bookingId}/cancel`, { reason: reason ?? null } satisfies C.CancelBookingBody);
}
