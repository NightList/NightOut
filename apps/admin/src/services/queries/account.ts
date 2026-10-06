import { useQuery } from '@tanstack/react-query';
import { fetchAccountRoles } from '@/services/api/account';
import { accountKeys } from './keys';

export type { AccountRoleOption } from '@nightout/contracts';

/** ห้าชั้นบัญชีจากตาราง roles พร้อมสิทธิ์ของผู้เรียก */
export const useAccountRoles = () => useQuery({ queryKey: accountKeys.roles, staleTime: 10 * 60_000, queryFn: fetchAccountRoles });
