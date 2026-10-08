import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';

/** API ของหน้าโซน/โต๊ะ · backend: domains/bar */

/** PUT /merchant/bars/:barId/zones — แทนโซนและโต๊ะทั้งหมด */
export async function setZones(
  barId: string,
  zones: { id?: string; name: string; capacityPax: number; defaultDurationMinutes: number; tables: { id?: string; name: string; seats: number }[] }[],
) {
  const body: C.ZonesBody = {
    zones: zones.map((z) => ({
      id: z.id ?? null,
      name: z.name,
      capacity_pax: z.capacityPax,
      default_duration_minutes: z.defaultDurationMinutes,
      tables: z.tables.map((t) => ({ id: t.id ?? null, name: t.name, seats: t.seats })),
    })),
  };
  await Rest.put(`/merchant/bars/${barId}/zones`, body);
}
