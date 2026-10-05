/**
 * NightOut — Data structures (packages/types/src/database.ts)
 *
 * ชนิดตาราง/enum/function มาจาก `supabase gen types` (database.generated.ts — ห้ามแก้มือ)
 *   สร้างใหม่หลังแก้ migration: pnpm --filter @nightout/backend db:types
 * ไฟล์นี้ override เฉพาะ view ที่หน้าบ้านใช้ (jsonb → ชนิดจริง, คอลัมน์ที่ไม่มีทางเป็น null → non-null)
 * ตามสัญญาใน docs/DATABASE_CHANGES.md หัวข้อ 5 (กฎ "ไม่มีข้อมูล")
 *
 * ใช้: import { Db } from '@nightout/types'  →  Db.BarCard, Db.BarDetail, Db.Enums<'booking_status'>, Db.BOOKING_TRANSITIONS
 * ชื่อ key เป็น snake_case ตามหลังบ้าน (ไม่มีชั้นแปลงชื่อ)
 */
import type { Database, Json } from './database.generated';

export type { Database, Json };

type PublicSchema = Database['public'];
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];
type ViewRow<T extends keyof PublicSchema['Views']> = PublicSchema['Views'][T]['Row'];

/** view ที่ gen types ให้ทุกคอลัมน์เป็น nullable → บังคับคอลัมน์ที่รู้ว่าไม่ null ให้เป็น non-null + แทนชนิด jsonb */
type Override<Row, NonNull extends keyof Row, Json extends object> = Omit<Row, NonNull | keyof Json> & {
  [K in NonNull]-?: NonNullable<Row[K]>;
} & Json;

// ---------------------------------------------------------------------
// ชิ้นส่วน jsonb ที่ใช้ซ้ำ
// ---------------------------------------------------------------------
export type UUID = string;
export type ISODateTime = string;
export type ISODate = string;
/** "HH:MM" */
export type TimeHM = string;

export interface DistrictRef {
  id: UUID;
  slug: string;
  name_th: string;
}

/** key ตัวเล็กเสมอ 3 ตัว (หลังบ้านเก็บ enum ตัวใหญ่ MALE/FEMALE/LGBTQ) · ส่ง request_pr / p_pr_gender เป็นตัวใหญ่ */
export interface PrCounts {
  male: number;
  female: number;
  lgbtq: number;
}

export interface OpeningHour {
  day_of_week: number; // 0 = อาทิตย์
  open_time: TimeHM | null;
  close_time: TimeHM | null;
  is_closed: boolean;
}

export interface SpecialHour {
  date: ISODate;
  open_time: TimeHM | null;
  close_time: TimeHM | null;
  is_closed: boolean;
  note: string | null;
}

export interface MediaItem {
  id: UUID;
  kind: Enums<'media_kind'>;
  storage_path: string;
  caption?: string | null;
  thumb_path?: string | null;
  width: number | null;
  height: number | null;
  duration_sec: number | null;
}

export interface BarLinkItem {
  type: Enums<'link_type'>;
  url: string;
}

export interface BookingSettings {
  deposit_amount: number;
  deposit_unit: Enums<'deposit_unit'>;
  deposit_policy: string | null;
  refund_before_hours: number;
  grace_minutes: number;
  pending_timeout_minutes: number;
  deposit_timeout_minutes: number;
  max_pax_per_booking: number;
  min_advance_minutes: number;
  max_advance_days: number;
}

export interface FeeItem {
  fee_type: Enums<'fee_type'>;
  label: string;
  calc: Enums<'fee_calc'>;
  value: number;
}

export interface MenuEntry {
  id: UUID;
  category: string | null;
  name: string;
  description: string | null;
  price: number;
  unit_label: string | null;
  image_path: string | null;
  is_available: boolean;
}

export interface PackageEntry {
  id: UUID;
  name: string;
  description: string | null;
  pax_min: number;
  pax_max: number;
  total_price: number;
  fees_included: boolean;
  items: { menu_item_id: UUID | null; name: string; quantity: number; unit_price: number }[];
}

export interface PromotionEntry {
  id: UUID;
  title: string;
  description: string | null;
  perk_type: Enums<'perk_type'>;
  discount_percent: number | null;
  days_of_week: number[];
  valid_from: ISODate | null;
  valid_to: ISODate | null;
  cutoff_time: TimeHM | null;
  min_pax: number | null;
}

export interface ZoneEntry {
  id: UUID;
  name: string;
  capacity_pax: number;
  default_duration_minutes: number;
  allow_zone_only_booking: boolean;
  tables: { id: UUID; name: string; seats: number }[];
}

export interface SafetyEntry {
  key: string;
  name_th: string;
  icon: string;
  value: Enums<'safety_value'>;
  source: Enums<'safety_source'> | null;
  verified_at: ISODateTime | null;
}

// ---------------------------------------------------------------------
// view ที่หน้าบ้านใช้
// ---------------------------------------------------------------------
type BarCardNonNull =
  | 'id' | 'slug' | 'name' | 'category' | 'lat' | 'lng' | 'has_pr' | 'is_new'
  | 'rating_count' | 'checkin_count' | 'is_editor_pick' | 'is_promoted';
type BarCardJson = { district: DistrictRef | null; styles: string[]; pr_counts: PrCounts };

/** bar_cards — ลิสต์ร้าน / แผนที่ / ranking (styles = key ตัวใหญ่ เช่น 'ROOFTOP') */
export type BarCard = Override<ViewRow<'bar_cards'>, BarCardNonNull, BarCardJson>;

/** bar_detail — หน้ารายละเอียดร้าน (หนึ่งหน้า = หนึ่งการเรียก) */
export type BarDetail = Override<
  ViewRow<'bar_detail'>,
  BarCardNonNull | 'address' | 'perks',
  BarCardJson & {
    hours: OpeningHour[];
    special_hours: SpecialHour[];
    media: MediaItem[];
    links: BarLinkItem[];
    booking_settings: BookingSettings | null;
    fees: FeeItem[];
    menu: MenuEntry[];
    packages: PackageEntry[];
    promotions: PromotionEntry[];
    zones: ZoneEntry[];
    safety: SafetyEntry[];
  }
>;

/** public_reviews — ไม่มี email/birthdate · display_name เป็น null ได้ถ้าบัญชีถูกลบ */
export type PublicReview = Override<
  ViewRow<'public_reviews'>,
  'id' | 'bar_id' | 'rating' | 'created_at',
  { media: MediaItem[] }
>;

export type MyBar = Override<
  ViewRow<'my_bars'>,
  'id' | 'slug' | 'name' | 'category' | 'status' | 'staff_role' | 'is_new' | 'rating_count' | 'checkin_count' | 'created_at' | 'updated_at',
  { district: DistrictRef | null }
>;

export interface BookingBarRef {
  id: UUID;
  slug: string;
  name: string;
  cover_image_url: string | null;
  cover_style: string | null;
}

export type MyBooking = Override<
  ViewRow<'my_bookings'>,
  'id' | 'code' | 'status' | 'booking_datetime' | 'pax' | 'deposit_required' | 'auto_cancel_at' | 'created_at' | 'updated_at',
  { bar: BookingBarRef | null }
>;

export interface DepositSummary {
  id: UUID;
  amount: number;
  status: Enums<'deposit_status'>;
  reject_reason: string | null;
  settlement: Enums<'deposit_settlement'>;
  verified_at: ISODateTime | null;
  created_at: ISODateTime;
}

export type BookingDetail = Override<
  ViewRow<'booking_detail'>,
  | 'id' | 'code' | 'status' | 'user_id' | 'is_mine' | 'booking_datetime' | 'reserved_from' | 'reserved_until'
  | 'pax' | 'deposit_required' | 'grace_minutes' | 'auto_cancel_at' | 'created_at' | 'updated_at',
  {
    bar: (BookingBarRef & { address: string; lat: number; lng: number }) | null;
    zone: { id: UUID; name: string } | null;
    table: { id: UUID; name: string; seats: number } | null;
    promotion: { id: UUID | null; title: string; perk: Json; redeemed_at: ISODateTime | null } | null;
    price_estimate: {
      items: { menu_item_id: UUID | null; name: string; qty: number; unit_price: number }[];
      subtotal: number;
      service_charge_rate: number;
      vat_rate: number;
      other_fees: { label: string; calc: Enums<'fee_calc'>; value: number; amount: number }[];
      estimated_total: number;
      per_person: number;
    } | null;
    package: { package_id: UUID | null; name: string; items: Json; price: number; fees: Json } | null;
    deposit: DepositSummary | null;
    checkin: { checked_in_at: ISODateTime; method: Enums<'checkin_method'>; actual_pax: number | null } | null;
    status_history: {
      from_status: Enums<'booking_status'> | null;
      to_status: Enums<'booking_status'>;
      reason: string | null;
      created_at: ISODateTime;
    }[];
  }
>;

export type MyFavorite = BarCard & { favorited_at: ISODateTime };

/** rpc('nearby_bars') */
export type NearbyBar = BarCard & { distance_m: number };

/** rpc('search_bars') args */
export type SearchBarsArgs = PublicSchema['Functions']['search_bars']['Args'];

// ---------------------------------------------------------------------
// Backoffice (view admin_* — อ่านได้เฉพาะ ADMIN ที่ผ่าน MFA · ผู้อื่นได้แถวว่าง)
// การกระทำทั้งหมดส่งผ่าน NestJS /api/admin/* (เรียกฟังก์ชัน admin_* ด้วย service_role + audit log)
// ---------------------------------------------------------------------
export interface IdName {
  id: UUID;
  name: string;
}
export interface UserRef {
  id: UUID;
  email: string;
  display_name: string;
}

export type AdminUser = Override<
  ViewRow<'admin_users'>,
  'id' | 'email' | 'display_name' | 'role' | 'created_at' | 'fake_slip_count',
  {
    bars: { id: UUID; slug: string; name: string; role: Enums<'bar_staff_role'> }[];
    /** เบอร์ที่ถูกแบนเพราะบัญชีนี้ (E.164) */
    banned_phones: string[];
  }
>;

export type AdminBar = Override<
  ViewRow<'admin_bars'>,
  'id' | 'slug' | 'name' | 'category' | 'status' | 'created_at' | 'is_new' | 'rating_count' | 'checkin_count' | 'is_editor_pick' | 'is_promoted',
  { district: DistrictRef | null; owner: UserRef | null }
>;

export interface AdminStatusHistory {
  from_status: Enums<'booking_status'> | null;
  to_status: Enums<'booking_status'>;
  reason: string | null;
  created_at: ISODateTime;
  /** ชื่อผู้เปลี่ยน · null = ระบบ */
  changed_by: string | null;
}

export type AdminBooking = Override<
  ViewRow<'admin_bookings'>,
  'id' | 'code' | 'status' | 'booking_datetime' | 'pax' | 'deposit_required' | 'created_at',
  {
    bar: IdName;
    customer: UserRef | null;
    status_history: AdminStatusHistory[];
    /** หลักฐานการยอมรับเงื่อนไขริบมัดจำตอน Checkout (booking_deposit_consents) */
    deposit_consent: AdminDepositConsent | null;
  }
>;

export interface AdminDepositConsent {
  terms_version: string;
  terms_text: string;
  deposit_amount: number;
  refund_before_hours: number;
  grace_minutes: number;
  deposit_policy: string | null;
  ip: string | null;
  user_agent: string | null;
  accepted_at: ISODateTime;
}

/** เหตุผลที่แอดมินปฏิเสธสลิป (ข้อความ: DEPOSIT_REJECT_REASONS ใน @nightout/utils) */
export type DepositRejectCode = 'FAKE_SLIP' | 'AMOUNT_MISMATCH' | 'WRONG_ACCOUNT' | 'UNREADABLE' | 'DUPLICATE' | 'OTHER';

export type AdminDeposit = Override<
  ViewRow<'admin_deposits'>,
  'id' | 'amount' | 'status' | 'settlement' | 'created_at' | 'customer_fake_slip_count' | 'customer_banned',
  {
    reject_code: DepositRejectCode | null;
    booking: { id: UUID; code: string; status: Enums<'booking_status'>; booking_datetime: ISODateTime; pax: number };
    bar: IdName;
    customer: UserRef | null;
    /** บัญชีรับเงินหลักของร้าน (เลขบัญชีแสดงแค่ 4 ตัวท้าย) */
    payout_account: { bank_code: string; account_name: string; account_no_last4: string } | null;
  }
>;

export type AdminReview = Override<
  ViewRow<'admin_reviews'>,
  'id' | 'rating' | 'status' | 'created_at' | 'open_report_count',
  {
    bar: IdName;
    reports: { reason: string; detail: string | null; status: Enums<'report_status'>; created_at: ISODateTime }[];
  }
>;

export type AdminSafetyItem = Override<
  ViewRow<'admin_safety_queue'>,
  'id' | 'feature_key' | 'name_th' | 'value' | 'source' | 'updated_at' | 'open_inaccurate_reports',
  { bar: IdName }
>;

export type AdminPromotedListing = Override<
  ViewRow<'admin_promoted_listings'>,
  'id' | 'placement' | 'price_paid' | 'status' | 'created_at',
  {
    bar: IdName;
    package: { id: UUID; name: string; duration_days: number };
    latest_payment: { id: UUID; amount: number; slip_path: string | null; status: string; created_at: ISODateTime } | null;
  }
>;

export type AdminBillingEvent = Override<
  ViewRow<'admin_billing_events'>,
  'id' | 'event_type' | 'base_amount' | 'amount' | 'status' | 'created_at' | 'booking_code',
  { bar: IdName }
>;

export type AdminAuditLog = Override<
  ViewRow<'admin_audit_logs'>,
  'id' | 'action' | 'entity_type' | 'created_at',
  { actor: UserRef | null }
>;

export type AdminDashboard = PublicSchema['Functions']['admin_dashboard']['Returns'][number];

/** โปรโมชันของร้านที่รอแอดมินตรวจถ้อยคำ */
export type AdminBarPromotion = Override<
  ViewRow<'admin_bar_promotions'>,
  'id' | 'title' | 'active' | 'moderation_status' | 'created_at',
  { bar: IdName; days_of_week: number[] }
>;

// ---------------------------------------------------------------------
// ร้านค้า / ลูกค้า (migration …001700)
// ---------------------------------------------------------------------
/** my_bar_detail — ร้านของฉัน (ทุกสถานะ) รูปแบบเดียวกับ BarDetail + สถานะ/บทบาท/บัญชีรับเงิน · promotions มี active + moderation_status */
export type MyBarDetail = Override<
  ViewRow<'my_bar_detail'>,
  BarCardNonNull | 'address' | 'perks' | 'status' | 'staff_role' | 'created_at' | 'updated_at',
  BarCardJson & {
    hours: OpeningHour[];
    links: BarLinkItem[];
    booking_settings: BookingSettings | null;
    fees: FeeItem[];
    menu: MenuEntry[];
    packages: PackageEntry[];
    promotions: (PromotionEntry & { active: boolean; moderation_status: Enums<'moderation_status'> })[];
    zones: ZoneEntry[];
    safety: SafetyEntry[];
    payout_account: { bank_code: string; account_name: string; account_no_last4: string; verified_at: ISODateTime | null } | null;
  }
>;

/** my_reviews — รีวิวของฉัน (ทุกสถานะ) */
export type MyReview = Override<
  ViewRow<'my_reviews'>,
  'id' | 'booking_id' | 'bar_id' | 'rating' | 'status' | 'created_at',
  { bar: { id: UUID; slug: string; name: string }; media: MediaItem[] }
>;

/** rpc('zone_availability', {p_bar, p_datetime}) */
export type ZoneAvailability = PublicSchema['Functions']['zone_availability']['Returns'][number];

// ---------------------------------------------------------------------
// ทีมงานหน้า /about (migration …001800)
// ---------------------------------------------------------------------
/** team_members.contacts — key ที่ไม่มี/ค่าว่าง = ไม่แสดงไอคอนนั้น */
export interface TeamContacts {
  /** URL เต็ม */
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  github?: string;
  linkedin?: string;
  /** LINE ID หรือ URL */
  line?: string;
  email?: string;
  phone?: string;
}

/** public_team — ทีมงานที่ active เรียงตาม sort_order */
export type PublicTeamMember = Override<
  ViewRow<'public_team'>,
  'id' | 'nickname' | 'roles' | 'skills' | 'sort_order',
  { contacts: TeamContacts }
>;

/** admin_team_members (migration 20261003000100) — ทุกคนรวมที่ซ่อนอยู่ · Backoffice "ทีมงาน" */
export type AdminTeamMember = Omit<Tables<'team_members'>, 'contacts'> & { contacts: TeamContacts };

// ---------------------------------------------------------------------
// กฎธุรกิจที่ต้องตรงกับ DB
// ---------------------------------------------------------------------
export type BookingStatus = Enums<'booking_status'>;
export type TransitionActor = 'SYSTEM' | 'CUSTOMER' | 'MERCHANT' | 'STAFF' | 'ADMIN';

/** ต้องตรงกับ booking_transition_allowed() ใน migration 20261002000600 (TS บอกเพิ่มว่าใครทำได้) */
export const BOOKING_TRANSITIONS: Record<BookingStatus, Partial<Record<BookingStatus, TransitionActor[]>>> = {
  PENDING: {
    AWAITING_DEPOSIT: ['SYSTEM'],
    CONFIRMED: ['MERCHANT'],
    REJECTED: ['MERCHANT'],
    CANCELLED_BY_CUSTOMER: ['CUSTOMER'],
    EXPIRED: ['SYSTEM'],
  },
  AWAITING_DEPOSIT: {
    DEPOSIT_SUBMITTED: ['CUSTOMER'],
    CANCELLED_BY_CUSTOMER: ['CUSTOMER'],
    EXPIRED: ['SYSTEM'],
  },
  DEPOSIT_SUBMITTED: {
    CONFIRMED: ['ADMIN'],
    AWAITING_DEPOSIT: ['ADMIN'], // สลิปไม่ผ่าน ให้ส่งใหม่
    REJECTED: ['ADMIN', 'MERCHANT'], // → มัดจำ REFUND_PENDING อัตโนมัติ
    CANCELLED_BY_CUSTOMER: ['CUSTOMER'], // → มัดจำ REFUND_PENDING อัตโนมัติ
  },
  CONFIRMED: {
    CHECKED_IN: ['STAFF', 'MERCHANT'],
    NO_SHOW: ['SYSTEM'],
    CANCELLED_BY_CUSTOMER: ['CUSTOMER'],
    CANCELLED_BY_MERCHANT: ['MERCHANT'],
  },
  CHECKED_IN: { COMPLETED: ['MERCHANT', 'SYSTEM'] },
  REJECTED: {},
  CANCELLED_BY_CUSTOMER: {},
  CANCELLED_BY_MERCHANT: {},
  COMPLETED: {},
  NO_SHOW: {},
  EXPIRED: {},
};

/** สถานะที่ยังถือโต๊ะ/ความจุโซน (ตรงกับ exclusion constraint bookings_no_table_overlap) */
export const ACTIVE_BOOKING_STATUSES: readonly BookingStatus[] = [
  'PENDING', 'AWAITING_DEPOSIT', 'DEPOSIT_SUBMITTED', 'CONFIRMED', 'CHECKED_IN',
];

export function canTransition(from: BookingStatus, to: BookingStatus, actor: TransitionActor): boolean {
  return BOOKING_TRANSITIONS[from][to]?.includes(actor) ?? false;
}

/** ดาว → Tier (ตรงกับ CHECK ใน bar_stats / tier_scores) */
export function starsToTier(stars: 1 | 2 | 3 | 4 | 5): Enums<'tier_letter'> {
  return stars === 5 ? 'S' : stars === 4 ? 'A' : stars === 3 ? 'B' : 'C';
}

/** pr_counts (key ตัวเล็ก) → ค่า enum ที่ต้องส่งกลับหลังบ้าน (ตัวใหญ่) */
export const PR_GENDER_KEYS = { male: 'MALE', female: 'FEMALE', lgbtq: 'LGBTQ' } as const satisfies Record<
  keyof PrCounts,
  Enums<'pr_gender'>
>;
