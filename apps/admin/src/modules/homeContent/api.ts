import type * as C from '@nightout/contracts';
import { useAdminView, type AdminActionInput } from '@/services/adminData';

/** API ของหน้าเนื้อหาหน้าแรก · backend: domains/backoffice (อ่าน) · domains/site-content (site-content.admin.controller.ts) */

export const useHomeContent = () => useAdminView('admin_home_content');
export const useHomeCategories = () => useAdminView('admin_home_categories', { order: { column: 'sort_order', ascending: true } });
export const useHomePopular = () => useAdminView('admin_home_popular', { order: { column: 'sort_order', ascending: true } });
/** ร้านทั้งหมดไว้เลือกเป็นร้านยอดนิยม */
export const useBars = () => useAdminView('admin_bars', { order: { column: 'name', ascending: true } });

/** PATCH /admin/home-content — Hero + หัวข้อ section */
export const homeContentAction = (body: C.UpdateHomeContentBody): AdminActionInput => ({ method: 'PATCH', path: 'home-content', body });

/** PATCH /admin/home-categories/:slot — การ์ดหมวด */
export const homeCategoryAction = (slot: string, body: C.UpdateHomeCategoryBody): AdminActionInput => ({
  method: 'PATCH',
  path: `home-categories/${slot}`,
  body,
});

/** PUT /admin/home-popular — ร้านยอดนิยม (แทนทั้งรายการ) */
export const homePopularAction = (body: C.UpdateHomePopularBody): AdminActionInput => ({ method: 'PUT', path: 'home-popular', body });
