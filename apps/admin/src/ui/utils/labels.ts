import type { Db } from '@nightout/types';

/** ป้ายภาษาไทย + สี Tag ของ enum ต่าง ๆ (แสดงให้ทีมอ่าน ไม่ใช่รหัสระบบ) */
export interface TagLabel {
  text: string;
  color: string;
}

export const BAR_STATUS: Record<Db.Enums<'bar_status'>, TagLabel> = {
  DRAFT: { text: 'ร่าง', color: 'default' },
  PENDING_REVIEW: { text: 'รอตรวจ', color: 'gold' },
  APPROVED: { text: 'แสดง', color: 'green' },
  REJECTED: { text: 'ไม่อนุมัติ', color: 'red' },
  SUSPENDED: { text: 'ระงับ', color: 'volcano' },
};

export const CATEGORY: Record<Db.Enums<'bar_category'>, string> = {
  PUB_BAR: 'ผับ / บาร์',
  CHILL: 'ร้านนั่งชิล',
  RESTAURANT: 'ร้านอาหาร',
};

export const USER_ROLE: Record<Db.Enums<'user_role'>, TagLabel> = {
  CUSTOMER: { text: 'ลูกค้า', color: 'default' },
  MERCHANT: { text: 'ร้านค้า', color: 'gold' },
  STAFF: { text: 'พนักงานร้าน', color: 'blue' },
  ADMIN: { text: 'แอดมิน', color: 'red' },
  SUPER_ADMIN: { text: 'ซูเปอร์แอดมิน', color: 'magenta' },
};

export const STAFF_ROLE: Record<Db.Enums<'bar_staff_role'>, string> = {
  OWNER: 'เจ้าของ',
  MANAGER: 'ผู้จัดการ',
  STAFF: 'พนักงาน',
};

export const BOOKING_STATUS: Record<Db.Enums<'booking_status'>, TagLabel> = {
  PENDING: { text: 'รอร้านยืนยัน', color: 'gold' },
  AWAITING_DEPOSIT: { text: 'รอโอนมัดจำ', color: 'gold' },
  DEPOSIT_SUBMITTED: { text: 'ส่งสลิปแล้ว', color: 'blue' },
  CONFIRMED: { text: 'ยืนยันแล้ว', color: 'green' },
  REJECTED: { text: 'ร้านปฏิเสธ', color: 'red' },
  CANCELLED_BY_CUSTOMER: { text: 'ลูกค้ายกเลิก', color: 'default' },
  CANCELLED_BY_MERCHANT: { text: 'ร้านยกเลิก', color: 'volcano' },
  CHECKED_IN: { text: 'เช็กอินแล้ว', color: 'cyan' },
  COMPLETED: { text: 'เสร็จสิ้น', color: 'green' },
  NO_SHOW: { text: 'ไม่มาตามนัด', color: 'red' },
  EXPIRED: { text: 'หมดเวลา', color: 'default' },
};

export const SETTLEMENT: Record<Db.Enums<'deposit_settlement'>, TagLabel> = {
  NONE: { text: '-', color: 'default' },
  HELD: { text: 'ถือไว้', color: 'blue' },
  PAYOUT_PENDING: { text: 'รอโอนให้ร้าน', color: 'gold' },
  PAID_OUT: { text: 'โอนให้ร้านแล้ว', color: 'green' },
  CREDIT: { text: 'เครดิตร้าน', color: 'purple' },
  REFUND_PENDING: { text: 'รอคืนลูกค้า', color: 'gold' },
  REFUNDED: { text: 'คืนลูกค้าแล้ว', color: 'default' },
};

export const REVIEW_STATUS: Record<Db.Enums<'review_status'>, TagLabel> = {
  PUBLISHED: { text: 'แสดงอยู่', color: 'green' },
  HIDDEN: { text: 'ซ่อน', color: 'gold' },
  REMOVED: { text: 'ลบแล้ว', color: 'red' },
};

export const PROMO_STATUS: Record<Db.Enums<'promoted_status'>, TagLabel> = {
  PENDING_PAYMENT: { text: 'รอชำระ', color: 'default' },
  PAYMENT_SUBMITTED: { text: 'รอตรวจสลิป', color: 'gold' },
  ACTIVE: { text: 'กำลังแสดง', color: 'green' },
  EXPIRED: { text: 'หมดอายุ', color: 'default' },
  REJECTED: { text: 'ไม่ผ่าน', color: 'red' },
  CANCELLED: { text: 'ยกเลิก', color: 'default' },
};

export const PLACEMENT: Record<Db.Enums<'promo_placement'>, string> = {
  HOME_BANNER: 'แบนเนอร์หน้าแรก',
  HOME_RECOMMENDED: 'ร้านแนะนำหน้าแรก',
  SEARCH_TOP: 'บนสุดผลค้นหา',
};

export const BILLING_STATUS: Record<Db.Enums<'billing_status'>, TagLabel> = {
  PENDING: { text: 'รอออกบิล', color: 'gold' },
  INVOICED: { text: 'ออกบิลแล้ว', color: 'blue' },
  PAID: { text: 'ชำระแล้ว', color: 'green' },
  WAIVED: { text: 'ยกเว้น', color: 'default' },
};

export const REPORT_REASON: Record<string, string> = {
  SPAM: 'สแปม',
  FAKE: 'รีวิวปลอม',
  OFFENSIVE: 'ไม่สุภาพ',
  PRIVACY: 'มีข้อมูลส่วนตัว',
  OTHER: 'อื่น ๆ',
};

export const AUDIT_ACTION: Record<string, string> = {
  'bar.status': 'เปลี่ยนสถานะร้าน',
  'bar.editor_pick': "Editor's Pick (ยกเลิกแล้ว)", // ฟีเจอร์ถูกลบ 2026-10-08 — เก็บไว้ให้ log เก่าอ่านออก
  'safety.verify': 'ยืนยัน Safety',
  'deposit.verify': 'สลิปมัดจำผ่าน',
  'deposit.reject': 'สลิปมัดจำไม่ผ่าน',
  'deposit.settle': 'ปิดยอดมัดจำ',
  'review.keep': 'เก็บรีวิวไว้',
  'review.hide': 'ซ่อนรีวิว',
  'review.remove': 'ลบรีวิว',
  'review.restore': 'แสดงรีวิวอีกครั้ง',
  'promotion.approve': 'เปิดโปรโมท',
  'promotion.reject': 'โปรโมทไม่ผ่าน',
  'user.role': 'เปลี่ยนสิทธิ์ผู้ใช้',
  'user.create': 'สร้างบัญชี',
  'user.update_role': 'ตั้งสิทธิ์บัญชี (สคริปต์)',
};
