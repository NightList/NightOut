/**
 * จุดเดียวที่หน้าเว็บใช้อ่าน/เขียนข้อมูล (หน้า import จากที่นี่ ไม่ import @nightout/mock หรือ services/api ตรง)
 *
 * อ่าน (store):  ฟังก์ชันอ่านของ @nightout/mock ทำงานบน store ที่ services/sync.ts เติมข้อมูลจาก API
 * เขียน:         services/api/<domain>.ts → Rest → NestJS domains/<domain> → ฟังก์ชันใน DB → refresh
 * อ่านสด:        services/queries/<domain>.ts (TanStack Query) — โซนว่าง ทีมร้าน สมุดมัดจำ ค่าคอม คำเชิญ บัตรแชร์ ทีมงาน
 * ชื่อโดเมนเดียวกับ backend และ @nightout/contracts (ADR 0006) — ไล่เรื่องไหน grep ชื่อโดเมนนั้น
 */
export {
  autoCancelAt,
  barBookings,
  barReviews,
  CATEGORY_LABELS,
  currentUser,
  depositFor,
  favorites,
  getBar,
  getBarBySlug,
  getBooking,
  getState,
  listBars,
  myBookings,
  myNotifications,
  myReviews,
  promotionApplies,
  promptPayPayload,
  rankingByPeriod,
  reviewableBooking,
  safetyScore,
  SAFETY_LABELS,
  tierList,
  withTier,
} from '@nightout/mock';
export type {
  Bar,
  BarFilter,
  BarPromotion,
  BarWithTier,
  Booking,
  MenuItem,
  RankedBar,
  RankingPeriod,
  Review,
  ReviewMedia,
  SafetyValue,
} from '@nightout/mock';
export { DISTRICTS, MASTER, STYLES, currentProfile, myPrefs } from '@/services/sync';

// เขียน (ตามโดเมน)
export * from '@/services/api/booking';
export * from '@/services/api/deposit';
export * from '@/services/api/review';
export * from '@/services/api/bar';
export * from '@/services/api/bar-team';
export * from '@/services/api/account';
export * from '@/services/api/promotion';

// อ่านสด (TanStack Query)
export * from '@/services/queries/keys';
export * from '@/services/queries/booking';
export * from '@/services/queries/deposit';
export * from '@/services/queries/bar-team';
export * from '@/services/queries/billing';
export * from '@/services/queries/site-team';
