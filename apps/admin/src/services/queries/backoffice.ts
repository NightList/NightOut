import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { adminAction, fetchAdminDashboard, fetchAdminView, fetchMasterTable, type AdminActionInput, type AdminView, type ListOptions } from '@/services/api/backoffice';
import { backofficeKeys } from './keys';

export type { AdminViewRows, ListOptions, ViewFilter } from '@/services/api/backoffice';

/** อ่าน view ของแอดมินผ่าน API (GET /admin/views/:view — ADMIN + MFA · ADR 0003) */
export function useAdminView<V extends AdminView>(view: V, opts: ListOptions = {}) {
  return useQuery({ queryKey: backofficeKeys.view(view, opts), queryFn: () => fetchAdminView(view, opts) });
}

/** ตัวเลขหน้าแดชบอร์ด (หนึ่งหน้า = หนึ่งการเรียก) */
export const useAdminDashboard = () => useQuery({ queryKey: backofficeKeys.dashboard, queryFn: fetchAdminDashboard });

/** ตาราง master (styles, safety_features, platform_settings) เรียงจากน้อยไปมาก */
export function useMasterTable<T>(table: 'styles' | 'safety_features' | 'platform_settings', orderBy: string) {
  return useQuery({ queryKey: backofficeKeys.master(table), queryFn: () => fetchMasterTable<T>(table, orderBy) });
}

interface ActionInput extends AdminActionInput {
  /** ข้อความเมื่อสำเร็จ (ฟังก์ชัน = สร้างจากผลที่ API ตอบกลับ) */
  success: string | ((result: unknown) => string);
}

/** ส่งการกระทำของแอดมินไป NestJS → สำเร็จแล้วแจ้ง + โหลดข้อมูลทุกหน้าใหม่ · ล้มเหลวแจ้งเหตุผลเป็นภาษาไทย */
export function useAdminAction() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (input: ActionInput) => adminAction(input),
    onSuccess: (d, v) => {
      void message.success(typeof v.success === 'function' ? v.success(d) : v.success);
      void qc.invalidateQueries({ queryKey: backofficeKeys.all });
    },
    onError: (e: Error) => {
      void message.error(e.message);
    },
  });
}
