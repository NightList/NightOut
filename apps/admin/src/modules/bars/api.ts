import type * as C from '@nightout/contracts';
import { useAdminView, type AdminActionInput } from '@/services/adminData';

/** API ของหน้าร้านทั้งหมด · backend: domains/backoffice (อ่าน) · domains/bar (bar.admin.controller.ts) */

/** GET /admin/views/admin_bars เรียงตามชื่อ */
export const useBars = () => useAdminView('admin_bars', { order: { column: 'name', ascending: true } });

/** PATCH /admin/bars/:id/status — แสดง ↔ ระงับ (ส่งให้ useAdminAction().mutate พร้อม success) */
export const barStatusAction = (barId: string, body: C.SetBarStatusBody): AdminActionInput => ({ method: 'PATCH', path: `bars/${barId}/status`, body });
