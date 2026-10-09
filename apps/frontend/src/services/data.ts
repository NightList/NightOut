/**
 * ข้อมูลใน store ที่หน้าเว็บใช้ (catalog + ของผู้ใช้) — หน้า import จากที่นี่ ไม่ import @nightout/mock ตรง
 *
 * อ่าน (store):  ฟังก์ชันอ่านของ @nightout/mock ทำงานบน store ที่ services/sync.ts เติมข้อมูลจาก API
 * เรียก API รายเส้น (อ่านสด/เขียน): อยู่ใน modules/<หน้า>/api.ts ของหน้านั้น (ADR 0007) — ไม่ผ่านไฟล์นี้
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
  BarPhoto,
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

