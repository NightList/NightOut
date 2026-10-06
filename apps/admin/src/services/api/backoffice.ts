import type { AdminMasterTable, AdminView } from '@nightout/contracts';
import type { Db } from '@nightout/types';
import { Rest } from '@nightout/utils/rest';

/**
 * backoffice — การอ่านของหน้าแอดมิน (ADR 0003): view admin_* · แดชบอร์ด · ตาราง master · การกระทำ /admin/* ทุกโดเมน
 * backend: domains/backoffice (อ่าน) + <domain>.admin.controller.ts (เขียน)
 */
export type { AdminMasterTable, AdminView };

/** ชนิดแถวของแต่ละ view (ADMIN_VIEWS ใน @nightout/contracts) */
export interface AdminViewRows {
  admin_users: Db.AdminUser;
  admin_bars: Db.AdminBar;
  admin_bookings: Db.AdminBooking;
  admin_deposits: Db.AdminDeposit;
  admin_reviews: Db.AdminReview;
  admin_safety_queue: Db.AdminSafetyItem;
  admin_promoted_listings: Db.AdminPromotedListing;
  admin_billing_events: Db.AdminBillingEvent;
  admin_audit_logs: Db.AdminAuditLog;
  admin_bar_promotions: Db.AdminBarPromotion;
  admin_team_members: Db.AdminTeamMember;
}

/** ตัวกรองแบบง่าย: [คอลัมน์, ค่า] = eq · [คอลัมน์, ค่า[]] = in */
export type ViewFilter = [column: string, value: string | boolean | number | string[]];
export interface ListOptions {
  filters?: ViewFilter[];
  order?: { column: string; ascending?: boolean };
  limit?: number;
}

/** ตัวกรอง → query string ของ GET /admin/views/:view (หลายค่า = คั่นด้วย , → in) */
function viewParams(opts: ListOptions): Record<string, string | number> {
  const params: Record<string, string | number> = { limit: opts.limit ?? 1000 };
  for (const [col, val] of opts.filters ?? []) params[col] = Array.isArray(val) ? val.join(',') : String(val);
  if (opts.order) params.order = `${opts.order.column}.${opts.order.ascending ? 'asc' : 'desc'}`;
  return params;
}

export const fetchAdminView = <V extends AdminView>(view: V, opts: ListOptions = {}) =>
  Rest.get<AdminViewRows[V][]>(`/admin/views/${view}`, { params: viewParams(opts) });
export const fetchAdminDashboard = () => Rest.get<Db.AdminDashboard | null>('/admin/dashboard');
export const fetchMasterTable = <T>(table: AdminMasterTable, orderBy: string) =>
  Rest.get<T[]>(`/admin/master/${table}`, { params: { order: `${orderBy}.asc` } });

export interface AdminActionInput {
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** path ต่อจาก /admin/ เช่น deposits/<id>/review */
  path: string;
  body?: unknown;
}
/** การกระทำของแอดมิน → NestJS /admin/<path> (endpoint อยู่ใน <domain>.admin.controller.ts ของโดเมนนั้น) */
export function adminAction({ method, path, body }: AdminActionInput) {
  const url = `/admin/${path}`;
  if (method === 'PATCH') return Rest.patch(url, body);
  if (method === 'PUT') return Rest.put(url, body);
  if (method === 'DELETE') return Rest.delete(url);
  return Rest.post(url, body);
}
