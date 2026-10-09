import { useAdminView, type AdminActionInput } from '@/services/adminData';

/** API ของหน้ายืนยัน Safety · backend: domains/backoffice (อ่าน) · domains/bar (bar.admin.controller.ts) */

/** มาตรการที่ร้านแจ้งว่า "มี" แต่ยังไม่ได้ตรวจหลักฐาน เก่าสุดก่อน */
export const useSafetyQueue = () =>
  useAdminView('admin_safety_queue', {
    filters: [
      ['source', 'SELF_DECLARED'],
      ['value', 'YES'],
    ],
    order: { column: 'updated_at', ascending: true },
  });

/** POST /admin/safety/:id/verify */
export const verifySafetyAction = (safetyId: string): AdminActionInput => ({ method: 'POST', path: `safety/${safetyId}/verify` });
