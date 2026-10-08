import { useAdminView } from '@/services/adminData';

/** API ของหน้าค่าคอม · backend: domains/backoffice (GET /admin/views/admin_billing_events) */

export const useBillingEvents = () => useAdminView('admin_billing_events', { order: { column: 'created_at', ascending: false } });
