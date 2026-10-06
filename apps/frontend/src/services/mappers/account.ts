import type { AppNotification, PromotionOrder } from '@nightout/mock';

/** account — แถวแจ้งเตือน / ประวัติโปรโมท ใน GET /me/overview → รูปแบบที่หน้าเว็บใช้ */
export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  payload: { link?: string } | null;
  read_at: string | null;
  created_at: string;
}
export interface ListingRow {
  id: string;
  bar_id: string;
  placement: PromotionOrder['placement'];
  price_paid: number;
  status: string;
  created_at: string;
  promotion_packages: { name: string; duration_days: number } | null;
}

export const toNotification = (n: NotificationRow): AppNotification => ({
  id: n.id,
  userId: n.user_id,
  title: n.title,
  body: n.body,
  link: n.payload?.link,
  createdAt: n.created_at,
  readAt: n.read_at ?? undefined,
});


export const toPromotionOrder = (l: ListingRow): PromotionOrder => ({
  id: l.id,
  barId: l.bar_id,
  packageName: `${l.promotion_packages?.name ?? 'แพ็กเกจ'} ${l.promotion_packages?.duration_days ?? ''} วัน`.trim(),
  placement: l.placement,
  days: l.promotion_packages?.duration_days ?? 0,
  price: Number(l.price_paid),
  status: l.status as PromotionOrder['status'],
  createdAt: l.created_at,
});
