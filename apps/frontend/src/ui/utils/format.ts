import type { BookingStatus, CrowdStatus } from '@nightout/types';

export const baht = (n: number) =>
  `฿${n.toLocaleString('th-TH', { maximumFractionDigits: 2, minimumFractionDigits: n % 1 ? 2 : 0 })}`;

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export const timeAgo = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return 'เมื่อสักครู่';
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  return `${Math.round(h / 24)} วันที่แล้ว`;
};

export const BOOKING_STATUS: Record<BookingStatus, { label: string; color: string }> = {
  PENDING: { label: 'รอร้านยืนยัน', color: 'gold' },
  AWAITING_DEPOSIT: { label: 'รอจ่ายมัดจำ', color: 'orange' },
  DEPOSIT_SUBMITTED: { label: 'รอตรวจสลิป', color: 'purple' },
  CONFIRMED: { label: 'ยืนยันแล้ว', color: 'green' },
  REJECTED: { label: 'ร้านปฏิเสธ', color: 'red' },
  CANCELLED_BY_CUSTOMER: { label: 'ยกเลิกแล้ว', color: 'default' },
  CANCELLED_BY_MERCHANT: { label: 'ร้านยกเลิก', color: 'red' },
  CHECKED_IN: { label: 'เช็กอินแล้ว', color: 'cyan' },
  COMPLETED: { label: 'เสร็จสิ้น', color: 'blue' },
  NO_SHOW: { label: 'ไม่มาตามนัด', color: 'volcano' },
  EXPIRED: { label: 'หมดเวลา', color: 'default' },
};

export const CROWD: Record<CrowdStatus, { label: string; dot: string }> = {
  AVAILABLE: { label: 'ว่าง', dot: 'var(--crowd-available)' },
  ALMOST_FULL: { label: 'ใกล้เต็ม', dot: 'var(--crowd-almost-full)' },
  FULL: { label: 'โต๊ะเต็ม', dot: 'var(--crowd-full)' },
};
