import type { Db } from '@nightout/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { Rest } from '@nightout/utils/rest';

type AdminView =
  | 'admin_users'
  | 'admin_bars'
  | 'admin_bookings'
  | 'admin_deposits'
  | 'admin_reviews'
  | 'admin_safety_queue'
  | 'admin_promoted_listings'
  | 'admin_billing_events'
  | 'admin_audit_logs'
  | 'admin_bar_promotions'
  | 'admin_team_members';

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

interface ListOptions {
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

/**
 * อ่าน view ของแอดมินผ่าน API (GET /admin/views/:view — ADMIN + MFA · ADR 0002)
 * query key ขึ้นต้นด้วย 'admin' เสมอ → การกระทำใด ๆ สำเร็จแล้วรีเฟรชทุกหน้าในคราวเดียว
 */
export function useAdminView<V extends AdminView>(view: V, opts: ListOptions = {}) {
  return useQuery({
    queryKey: ['admin', view, opts],
    queryFn: () => Rest.get<AdminViewRows[V][]>(`/admin/views/${view}`, { params: viewParams(opts) }),
  });
}

/** ตัวเลขหน้าแดชบอร์ด (หนึ่งหน้า = หนึ่งการเรียก) */
export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => Rest.get<Db.AdminDashboard | null>('/admin/dashboard'),
  });
}

/** ตาราง master (styles, safety_features, platform_settings) เรียงจากน้อยไปมาก */
export function useMasterTable<T>(
  table: 'styles' | 'safety_features' | 'platform_settings',
  orderBy: string,
) {
  return useQuery({
    queryKey: ['admin', 'master', table],
    queryFn: () => Rest.get<T[]>(`/admin/master/${table}`, { params: { order: `${orderBy}.asc` } }),
  });
}

interface ActionInput {
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  /** ข้อความเมื่อสำเร็จ */
  success: string;
}

/** ส่งการกระทำของแอดมินไป NestJS → สำเร็จแล้วแจ้ง + โหลดข้อมูลทุกหน้าใหม่ · ล้มเหลวแจ้งเหตุผลเป็นภาษาไทย */
export function useAdminAction() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: ({ method, path, body }: ActionInput) => {
      const url = `/admin/${path}`;
      if (method === 'PATCH') return Rest.patch(url, body);
      if (method === 'PUT') return Rest.put(url, body);
      if (method === 'DELETE') return Rest.delete(url);
      return Rest.post(url, body);
    },
    onSuccess: (_d, v) => {
      void message.success(v.success);
      void qc.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (e: Error) => {
      void message.error(e.message);
    },
  });
}

/** URL ชั่วคราว (10 นาที) ของไฟล์ในบักเก็ตส่วนตัว เช่นสลิป */
export function useSignedUrl(
  bucket: 'deposit-slips' | 'promo-slips' | 'bar-verifications',
  path: string | null | undefined,
) {
  return useQuery({
    queryKey: ['signed', bucket, path],
    enabled: !!path,
    staleTime: 9 * 60_000,
    queryFn: async () => {
      if (!path) return null;
      try {
        const { urls } = await Rest.post<{ urls: Record<string, string> }>('/storage/signed-urls', {
          bucket,
          paths: [path],
          expires_in: 600,
        });
        return urls[path] ?? null;
      } catch {
        return null;
      }
    },
  });
}
