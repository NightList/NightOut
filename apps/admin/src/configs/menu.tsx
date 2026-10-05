import {
  ChartBar,
  ClipboardText,
  Crown,
  Gear,
  Megaphone,
  Receipt,
  ShieldCheck,
  Storefront,
  UserCircle,
  Users,
  UsersFour,
  ChatCircleText,
  CalendarCheck,
  Buildings,
  Wallet,
} from '@phosphor-icons/react';
import type { ReactNode } from 'react';

export interface AdminRoute {
  path: string;
  name: string;
  icon: ReactNode;
}

/** เมนู Backoffice ตาม docs/SITEMAP.md ข้อ 4 */
export const ADMIN_ROUTES: AdminRoute[] = [
  { path: '/', name: 'แดชบอร์ด', icon: <ChartBar size={18} /> },
  { path: '/merchants', name: 'ร้านรออนุมัติ', icon: <Storefront size={18} /> },
  { path: '/bars', name: 'จัดการร้าน', icon: <Buildings size={18} /> },
  { path: '/safety', name: 'ยืนยัน Safety', icon: <ShieldCheck size={18} /> },
  { path: '/ranking', name: 'ดาว / อันดับ', icon: <Crown size={18} /> },
  { path: '/promotions', name: 'โปรโมท', icon: <Megaphone size={18} /> },
  { path: '/users', name: 'ผู้ใช้', icon: <Users size={18} /> },
  { path: '/team', name: 'จัดการทีมงาน', icon: <UsersFour size={18} /> },
  { path: '/bookings', name: 'การจอง', icon: <CalendarCheck size={18} /> },
  { path: '/deposits', name: 'เงินมัดจำ', icon: <Wallet size={18} /> },
  { path: '/reviews', name: 'รีวิวที่ถูกรายงาน', icon: <ChatCircleText size={18} /> },
  { path: '/billing', name: 'ค่าคอม', icon: <Receipt size={18} /> },
  { path: '/audit-logs', name: 'Audit Log', icon: <ClipboardText size={18} /> },
  { path: '/settings', name: 'ตั้งค่าระบบ', icon: <Gear size={18} /> },
];

export const AvatarIcon = <UserCircle size={24} />;
