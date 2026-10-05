import {
  configureStore,
  getState,
  mutate,
  setSessionUserId,
  type AppNotification,
  type Bar,
  type Booking,
  type DemoUser,
  type PromotionOrder,
  type Review,
  type ReviewMedia,
} from '@nightout/mock';
import type { BookingStatus, UserRole } from '@nightout/types';
import { STYLE_LABELS, toBar, type BarDetailRow } from '@/services/barsRepo';
import { log, since } from '@/services/log';
import { Rest } from '@nightout/utils/rest';
import { signedUrls } from '@/services/storage';

/**
 * ดึงข้อมูลจาก NestJS API (Rest → GET /public/catalog, /me/overview) มาใส่ store ของ @nightout/mock (cache ฝั่งหน้าเว็บ) — ไม่ query DB ตรง (ADR 0002)
 * - สาธารณะ (ตอนเปิดเว็บ): ร้าน (bar_detail) · รีวิว (public_reviews) · ย่าน/สไตล์/แพ็กเกจโปรโมท/PromptPay
 * - ผู้ใช้ (หลังล็อกอิน): การจอง · มัดจำ · แจ้งเตือน · ร้านโปรด · รีวิวของฉัน · ร้านของฉัน (ทุกสถานะ) + การจองของร้าน
 * หน้าเว็บอ่านจาก store แบบเดิม (listBars, myBookings, ...) · การเขียนทั้งหมดไป NestJS (services/actions.ts) แล้วโหลดใหม่
 * ไม่มีข้อมูลเดโม: store ถูกล้างแล้วแทนด้วยข้อมูลจาก DB ทุกครั้ง
 */

// store เป็น cache ในหน่วยความจำอย่างเดียว (ไม่ JSON.stringify ทั้งก้อนลง localStorage ทุกครั้งที่ข้อมูลเปลี่ยน)
configureStore({ persist: false });

// ---------------------------------------------------------------------
// master data (ใช้ใน dropdown) — เติมค่าตอนเปิดเว็บก่อน render (main.tsx รอโหลดเสร็จ)
// ---------------------------------------------------------------------
export interface DistrictOpt {
  id: string;
  name: string;
}
export interface StyleOpt {
  id: string;
  key: string;
  label: string;
}
export interface PromotionPackage {
  id: string;
  name: string;
  placement: 'HOME_BANNER' | 'HOME_RECOMMENDED' | 'SEARCH_TOP';
  days: number;
  price: number;
}
export const MASTER = {
  districts: [] as DistrictOpt[],
  styles: [] as StyleOpt[],
  packages: [] as PromotionPackage[],
  depositPromptPay: { name: '', promptpayId: '' },
  promotionPromptPay: { name: '', promptpayId: '' },
};
/** ชื่อย่าน (เหมือน DISTRICTS เดิม) — array เดิมถูกเติมค่าในที่ */
export const DISTRICTS: string[] = [];
/** ชื่อสไตล์ (เหมือน STYLES เดิม) */
export const STYLES: string[] = [];


// ---------------------------------------------------------------------
// แปลงแถวจาก DB → รูปแบบที่หน้าเว็บใช้
// ---------------------------------------------------------------------
interface MediaRow {
  id: string;
  kind: 'IMAGE' | 'VIDEO';
  storage_path: string;
  thumb_path?: string | null;
  duration_sec?: number | null;
}
interface PublicReviewRow {
  id: string;
  bar_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  display_name: string | null;
  media: MediaRow[];
}
interface MyReviewRow extends Omit<PublicReviewRow, 'display_name'> {
  booking_id: string;
  status: Review['status'];
}
interface BookingDetailRow {
  id: string;
  code: string;
  status: BookingStatus;
  user_id: string;
  booking_datetime: string;
  pax: number;
  customer_note: string | null;
  cancel_reason: string | null;
  deposit_required: number;
  checked_in_at: string | null;
  created_at: string;
  bar: { id: string } | null;
  zone: { id: string; name: string } | null;
  table: { id: string; name: string } | null;
  promotion: { id: string | null; title: string } | null;
  deposit: {
    id: string;
    amount: number;
    status: 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
    reject_reason: string | null;
    settlement: string;
    verified_at: string | null;
    created_at: string;
  } | null;
  status_history: { from_status: BookingStatus | null; to_status: BookingStatus; reason: string | null; created_at: string }[];
  customer_name: string | null;
  share_token: string | null;
  has_review: boolean;
}
interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  payload: { link?: string } | null;
  read_at: string | null;
  created_at: string;
}
interface ListingRow {
  id: string;
  bar_id: string;
  placement: PromotionOrder['placement'];
  price_paid: number;
  status: string;
  created_at: string;
  promotion_packages: { name: string; duration_days: number } | null;
}

/** URL ชั่วคราวของไฟล์รีวิว (bucket review-media เป็น private) — ขอผ่าน API */
async function signReviewPaths(paths: string[]): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();
  try {
    return await signedUrls('review-media', paths, 6 * 3600);
  } catch (e) {
    log.warn('ขอ URL รูปรีวิวไม่สำเร็จ', (e as Error).message);
    return new Map();
  }
}

const mediaPaths = (rows: { media: MediaRow[] }[]) =>
  rows.flatMap((r) => r.media.flatMap((m) => [m.storage_path, m.thumb_path].filter((p): p is string => !!p)));

function toMedia(m: MediaRow, urls: Map<string, string>): ReviewMedia {
  return m.kind === 'VIDEO'
    ? {
        id: m.id,
        type: 'video',
        src: urls.get(m.storage_path),
        poster: m.thumb_path ? urls.get(m.thumb_path) : undefined,
        duration: m.duration_sec ?? undefined,
      }
    : { id: m.id, type: 'image', src: urls.get(m.storage_path) };
}

/** ใครเปลี่ยนสถานะ (DB เก็บเหตุผล ไม่ได้เก็บชื่อให้ลูกค้าเห็น) */
function historyBy(reason: string | null, customer: string): string {
  switch (reason) {
    case 'created':
    case 'deposit submitted':
    case 'customer cancelled':
      return customer;
    case 'deposit verified':
    case 'slip rejected':
      return 'NightOut';
    case 'timeout':
      return 'ระบบ';
    case null:
      return 'ร้าน';
    default:
      return reason === 'merchant' || reason === 'staff' || reason === 'check-in' ? 'ร้าน' : reason;
  }
}

function toBooking(r: BookingDetailRow): Booking {
  const userName = r.customer_name ?? 'ลูกค้า';
  const settlement = r.deposit?.settlement;
  return {
    id: r.id,
    code: r.code,
    barId: r.bar?.id ?? '',
    userId: r.user_id,
    userName,
    zoneId: r.zone?.id ?? '',
    tableId: r.table?.id,
    datetime: r.booking_datetime,
    pax: r.pax,
    status: r.status,
    depositRequired: Number(r.deposit_required),
    cancelReason: r.cancel_reason ?? undefined,
    depositRejectReason: r.deposit?.status === 'REJECTED' ? (r.deposit.reject_reason ?? undefined) : undefined,
    promotionId: r.promotion?.id ?? undefined,
    promotionTitle: r.promotion?.title,
    deposit: r.deposit
      ? {
          amount: Number(r.deposit.amount),
          status: r.deposit.status,
          submittedAt: r.deposit.created_at,
          verifiedAt: r.deposit.verified_at ?? undefined,
          settlement:
            settlement && settlement !== 'NONE' && settlement !== 'REFUND_PENDING'
              ? (settlement as NonNullable<Booking['deposit']>['settlement'])
              : undefined,
        }
      : undefined,
    note: r.customer_note ?? undefined,
    createdAt: r.created_at,
    history: r.status_history.map((h) => ({
      from: h.from_status,
      to: h.to_status,
      by: historyBy(h.reason, userName),
      at: h.created_at,
    })),
    checkedInAt: r.checked_in_at ?? undefined,
    shareToken: r.share_token ?? '',
    reviewed: r.has_review,
  };
}

const toNotification = (n: NotificationRow): AppNotification => ({
  id: n.id,
  userId: n.user_id,
  title: n.title,
  body: n.body,
  link: n.payload?.link,
  createdAt: n.created_at,
  readAt: n.read_at ?? undefined,
});

// ---------------------------------------------------------------------
// cache ภายใน (แยกสาธารณะ / ผู้ใช้ แล้วรวมใส่ store)
// ---------------------------------------------------------------------
let publicBars: Bar[] = [];
let publicReviews: Review[] = [];
interface UserData {
  user: DemoUser;
  myBars: Bar[];
  bookings: Booking[];
  myReviews: Review[];
  reportedReviewIds: Set<string>;
  favorites: string[];
  notifications: AppNotification[];
  promotions: PromotionOrder[];
}
let userData: UserData | null = null;
let lastUserSignature = '';

function commit() {
  mutate((s) => {
    const mine = new Map((userData?.myBars ?? []).map((b) => [b.id, b]));
    s.bars = [...publicBars.filter((b) => !mine.has(b.id)), ...mine.values()];
    const reviews = new Map(publicReviews.map((r) => [r.id, r]));
    for (const r of userData?.myReviews ?? []) reviews.set(r.id, { ...reviews.get(r.id), ...r });
    s.reviews = [...reviews.values()].map((r) =>
      userData?.reportedReviewIds.has(r.id) ? { ...r, reported: true } : r,
    );
    s.bookings = userData?.bookings ?? [];
    s.notifications = userData?.notifications ?? [];
    s.favorites = userData ? { [userData.user.id]: userData.favorites } : {};
    s.promotions = userData?.promotions ?? [];
    s.users = userData ? [userData.user] : [];
    s.audit = [];
  });
}

// ---------------------------------------------------------------------
// โหลดข้อมูลสาธารณะ (ตอนเปิดเว็บ)
// ---------------------------------------------------------------------
interface PublicRaw {
  bars: BarDetailRow[];
  reviews: PublicReviewRow[];
  districts: { id: string; name_th: string }[];
  styles: { id: string; key: string; name_th: string }[];
  settings: { key: string; value: { name?: string; promptpay_id?: string } }[];
  packages: { id: string; name: string; placement: PromotionPackage['placement']; duration_days: number; price: number }[];
}

/** แปลงข้อมูลดิบ → master + store (ใช้ทั้งตอนโหลดจาก DB และตอนอ่าน snapshot ในเครื่อง) */
function applyPublic(raw: PublicRaw, urls: Map<string, string>) {
  MASTER.districts = raw.districts.map((d) => ({ id: d.id, name: d.name_th }));
  MASTER.styles = raw.styles.map((x) => ({ id: x.id, key: x.key, label: x.name_th }));
  for (const x of MASTER.styles) STYLE_LABELS[x.key] = x.label;
  DISTRICTS.splice(0, DISTRICTS.length, ...MASTER.districts.map((d) => d.name));
  STYLES.splice(0, STYLES.length, ...MASTER.styles.map((x) => x.label));
  for (const row of raw.settings) {
    const v = { name: row.value?.name ?? '', promptpayId: row.value?.promptpay_id ?? '' };
    if (row.key === 'deposit_promptpay') MASTER.depositPromptPay = v;
    if (row.key === 'promotion_promptpay') MASTER.promotionPromptPay = v;
  }
  MASTER.packages = raw.packages.map((p) => ({ id: p.id, name: p.name, placement: p.placement, days: p.duration_days, price: Number(p.price) }));
  publicBars = raw.bars.map(toBar);
  publicReviews = raw.reviews.map((r) => ({
    id: r.id,
    barId: r.bar_id,
    userName: r.display_name ?? 'ผู้ใช้ NightOut',
    rating: r.rating,
    comment: r.comment ?? '',
    createdAt: r.created_at,
    media: r.media.length ? r.media.map((m) => toMedia(m, urls)) : undefined,
    status: 'PUBLISHED',
  }));
  commit();
}

// ---------------------------------------------------------------------
// snapshot ข้อมูลสาธารณะในเครื่อง — เปิดเว็บครั้งถัดไปแสดงได้ทันที แล้วค่อยโหลดของใหม่เบื้องหลัง
// (URL รูปรีวิวเป็นลิงก์ชั่วคราว 6 ชม. → ไม่เก็บ ขอใหม่ทุกครั้ง)
// ---------------------------------------------------------------------
const SNAPSHOT_KEY = 'nightout-public-v1';
const SNAPSHOT_MAX_AGE = 24 * 3600_000;

function saveSnapshot(raw: PublicRaw) {
  const write = () => {
    try {
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ savedAt: Date.now(), raw }));
    } catch {
      /* เต็ม/ถูกปิด — ไม่เป็นไร ครั้งหน้าโหลดจาก DB ตามปกติ */
    }
  };
  if (window.requestIdleCallback) window.requestIdleCallback(write, { timeout: 5000 });
  else setTimeout(write, 1000);
}

/** มี snapshot ที่ยังไม่เก่าเกิน 24 ชม. → ใส่ store ทันที (คืน true) */
export function hydratePublicFromCache(): boolean {
  try {
    const v = localStorage.getItem(SNAPSHOT_KEY);
    if (!v) return false;
    const snap = JSON.parse(v) as { savedAt: number; raw: PublicRaw };
    if (!snap?.raw?.bars || Date.now() - snap.savedAt > SNAPSHOT_MAX_AGE) return false;
    applyPublic(snap.raw, new Map());
    log.ok(`แสดงข้อมูลจากเครื่องก่อน (${Math.round((Date.now() - snap.savedAt) / 60_000)} นาทีที่แล้ว) · กำลังโหลดของใหม่`);
    return true;
  } catch {
    return false;
  }
}

export async function loadPublic(): Promise<void> {
  const t0 = performance.now();
  const raw = await Rest.get<PublicRaw>('/public/catalog');
  // แสดงร้าน/รีวิวก่อน แล้วค่อยขอ URL รูป/วิดีโอรีวิวทีหลัง (ไม่ให้หน้าแรกต้องรอ)
  applyPublic(raw, new Map());
  saveSnapshot(raw);
  const paths = mediaPaths(raw.reviews);
  if (paths.length) void signReviewPaths(paths).then((urls) => applyPublic(raw, urls));
  log.ok(
    `โหลดข้อมูลจาก API สำเร็จ (${Rest.baseURL}) · ร้าน ${publicBars.length} · รีวิว ${publicReviews.length} · ย่าน ${MASTER.districts.length} · ${since(t0)}`,
  );
}

/** GET /me/overview (แถวจาก view ของ DB — snake_case) */
interface MeOverview {
  bookings: BookingDetailRow[];
  notifications: NotificationRow[];
  favorites: { id: string }[];
  reviews: MyReviewRow[];
  preferences: {
    preferred_style_ids: string[];
    preferred_district_ids: string[];
    budget_per_person: number | null;
    usual_pax: number | null;
  } | null;
  bars: BarDetailRow[];
  team_bookings: BookingDetailRow[];
  listings: ListingRow[];
  review_reports: { review_id: string }[];
}

// ---------------------------------------------------------------------
// โหลดข้อมูลของผู้ใช้ที่ล็อกอิน
// ---------------------------------------------------------------------
export interface SessionProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}
export interface UserPrefs {
  styleIds: string[];
  districtIds: string[];
  budget?: number;
  pax?: number;
}
export let myPrefs: UserPrefs = { styleIds: [], districtIds: [] };

/** คืน id ร้านหลักของผู้ใช้ (ร้านแรกที่เป็นเจ้าของ/อยู่ในทีม) */
export async function loadUser(p: SessionProfile): Promise<{ barId?: string }> {
  const t0 = performance.now();
  const o = await Rest.get<MeOverview>('/me/overview');
  const barRows = o.bars;
  const bars = barRows.map(toBar);
  // ร้านของฉัน: การจองทั้งหมดของร้าน + ประวัติโปรโมท (API รวมมาให้แล้ว)
  const teamBookings = o.team_bookings;
  const listings = o.listings;

  const own = o.bookings;
  const allBookings = new Map<string, Booking>();
  for (const r of [...own, ...teamBookings]) allBookings.set(r.id, toBooking(r));

  const myReviewRows = o.reviews;
  // โหลดซ้ำทุก 60 วิ: ถ้าข้อมูลเหมือนเดิมทุกอย่าง ไม่ต้องขอ URL รูปใหม่ / ไม่ re-render ทั้งแอป
  const signature = JSON.stringify(o);
  if (signature === lastUserSignature && userData?.user.id === p.id) return { barId: userData.user.barId };
  lastUserSignature = signature;
  const urls = await signReviewPaths(mediaPaths(myReviewRows));
  const pr = o.preferences;
  myPrefs = {
    styleIds: pr?.preferred_style_ids ?? [],
    districtIds: pr?.preferred_district_ids ?? [],
    budget: pr?.budget_per_person ? Number(pr.budget_per_person) : undefined,
    pax: pr?.usual_pax ?? undefined,
  };
  const primary =
    bars.find((b) => b.staffRole === 'OWNER' && b.status === 'APPROVED') ?? bars.find((b) => b.status === 'APPROVED') ?? bars[0];

  userData = {
    user: {
      id: p.id,
      email: p.email,
      displayName: p.displayName,
      role: p.role,
      barId: primary?.id,
      createdAt: new Date().toISOString(),
      preferences: {
        styles: MASTER.styles.filter((s) => myPrefs.styleIds.includes(s.id)).map((s) => s.label),
        districts: MASTER.districts.filter((d) => myPrefs.districtIds.includes(d.id)).map((d) => d.name),
        budget: myPrefs.budget,
        pax: myPrefs.pax,
      },
    },
    myBars: bars,
    bookings: [...allBookings.values()],
    myReviews: myReviewRows.map((r) => ({
      id: r.id,
      barId: r.bar_id,
      bookingId: r.booking_id,
      userId: p.id,
      userName: p.displayName,
      rating: r.rating,
      comment: r.comment ?? '',
      createdAt: r.created_at,
      media: r.media.length ? r.media.map((m) => toMedia(m, urls)) : undefined,
      status: r.status,
    })),
    reportedReviewIds: new Set(o.review_reports.map((x) => x.review_id)),
    favorites: o.favorites.map((f) => f.id),
    notifications: o.notifications.map(toNotification),
    promotions: listings.map((l) => ({
      id: l.id,
      barId: l.bar_id,
      packageName: `${l.promotion_packages?.name ?? 'แพ็กเกจ'} ${l.promotion_packages?.duration_days ?? ''} วัน`.trim(),
      placement: l.placement,
      days: l.promotion_packages?.duration_days ?? 0,
      price: Number(l.price_paid),
      status: l.status as PromotionOrder['status'],
      createdAt: l.created_at,
    })),
  };
  setSessionUserId(p.id);
  commit();
  log.ok(
    `โหลดข้อมูลผู้ใช้จาก API (${p.email} · ${p.role}) · การจอง ${userData.bookings.length} · แจ้งเตือน ${userData.notifications.length} · ร้านโปรด ${userData.favorites.length}${bars.length ? ` · ร้านของฉัน ${bars.length}` : ''} · ${since(t0)}`,
  );
  return { barId: primary?.id };
}

let lastProfile: SessionProfile | null = null;
let polling: ReturnType<typeof setInterval> | undefined;

/** เริ่มใช้ข้อมูลของผู้ใช้ + โหลดใหม่ทุก 60 วินาทีขณะเปิดหน้าอยู่ (แจ้งเตือน/สถานะการจอง) */
export async function startUser(p: SessionProfile) {
  lastProfile = p;
  const r = await loadUser(p);
  clearInterval(polling);
  polling = setInterval(() => {
    if (document.visibilityState === 'visible' && lastProfile) void loadUser(lastProfile).catch((e: Error) => log.warn('โหลดข้อมูลผู้ใช้ใหม่ไม่สำเร็จ', e.message));
  }, 60_000);
  return r;
}

export function clearUser() {
  lastProfile = null;
  lastUserSignature = '';
  clearInterval(polling);
  userData = null;
  myPrefs = { styleIds: [], districtIds: [] };
  setSessionUserId(null);
  commit();
}

/** โหลดใหม่หลังบันทึก (เรียกจาก services/actions.ts) */
export async function refresh(opts: { public?: boolean } = {}) {
  await Promise.all([opts.public ? loadPublic() : Promise.resolve(), lastProfile ? loadUser(lastProfile) : Promise.resolve()]);
}

/** ชื่อผู้ใช้ใน store (ใช้หลังแก้โปรไฟล์) */
export function currentProfile(): SessionProfile | null {
  return lastProfile;
}
export function setProfileName(displayName: string) {
  if (lastProfile) lastProfile = { ...lastProfile, displayName };
}

/** ใช้ใน dev tools: window.__nightout() ดูข้อมูลใน cache */
if (typeof window !== 'undefined') {
  (window as unknown as { __nightout: () => unknown }).__nightout = () => ({
    api: Rest.baseURL,
    bars: getState().bars.length,
    bookings: getState().bookings.length,
    reviews: getState().reviews.length,
    user: userData?.user ?? null,
  });
}
