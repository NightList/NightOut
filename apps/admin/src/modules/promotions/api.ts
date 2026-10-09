import type * as C from '@nightout/contracts';
import { useAdminView, type AdminActionInput } from '@/services/adminData';

/** API ของหน้าโปรโมชัน (ตรวจถ้อยคำโปรของร้าน + สลิปโปรโมท) · backend: domains/backoffice · domains/bar · domains/promotion */

/** โปรของร้านที่รอตรวจถ้อยคำ */
export const usePendingBarPromotions = () =>
  useAdminView('admin_bar_promotions', { filters: [['moderation_status', 'PENDING']], order: { column: 'updated_at', ascending: true } });

/** คำสั่งซื้อโปรโมทร้าน ล่าสุดก่อน */
export const usePromotedListings = () => useAdminView('admin_promoted_listings', { order: { column: 'created_at', ascending: false } });

/** POST /admin/bar-promotions/:id/moderate */
export const moderateBarPromotionAction = (promotionId: string, body: C.ApproveBody): AdminActionInput => ({
  method: 'POST',
  path: `bar-promotions/${promotionId}/moderate`,
  body,
});

/** POST /admin/promotions/:id/review — ตรวจสลิปโปรโมท */
export const reviewPromotionAction = (listingId: string, body: C.ApproveBody): AdminActionInput => ({
  method: 'POST',
  path: `promotions/${listingId}/review`,
  body,
});
