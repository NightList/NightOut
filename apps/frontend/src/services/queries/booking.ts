import { useQuery } from '@tanstack/react-query';
import type { BarWithTier } from '@nightout/mock';
import { fetchShareCard, fetchTableOptions, fetchZoneAvailability } from '@/services/api/booking';
import { bookingKeys } from './keys';

export type { ShareCard, TableOption } from '@nightout/contracts';

export interface ZoneSlot {
  zone: BarWithTier['zones'][number];
  remainingPax: number;
  freeTables: number;
  full: boolean;
}

/** โซนว่างของร้านในเวลาที่เลือก (DB นับการจองของทุกคนให้ — ลูกค้าเห็นการจองคนอื่นไม่ได้) */
export function useZoneAvailability(bar: BarWithTier | null, datetimeIso: string) {
  return useQuery({
    queryKey: bookingKeys.zoneAvailability(bar?.id, datetimeIso),
    enabled: !!bar,
    staleTime: 15_000,
    queryFn: async (): Promise<ZoneSlot[]> => {
      const rows = await fetchZoneAvailability(bar!.id, datetimeIso);
      return rows
        .map((r) => {
          const zone = bar!.zones.find((z) => z.id === r.zone_id);
          return zone ? { zone, remainingPax: r.remaining_pax, freeTables: r.free_tables, full: r.full } : null;
        })
        .filter((x): x is ZoneSlot => x !== null);
    },
  });
}

/** โซน/โต๊ะที่ย้ายการจองไปได้ (ปุ่ม "ย้ายโต๊ะ") — ถามสดทุกครั้งที่เปิด */
export const useTableOptions = (barId: string, bookingId: string | null) =>
  useQuery({
    queryKey: bookingKeys.tableOptions(bookingId),
    enabled: !!bookingId,
    staleTime: 0,
    queryFn: () => fetchTableOptions(barId, bookingId!),
  });

/** บัตรจองสาธารณะจากลิงก์แชร์ (ไม่มีข้อมูลส่วนตัว) */
export const useShareCard = (token: string) => useQuery({ queryKey: bookingKeys.shareCard(token), queryFn: () => fetchShareCard(token) });
