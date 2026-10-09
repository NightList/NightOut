import { useAdminView } from '@/services/adminData';

/** API ของหน้าประวัติการกระทำ · backend: domains/backoffice (GET /admin/views/admin_audit_logs) */

/** 500 รายการล่าสุด */
export const useAuditLogs = () => useAdminView('admin_audit_logs', { order: { column: 'created_at', ascending: false }, limit: 500 });
