/**
 * จุดเดียวที่หน้าเว็บใช้อ่าน/เขียนข้อมูล (แทน import จาก @nightout/mock ตรง ๆ)
 *
 * อ่าน: ฟังก์ชันอ่านเดิมของ @nightout/mock ทำงานบน store ที่ services/sync.ts เติมข้อมูลจาก API
 *       (ร้าน รีวิว การจอง แจ้งเตือน ร้านโปรด ร้านของฉัน) — ไม่มีข้อมูลเดโม
 * เขียน: services/actions.ts → NestJS → ฟังก์ชันใน DB แล้วโหลดใหม่
 * ข้อมูลที่ต้องถามสด (โซนว่าง สมาชิกทีม สมุดมัดจำ ค่าคอม คำเชิญ) ใช้ hook ด้านล่าง (TanStack Query)
 *   Component → hook (TanStack Query) → Rest (@nightout/utils/rest) → Axios → NestJS — ไม่ query DB ตรง (ADR 0002)
 */
import { useQuery } from '@tanstack/react-query';
import type { BarWithTier } from '@nightout/mock';
import type { Db } from '@nightout/types';
import { Rest } from '@nightout/utils/rest';

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
export * from '@/services/actions';


export interface ZoneSlot {
  zone: BarWithTier['zones'][number];
  remainingPax: number;
  freeTables: number;
  full: boolean;
}

/** โซนว่างของร้านในเวลาที่เลือก (DB นับการจองของทุกคนให้ — ลูกค้าเห็นการจองคนอื่นไม่ได้) */
export function useZoneAvailability(bar: BarWithTier | null, datetimeIso: string) {
  return useQuery({
    queryKey: ['zone_availability', bar?.id, datetimeIso],
    enabled: !!bar,
    staleTime: 15_000,
    queryFn: async (): Promise<ZoneSlot[]> => {
      const rows = await Rest.get<{ zone_id: string; remaining_pax: number; free_tables: number; full: boolean }[]>(
        `/bars/${bar!.id}/zone-availability`,
        { params: { datetime: datetimeIso } },
      );
      return rows
        .map((r) => {
          const zone = bar!.zones.find((z) => z.id === r.zone_id);
          return zone ? { zone, remainingPax: r.remaining_pax, freeTables: r.free_tables, full: r.full } : null;
        })
        .filter((x): x is ZoneSlot => x !== null);
    },
  });
}

export interface TeamMember {
  user_id: string;
  display_name: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  invited_at: string;
  accepted_at: string | null;
}
export const useBarTeam = (barId: string) =>
  useQuery({ queryKey: ['bar_team', barId], queryFn: () => Rest.get<TeamMember[]>(`/merchant/bars/${barId}/team`) });

export interface Invite {
  bar_id: string;
  bar_name: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  invited_at: string;
  invited_by: string | null;
}
export const useMyInvites = (enabled: boolean) =>
  useQuery({ queryKey: ['my_invites'], enabled, queryFn: () => Rest.get<Invite[]>('/me/invites') });

export interface LedgerRow {
  deposit_id: string;
  booking_id: string;
  booking_code: string;
  booking_datetime: string;
  customer_name: string | null;
  amount: number;
  status: 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  settlement: 'NONE' | 'HELD' | 'PAYOUT_PENDING' | 'PAID_OUT' | 'CREDIT' | 'REFUND_PENDING' | 'REFUNDED';
  verified_at: string | null;
  settled_at: string | null;
  created_at: string;
}
export const useBarLedger = (barId: string) =>
  useQuery({ queryKey: ['bar_deposit_ledger', barId], queryFn: () => Rest.get<LedgerRow[]>(`/merchant/bars/${barId}/deposit-ledger`) });

/** โซน/โต๊ะที่ย้ายการจองไปได้ (ปุ่ม "ย้ายโต๊ะ") */
export interface TableOption {
  zone_id: string;
  zone_name: string;
  table_id: string | null;
  table_name: string | null;
  seats: number | null;
  available: boolean;
  is_current: boolean;
  zone_remaining_pax: number;
}
export const useTableOptions = (barId: string, bookingId: string | null) =>
  useQuery({
    queryKey: ['table_options', bookingId],
    enabled: !!bookingId,
    staleTime: 0,
    queryFn: () => Rest.get<TableOption[]>(`/merchant/bars/${barId}/bookings/${bookingId}/table-options`),
  });

export interface BillingRow {
  id: string;
  event_type: 'CHECK_IN' | 'NO_SHOW';
  base_amount: number;
  amount: number;
  status: 'PENDING' | 'INVOICED' | 'PAID' | 'WAIVED';
  period: string;
  created_at: string;
  booking: { code: string; booking_datetime: string } | null;
}
export const useBillingEvents = (barId: string) =>
  useQuery({
    queryKey: ['billing_events', barId],
    queryFn: () => Rest.get<BillingRow[]>(`/merchant/bars/${barId}/billing-events`),
  });

export interface ShareCard {
  booking_datetime: string;
  pax: number;
  status: string;
  zone_name: string;
  bar_name: string;
  bar_slug: string;
  address: string;
  lat: number;
  lng: number;
  host_first_name: string;
  going_count: number;
}
/** บัตรจองสาธารณะจากลิงก์แชร์ (ไม่มีข้อมูลส่วนตัว) */
export const useShareCard = (token: string) =>
  useQuery({
    queryKey: ['share_card', token],
    queryFn: () => Rest.get<ShareCard | null>(`/share-cards/${encodeURIComponent(token)}`),
  });

/** ทีมงานหน้า /about (view public_team — เฉพาะคนที่ active เรียงตาม sort_order) */
export type SiteTeamMember = Db.PublicTeamMember;
export const useSiteTeam = () =>
  useQuery({
    queryKey: ['public_team'],
    staleTime: 10 * 60_000,
    queryFn: () => Rest.get<SiteTeamMember[]>('/public/team'),
  });
