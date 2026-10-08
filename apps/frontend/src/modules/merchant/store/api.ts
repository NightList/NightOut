import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';

/** API ของหน้าข้อมูลร้าน · backend: domains/bar */

/** PATCH /merchant/bars/:barId/info */
export async function updateBarInfo(barId: string, info: C.BarInfoBody) {
  await Rest.patch(`/merchant/bars/${barId}/info`, info);
}
