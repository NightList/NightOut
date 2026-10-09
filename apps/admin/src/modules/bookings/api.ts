import { useAdminView } from '@/services/adminData';

/** API ของหน้าการจองทั้งหมด · backend: domains/backoffice (GET /admin/views/admin_bookings) */

export const useBookings = () => useAdminView('admin_bookings', { order: { column: 'booking_datetime', ascending: false } });
