import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';

/** API ของหน้าคืนนี้ (ความแน่น + เช็กอิน) · backend: domains/bar · domains/booking */

/** POST /merchant/bars/:barId/crowd */
export async function setCrowd(barId: string, status: C.CrowdBody['status']) {
  await Rest.post(`/merchant/bars/${barId}/crowd`, { status } satisfies C.CrowdBody);
}

/** POST /merchant/bars/:barId/check-in — รหัส NL-XXXXXX หรือข้อความจาก QR */
export const checkIn = (barId: string, code: string) =>
  Rest.post<C.CheckInResult>(`/merchant/bars/${barId}/check-in`, { code } satisfies C.CheckInBody);
