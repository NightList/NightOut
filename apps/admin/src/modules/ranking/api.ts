import { useAdminView } from '@/services/adminData';

/** API ของหน้าจัดอันดับ · backend: domains/backoffice (GET /admin/views/admin_bars) */

/** ร้านที่แสดงอยู่ เรียงตามคะแนน */
export const useRankedBars = () => useAdminView('admin_bars', { filters: [['status', 'APPROVED']], order: { column: 'score', ascending: false } });
