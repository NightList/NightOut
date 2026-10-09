import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';
import { useQuery } from '@tanstack/react-query';
import type { BarWithTier } from '@/services/data';
import { setProfilePhone } from '@/services/sync';

/**
 * API ของหน้าจองโต๊ะ (/bars/:slug/book) — ทุกเส้นที่ module นี้ใช้อยู่ที่นี่
 * backend: domains/booking (booking.public.controller.ts · booking.me.controller.ts) · สัญญา: @nightout/contracts booking.ts
 */

export interface ZoneSlot {
  zone: BarWithTier['zones'][number];
  remainingPax: number;
  freeTables: number;
  full: boolean;
}

/** GET /bars/:barId/zone-availability — โซนว่างในเวลาที่เลือก (DB นับการจองของทุกคนให้ ลูกค้าไม่เห็นการจองของคนอื่น) */
export function useZoneAvailability(bar: BarWithTier | null, datetimeIso: string) {
  return useQuery({
    queryKey: ['booking', 'zone_availability', bar?.id, datetimeIso],
    enabled: !!bar,
    staleTime: 15_000,
    queryFn: async (): Promise<ZoneSlot[]> => {
      const rows = await Rest.get<C.ZoneAvailabilityRow[]>(`/bars/${bar!.id}/zone-availability`, {
        params: { datetime: datetimeIso } satisfies C.ZoneAvailabilityQuery,
      });
      return rows
        .map((r) => {
          const zone = bar!.zones.find((z) => z.id === r.zone_id);
          return zone ? { zone, remainingPax: r.remaining_pax, freeTables: r.free_tables, full: r.full } : null;
        })
        .filter((x): x is ZoneSlot => x !== null);
    },
  });
}

/** POST /bookings — จองโต๊ะ (Rest โหลด store ใหม่ให้เองหลังสำเร็จ) */
export function createBooking(body: C.CreateBookingBody) {
  // เบอร์ล่าสุดไว้เติมให้ครั้งหน้า — ตั้งก่อนส่ง เพราะการโหลด store ใหม่หลังบันทึกใช้โปรไฟล์นี้
  setProfilePhone(body.contact_phone);
  return Rest.post<C.CreateBookingResult>('/bookings', body satisfies C.CreateBookingBody);
}
