import type * as C from '@nightout/contracts';
import { useAdminView, type AdminActionInput } from '@/services/adminData';

/** API ของหน้ามัดจำ · backend: domains/backoffice (อ่าน) · domains/deposit (deposit.admin.controller.ts) */

/** GET /admin/views/admin_deposits เก่าสุดก่อน */
export const useDeposits = () => useAdminView('admin_deposits', { order: { column: 'created_at', ascending: true } });

/** POST /admin/deposits/:id/review — อนุมัติ / ปฏิเสธสลิป (ปฏิเสธต้องมี reason_code) */
export const reviewDepositAction = (depositId: string, body: C.ReviewDepositBody): AdminActionInput => ({
  method: 'POST',
  path: `deposits/${depositId}/review`,
  body,
});

/** POST /admin/deposits/:id/settle — โอนให้ร้าน / เก็บเป็นเครดิต / คืนลูกค้า */
export const settleDepositAction = (depositId: string, body: C.SettleDepositBody): AdminActionInput => ({
  method: 'POST',
  path: `deposits/${depositId}/settle`,
  body,
});
