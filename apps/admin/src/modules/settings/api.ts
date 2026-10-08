import type { AdminMasterTable } from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';
import { useQuery } from '@tanstack/react-query';

/** API ของหน้าตั้งค่าระบบ · backend: domains/backoffice */

/** GET /admin/master/:table — ตาราง master (styles, safety_features, platform_settings) เรียงจากน้อยไปมาก */
export const useMasterTable = <T,>(table: AdminMasterTable, orderBy: string) =>
  useQuery({ queryKey: ['admin', 'master', table], queryFn: () => Rest.get<T[]>(`/admin/master/${table}`, { params: { order: `${orderBy}.asc` } }) });
