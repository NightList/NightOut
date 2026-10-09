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

/** label + สี Tag ของ antd · dot = สีหลักของ Tag นั้น (ใช้กับจุดสถานะ/เส้นประวัติ) */
export const BOOKING_STATUS: Record<BookingStatus, { label: string; color: string; dot: string }> = {
  PENDING: { label: 'รอร้านยืนยัน', color: 'gold', dot: '#d89614' },
  AWAITING_DEPOSIT: { label: 'รอจ่ายมัดจำ', color: 'orange', dot: '#d87a16' },
  DEPOSIT_SUBMITTED: { label: 'รอตรวจสลิป', color: 'purple', dot: '#854eca' },
  CONFIRMED: { label: 'ยืนยันแล้ว', color: 'green', dot: '#49aa19' },
  REJECTED: { label: 'ร้านปฏิเสธ', color: 'red', dot: '#d32029' },
  CANCELLED_BY_CUSTOMER: { label: 'ยกเลิกแล้ว', color: 'default', dot: '#a7a1b3' },
  CANCELLED_BY_MERCHANT: { label: 'ร้านยกเลิก', color: 'red', dot: '#d32029' },
  CHECKED_IN: { label: 'เช็กอินแล้ว', color: 'cyan', dot: '#13a8a8' },
  COMPLETED: { label: 'เสร็จสิ้น', color: 'blue', dot: '#1668dc' },
  NO_SHOW: { label: 'ไม่มาตามนัด', color: 'volcano', dot: '#d84a1b' },
  EXPIRED: { label: 'หมดเวลา', color: 'default', dot: '#a7a1b3' },
};

export const CROWD: Record<CrowdStatus, { label: string; dot: string }> = {
  AVAILABLE: { label: 'ว่าง', dot: 'var(--crowd-available)' },
  ALMOST_FULL: { label: 'ใกล้เต็ม', dot: 'var(--crowd-almost-full)' },
  FULL: { label: 'โต๊ะเต็ม', dot: 'var(--crowd-full)' },
};
