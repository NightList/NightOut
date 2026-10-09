import type { Db } from '@nightout/types';
import { Rest } from '@nightout/utils/rest';
import { useQuery } from '@tanstack/react-query';

/** API ของหน้าแดชบอร์ด · backend: domains/backoffice */

/** GET /admin/dashboard — ตัวเลขทั้งหน้าในการเรียกเดียว (key ขึ้นต้น 'admin' → การกระทำของแอดมินโหลดใหม่ให้เอง) */
export const useAdminDashboard = () =>
  useQuery({ queryKey: ['admin', 'dashboard'], queryFn: () => Rest.get<Db.AdminDashboard | null>('/admin/dashboard') });
