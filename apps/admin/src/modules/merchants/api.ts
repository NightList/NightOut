import type * as C from '@nightout/contracts';
import { useAdminView, type AdminActionInput } from '@/services/adminData';

/** API ของหน้าร้านรออนุมัติ · backend: domains/backoffice (อ่าน) · domains/bar (bar.admin.controller.ts) */

/** ร้านที่รอตรวจ / ร่าง เก่าสุดก่อน */
export const usePendingBars = () =>
  useAdminView('admin_bars', { filters: [['status', ['PENDING_REVIEW', 'DRAFT']]], order: { column: 'created_at', ascending: true } });

/** PATCH /admin/bars/:id/status — อนุมัติ / ไม่อนุมัติ */
export const barStatusAction = (barId: string, body: C.SetBarStatusBody): AdminActionInput => ({ method: 'PATCH', path: `bars/${barId}/status`, body });
