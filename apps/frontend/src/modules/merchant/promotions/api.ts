import type * as C from '@nightout/contracts';
import type { BarPromotion } from '@nightout/mock';
import { Rest } from '@nightout/utils/rest';

/** API ของหน้าโปรโมชันของร้าน + ค่าธรรมเนียม · backend: domains/bar */

/** PUT /merchant/bars/:barId/promotions — คืนจำนวนโปรที่รอแอดมินตรวจถ้อยคำ */
export async function setBarPromotions(barId: string, list: BarPromotion[]) {
  const body: C.BarPromotionsBody = {
    items: list.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description || null,
      cutoff_time: p.cutoffTime ?? null,
      days: p.days ?? null,
      active: p.active,
    })),
  };
  const r = await Rest.put<C.BarPromotionsResult>(`/merchant/bars/${barId}/promotions`, body);
  return r.pending;
}

/** PUT /merchant/bars/:barId/fees */
export async function setFees(barId: string, fees: { serviceChargeRate: number; vatRate: number; otherFees: number }) {
  await Rest.put(`/merchant/bars/${barId}/fees`, {
    service_charge: fees.serviceChargeRate ?? 0,
    vat: fees.vatRate ?? 0,
    other: fees.otherFees ?? 0,
  } satisfies C.FeesBody);
}
