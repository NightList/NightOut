import { z } from 'zod';
import { objectPath, uuid } from './common';

/** โดเมน promotion — โปรโมทร้าน (ซื้อพื้นที่โฆษณา) · โปรของร้านที่รอแอดมินตรวจถ้อยคำ */

/** POST /merchant/bars/:barId/promotion-orders */
export const OrderPromotionBody = z.object({
  package_id: uuid,
  slip_path: objectPath.describe('path ใน bucket promo-slips/<bar_id>/…'),
});
export type OrderPromotionBody = z.infer<typeof OrderPromotionBody>;
export interface OrderPromotionResult {
  id: string;
  status: 'PAYMENT_SUBMITTED';
}

export const PromoPlacement = z.enum(['HOME_BANNER', 'HOME_RECOMMENDED', 'SEARCH_TOP']);
export type PromoPlacement = z.infer<typeof PromoPlacement>;

export const PROMOTION_ERRORS = {
  PACKAGE_NOT_FOUND: 'ไม่พบแพ็กเกจนี้',
  PROMOTION_NOT_FOUND: 'ไม่พบรายการโปรโมทนี้แล้ว',
  PROMOTION_NOT_AWAITING_REVIEW: 'รายการโปรโมทนี้ตรวจไปแล้ว',
} as const satisfies Record<string, string>;
