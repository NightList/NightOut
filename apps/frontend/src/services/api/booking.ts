import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';
import { refresh, setProfilePhone } from '@/services/sync';

/**
 * booking — จอง ยกเลิก สถานะ เช็กอิน ย้ายโต๊ะ · backend: domains/booking · สัญญา: @nightout/contracts booking.ts
 * ทุกการเขียนโหลดข้อมูลผู้ใช้ใหม่ (refresh) ให้ store ตรงกับ DB
 */

export async function createBooking(input: {
  barId: string;
  zoneId: string;
  datetime: string;
  pax: number;
  promotionId?: string;
  note?: string;
  /** เบอร์ติดต่อ E.164 (toThaiE164) */
  contactPhone: string;
  /** ข้อความเงื่อนไขมัดจำที่ลูกค้าติ๊กยอมรับ (DB เก็บเป็นหลักฐาน) */
  depositTerms: { version: string; text: string } | null;
}): Promise<C.CreateBookingResult> {
  const body: C.CreateBookingBody = {
    bar_id: input.barId,
    zone_id: input.zoneId,
    datetime: input.datetime,
    pax: input.pax,
    promotion_id: input.promotionId ?? null,
    note: input.note?.trim() || null,
    contact_phone: input.contactPhone,
    deposit_terms: input.depositTerms ? { accepted: true, terms_version: input.depositTerms.version, terms_text: input.depositTerms.text } : null,
  };
  const r = await Rest.post<C.CreateBookingResult>('/bookings', body);
  setProfilePhone(input.contactPhone);
  await refresh();
  return r;
}

export async function cancelBooking(bookingId: string, reason?: string) {
  await Rest.post(`/bookings/${bookingId}/cancel`, { reason: reason ?? null } satisfies C.CancelBookingBody);
  await refresh();
}

// ----------------------------- ทีมร้าน -----------------------------
export async function setBookingStatus(bookingId: string, to: C.TeamBookingStatusBody['to'], reason?: string) {
  await Rest.post(`/merchant/bookings/${bookingId}/status`, { to, reason: reason ?? null } satisfies C.TeamBookingStatusBody);
  await refresh();
}

/** ย้ายโต๊ะ (ทีมร้านทุกบทบาท) · tableId null = ไม่ระบุโต๊ะ */
export async function moveBooking(bookingId: string, zoneId: string, tableId: string | null, reason?: string) {
  const r = await Rest.post<C.MoveBookingResult>(`/merchant/bookings/${bookingId}/move`, {
    zone_id: zoneId,
    table_id: tableId,
    reason: reason?.trim() || null,
  } satisfies C.MoveBookingBody);
  await refresh();
  return r;
}

export async function checkIn(barId: string, code: string) {
  const r = await Rest.post<C.CheckInResult>(`/merchant/bars/${barId}/check-in`, { code } satisfies C.CheckInBody);
  await refresh();
  return r;
}

// ----------------------------- อ่านสด (ใช้ใน queries/booking.ts) -----------------------------
export const fetchZoneAvailability = (barId: string, datetimeIso: string) =>
  Rest.get<C.ZoneAvailabilityRow[]>(`/bars/${barId}/zone-availability`, { params: { datetime: datetimeIso } satisfies C.ZoneAvailabilityQuery });
export const fetchTableOptions = (barId: string, bookingId: string) =>
  Rest.get<C.TableOption[]>(`/merchant/bars/${barId}/bookings/${bookingId}/table-options`);
export const fetchShareCard = (token: string) => Rest.get<C.ShareCard | null>(`/share-cards/${encodeURIComponent(token)}`);
