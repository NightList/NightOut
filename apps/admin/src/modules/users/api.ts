import type * as C from '@nightout/contracts';
import { Rest } from '@nightout/utils/rest';
import { useQuery } from '@tanstack/react-query';
import { useAdminView, type AdminActionInput } from '@/services/adminData';

/** API ของหน้าผู้ใช้ · backend: domains/backoffice (อ่าน) · domains/account (account.admin.controller.ts) */

export type { AccountRoleOption } from '@nightout/contracts';

export const useUsers = () => useAdminView('admin_users', { order: { column: 'created_at', ascending: false } });
/** ร้านทั้งหมดไว้เลือกตอนสร้างบัญชีเจ้าของร้าน */
export const useBars = () => useAdminView('admin_bars', { order: { column: 'name', ascending: true } });

/** GET /admin/roles — ห้าชั้นบัญชีจากตาราง roles พร้อมสิทธิ์ของผู้เรียก */
export const useAccountRoles = () =>
  useQuery({ queryKey: ['admin', 'roles'], staleTime: 10 * 60_000, queryFn: () => Rest.get<C.AccountRoleOption[]>('/admin/roles') });

/** POST /admin/users */
export const createUserAction = (body: C.CreateUserBody): AdminActionInput => ({ method: 'POST', path: 'users', body });

/** PATCH /admin/users/:id — ชื่อ / อีเมล */
export const updateUserAction = (userId: string, body: C.UpdateUserAccountBody): AdminActionInput => ({ method: 'PATCH', path: `users/${userId}`, body });

/** DELETE /admin/users/:id */
export const deleteUserAction = (userId: string): AdminActionInput => ({ method: 'DELETE', path: `users/${userId}` });

/** PATCH /admin/users/:id/role */
export const setUserRoleAction = (userId: string, body: C.SetUserRoleBody): AdminActionInput => ({ method: 'PATCH', path: `users/${userId}/role`, body });

/** POST /admin/users/:id/unban — ปลดแบน (บัญชี + ทุกเบอร์ที่เคยใช้) */
export const unbanUserAction = (userId: string, body: C.UnbanUserBody = {}): AdminActionInput => ({ method: 'POST', path: `users/${userId}/unban`, body });
