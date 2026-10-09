import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';

/** API ของหน้ารายการจองของร้าน (ปุ่มสถานะท้ายแถว) · backend: domains/booking · ย้ายโต๊ะ/คืนมัดจำอยู่ที่ bookingDetail/api.ts */

/** POST /merchant/bookings/:id/status */
export async function setBookingStatus(bookingId: string, to: C.TeamBookingStatusBody['to'], reason?: string) {
  await Rest.post(`/merchant/bookings/${bookingId}/status`, { to, reason: reason ?? null } satisfies C.TeamBookingStatusBody);
}
