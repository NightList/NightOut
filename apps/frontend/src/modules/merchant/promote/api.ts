import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';
import { uploadPromoSlip } from '@/services/api/storage';

/** API ของหน้าโปรโมทร้าน · backend: domains/promotion */

/** อัปโหลดสลิปแล้ว POST /merchant/bars/:barId/promotion-orders */
export async function orderPromotion(barId: string, packageId: string, slip: Blob) {
  const path = await uploadPromoSlip(barId, slip);
  await Rest.post(`/merchant/bars/${barId}/promotion-orders`, { package_id: packageId, slip_path: path } satisfies C.OrderPromotionBody);
}
