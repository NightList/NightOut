import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';
import { useQuery } from '@tanstack/react-query';

/** API ของหน้ารายละเอียดการจองของร้าน · backend: domains/booking · domains/deposit (ประกาศซ้ำกับ bookings/api.ts ตาม ADR 0007) */

export type { TableOption } from '@nightout/contracts';

/** POST /merchant/bookings/:id/status */
export async function setBookingStatus(bookingId: string, to: C.TeamBookingStatusBody['to'], reason?: string) {
  await Rest.post(`/merchant/bookings/${bookingId}/status`, { to, reason: reason ?? null } satisfies C.TeamBookingStatusBody);
}

/** GET /merchant/bars/:barId/bookings/:bookingId/table-options — โซน/โต๊ะที่ย้ายไปได้ (ถามสดทุกครั้งที่เปิด) */
export const useTableOptions = (barId: string, bookingId: string | null) =>
  useQuery({
    queryKey: ['booking', 'table_options', bookingId],
    enabled: !!bookingId,
    staleTime: 0,
    queryFn: () => Rest.get<C.TableOption[]>(`/merchant/bars/${barId}/bookings/${bookingId!}/table-options`),
  });

/** POST /merchant/bookings/:id/move — ย้ายโต๊ะ (ทีมร้านทุกบทบาท) · tableId null = ไม่ระบุโต๊ะ */
export const moveBooking = (bookingId: string, zoneId: string, tableId: string | null, reason?: string) =>
  Rest.post<C.MoveBookingResult>(`/merchant/bookings/${bookingId}/move`, {
    zone_id: zoneId,
    table_id: tableId,
    reason: reason?.trim() || null,
  } satisfies C.MoveBookingBody);

/** POST /merchant/bookings/:id/refund — ร้านยืนยันคืนมัดจำลูกค้า → NightOut โอนคืน (ทีมร้านทุกบทบาท) */
export const refundDeposit = (bookingId: string, reason: string) =>
  Rest.post<C.RefundDepositResult>(`/merchant/bookings/${bookingId}/refund`, { reason: reason.trim() } satisfies C.RefundDepositBody);
