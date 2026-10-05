import type { BarCategory, BookingStatus, CrowdStatus, Tier } from '@nightout/types';
import {
  canTransition,
  HOLDING_STATUSES,
  isNewBar,
  scoreToStars,
  starsToTier,
} from '@nightout/utils';
import type {
  AppNotification,
  Bar,
  BarPromotion,
  BarWithTier,
  Booking,
  DemoUser,
  DepositSettlement,
  PromotionOrder,
  Review,
  ReviewMedia,
} from './models';
import { DEMO_USERS } from './seed';
import { getSessionUserId, getState, mutate, setSessionUserId } from './store';

const uid = (p: string) =>
  `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => new Date().toISOString();

/* =========================== Bars / Ranking =========================== */

export function withTier(bar: Bar): BarWithTier {
  const isNew = isNewBar(bar.reviewCount);
  const stars = isNew ? null : scoreToStars(bar.score);
  return { ...bar, isNew, stars, tier: stars ? starsToTier(stars) : null };
}

export function safetyScore(bar: Bar): number {
  const yes = bar.safety.filter((s) => s.value === 'YES').length;
  return Math.round((yes / bar.safety.length) * 100);
}

export interface BarFilter {
  q?: string;
  category?: BarCategory | 'ALL';
  district?: string;
  styles?: string[];
  maxBudget?: number;
  crowd?: CrowdStatus[];
  minSafety?: number;
  /** ร้านที่มี PR (ชายหรือหญิงอย่างน้อย 1 คน) */
  hasPR?: boolean;
  sort?: 'relevance' | 'rating' | 'price' | 'safety';
}

export function listBars(filter: BarFilter = {}): BarWithTier[] {
  const q = filter.q?.trim().toLowerCase();
  let bars = getState()
    .bars.filter((b) => b.status === 'APPROVED')
    .filter((b) => !filter.category || filter.category === 'ALL' || b.category === filter.category)
    .filter((b) => !filter.district || b.district === filter.district)
    .filter((b) => !filter.styles?.length || filter.styles.every((s) => b.styles.includes(s)))
    .filter((b) => !filter.maxBudget || b.avgPerPerson <= filter.maxBudget)
    .filter((b) => !filter.crowd?.length || filter.crowd.includes(b.crowd))
    .filter((b) => !filter.minSafety || safetyScore(b) >= filter.minSafety)
    .filter((b) => !filter.hasPR || b.pr.male + b.pr.female + (b.pr.lgbtq ?? 0) > 0)
    .filter(
      (b) =>
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.district.includes(q) ||
        b.styles.some((s) => s.toLowerCase().includes(q)),
    )
    .map(withTier);
  const sort = filter.sort ?? 'relevance';
  bars = [...bars].sort((a, b) => {
    if (sort === 'price') return a.avgPerPerson - b.avgPerPerson;
    if (sort === 'safety') return safetyScore(b) - safetyScore(a);
    if (sort === 'rating') return b.rating - a.rating;
    // relevance: ร้านโปรโมทขึ้นก่อน (ติดป้ายโฆษณา) แล้วเรียงตามคะแนน
    return Number(b.promoted) - Number(a.promoted) || b.score - a.score;
  });
  return bars;
}

export function getBarBySlug(slug: string): BarWithTier | null {
  const b = getState().bars.find((x) => x.slug === slug);
  return b ? withTier(b) : null;
}

export function getBar(id: string): BarWithTier | null {
  const b = getState().bars.find((x) => x.id === id);
  return b ? withTier(b) : null;
}

export function tierList(
  category: BarCategory | 'ALL' = 'ALL',
  district?: string,
): Record<Tier, BarWithTier[]> {
  const out: Record<Tier, BarWithTier[]> = { S: [], A: [], B: [], C: [] };
  for (const b of listBars({ category, district, sort: 'rating' })) if (b.tier) out[b.tier].push(b);
  (Object.keys(out) as Tier[]).forEach((t) => out[t].sort((a, b) => b.score - a.score));
  return out;
}

export type RankingPeriod = 'WEEK' | 'MONTH';

export interface RankedBar extends BarWithTier {
  rank: number;
  /** โหวตจากคนที่เช็กอินจริงในช่วงนั้น */
  votes: number;
}

/** เลข ISO week ของวันที่ — ใช้เป็น seed ให้อันดับรายสัปดาห์เปลี่ยนทุกสัปดาห์ */
function isoWeek(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-W${Math.ceil(((t.getTime() - y.getTime()) / 86_400_000 + 1) / 7)}`;
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/**
 * อันดับรายสัปดาห์ / รายเดือน ตามจำนวนโหวต (เดโม: คำนวณจากคะแนนร้าน + สุ่มแบบคงที่ต่อช่วงเวลา)
 * ของจริง: นับจากตาราง votes ที่ผูกกับ booking ที่เช็กอินแล้วในช่วงนั้น
 */
export function rankingByPeriod(
  period: RankingPeriod,
  category: BarCategory | 'ALL' = 'ALL',
  now = new Date(),
): RankedBar[] {
  const key = period === 'WEEK' ? isoWeek(now) : `${now.getFullYear()}-${now.getMonth() + 1}`;
  const scale = period === 'WEEK' ? 6 : 24;
  return listBars({ category })
    .filter((b) => !b.isNew)
    .map((b) => ({
      ...b,
      rank: 0,
      votes: Math.round((b.score * 0.9 + hash(`${key}:${b.id}`) * 38) * scale),
    }))
    .sort((a, b) => b.votes - a.votes)
    .map((b, i) => ({ ...b, rank: i + 1 }));
}

export function updateBar(id: string, patch: Partial<Bar>, actor = 'merchant'): void {
  mutate((s) => {
    const b = s.bars.find((x) => x.id === id);
    if (!b) throw new Error('ไม่พบร้าน');
    Object.assign(b, patch);
    s.audit.unshift({
      id: uid('au'),
      actor,
      action: 'UPDATE_BAR',
      target: `${b.name} · ${Object.keys(patch).join(', ')}`,
      at: nowIso(),
    });
  });
}

export function setCrowd(barId: string, crowd: CrowdStatus): void {
  mutate((s) => {
    const b = s.bars.find((x) => x.id === barId);
    if (b) {
      b.crowd = crowd;
      b.crowdUpdatedAt = nowIso();
    }
  });
}

/* =========================== Auth (demo) =========================== */

export function currentUser(): DemoUser | null {
  const id = getSessionUserId();
  return id ? (getState().users.find((u) => u.id === id) ?? null) : null;
}

export function demoLogin(email: string, remember = true): DemoUser {
  const user = getState().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  setSessionUserId(user.id, remember);
  return user;
}

export function demoLoginAs(role: keyof typeof DEMO_USERS): DemoUser {
  setSessionUserId(DEMO_USERS[role]);
  return currentUser()!;
}

export function demoRegister(input: { email: string; displayName: string }): DemoUser {
  const exists = getState().users.some((u) => u.email.toLowerCase() === input.email.toLowerCase());
  if (exists) throw new Error('อีเมลนี้ถูกใช้แล้ว');
  const user: DemoUser = {
    id: uid('u'),
    email: input.email,
    displayName: input.displayName,
    role: 'CUSTOMER',
    createdAt: nowIso(),
    preferences: { styles: [], districts: [] },
  };
  mutate((s) => void s.users.push(user));
  setSessionUserId(user.id);
  return user;
}

export function demoLogout(): void {
  setSessionUserId(null);
}

export function updateProfile(
  userId: string,
  patch: Partial<Pick<DemoUser, 'displayName' | 'preferences'>>,
): void {
  mutate((s) => {
    const u = s.users.find((x) => x.id === userId);
    if (u) Object.assign(u, patch);
  });
}

/* =========================== Availability =========================== */

const overlaps = (a: string, b: string, minutes: number) =>
  Math.abs(new Date(a).getTime() - new Date(b).getTime()) < minutes * 60_000;

export function availability(barId: string, datetime: string) {
  const bar = getBar(barId);
  if (!bar) return [];
  const holding = getState().bookings.filter(
    (b) => b.barId === barId && HOLDING_STATUSES.includes(b.status),
  );
  return bar.zones.map((z) => {
    const taken = holding.filter(
      (b) => b.zoneId === z.id && overlaps(b.datetime, datetime, z.defaultDurationMinutes),
    );
    const takenTables = new Set(taken.map((b) => b.tableId).filter(Boolean));
    const freeTables = z.tables.filter((t) => !takenTables.has(t.id));
    return { zone: z, freeTables, full: freeTables.length === 0 };
  });
}

/* =========================== Bookings =========================== */

function notify(userId: string, title: string, body: string, link?: string) {
  const n: AppNotification = { id: uid('nt'), userId, title, body, link, createdAt: nowIso() };
  getState().notifications.unshift(n);
}

function adminIds(): string[] {
  return getState()
    .users.filter((u) => u.role === 'ADMIN')
    .map((u) => u.id);
}

function merchantIdsOf(barId: string): string[] {
  return getState()
    .users.filter((u) => u.barId === barId)
    .map((u) => u.id);
}

export interface CreateBookingInput {
  barId: string;
  zoneId: string;
  datetime: string;
  pax: number;
  promotionId?: string;
  note?: string;
}

/** โปรโมชันนี้ใช้ได้กับเวลาจองนี้ไหม (วัน + ต้องเช็กอินก่อน cutoff) */
export function promotionApplies(p: BarPromotion, datetime: string): boolean {
  if (!p.active) return false;
  const d = new Date(datetime);
  if (p.days?.length && !p.days.includes(d.getDay())) return false;
  if (p.cutoffTime) {
    const [h, m] = p.cutoffTime.split(':').map(Number);
    if (d.getHours() * 60 + d.getMinutes() > h! * 60 + m!) return false;
  }
  return true;
}

/** จำนวนมัดจำของการจองนี้ (ต่อโต๊ะ หรือ ต่อคน) */
export function depositFor(bar: Bar, pax: number): number {
  return bar.deposit.unit === 'PER_PERSON' ? bar.deposit.amount * pax : bar.deposit.amount;
}

export function createBooking(input: CreateBookingInput): Booking {
  const user = currentUser();
  if (!user) throw new Error('กรุณาเข้าสู่ระบบ');
  const bar = getBar(input.barId);
  if (!bar) throw new Error('ไม่พบร้าน');
  const slot = availability(bar.id, input.datetime).find((a) => a.zone.id === input.zoneId);
  if (!slot || slot.full) throw new Error('โซนนี้เต็มแล้วในช่วงเวลานั้น ลองเลือกโซนหรือเวลาอื่น');
  const table = slot.freeTables.find((t) => t.seats >= input.pax) ?? slot.freeTables[0]!;

  const promo = bar.promotions.find((p) => p.id === input.promotionId);
  if (input.promotionId && (!promo || !promotionApplies(promo, input.datetime)))
    throw new Error('โปรโมชันนี้ใช้กับเวลาที่เลือกไม่ได้');
  // ทุกการจองต้องมัดจำ (เงินเข้าแพลตฟอร์มก่อน)
  const status: BookingStatus = 'AWAITING_DEPOSIT';
  const booking: Booking = {
    id: uid('bk'),
    code: `NL-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    barId: bar.id,
    userId: user.id,
    userName: user.displayName,
    zoneId: input.zoneId,
    tableId: table.id,
    datetime: input.datetime,
    pax: input.pax,
    status,
    promotionId: promo?.id,
    promotionTitle: promo?.title,
    note: input.note,
    createdAt: nowIso(),
    history: [{ from: null, to: status, by: user.displayName, at: nowIso() }],
    shareToken: uid('sh'),
  };
  mutate((s) => {
    s.bookings.unshift(booking);
    notify(
      user.id,
      'สร้างการจองแล้ว',
      `${bar.name} · ${fmtDate(booking.datetime)} · ${booking.pax} คน`,
      `/bookings/${booking.id}`,
    );
    merchantIdsOf(bar.id).forEach((m) =>
      notify(
        m,
        'มีการจองใหม่',
        `${user.displayName} · ${fmtDate(booking.datetime)} · ${booking.pax} คน`,
        '/merchant/bookings',
      ),
    );
  });
  return booking;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}

export function getBooking(id: string): Booking | null {
  return getState().bookings.find((b) => b.id === id) ?? null;
}

export function getBookingByShareToken(token: string): Booking | null {
  return getState().bookings.find((b) => b.shareToken === token) ?? null;
}

export function myBookings(): Booking[] {
  const u = currentUser();
  return u ? getState().bookings.filter((b) => b.userId === u.id) : [];
}

export function barBookings(barId: string): Booking[] {
  return getState()
    .bookings.filter((b) => b.barId === barId)
    .sort((a, b) => a.datetime.localeCompare(b.datetime));
}

type Actor = 'CUSTOMER' | 'MERCHANT' | 'STAFF' | 'SYSTEM' | 'ADMIN';

export function transition(id: string, to: BookingStatus, actor: Actor, by: string): Booking {
  return mutate((s) => {
    const b = s.bookings.find((x) => x.id === id);
    if (!b) throw new Error('ไม่พบการจอง');
    if (!canTransition(b.status, to, actor)) {
      throw new Error(`เปลี่ยนสถานะจาก ${b.status} เป็น ${to} ไม่ได้`);
    }
    b.history.push({ from: b.status, to, by, at: nowIso() });
    b.status = to;
    if (to === 'CHECKED_IN') b.checkedInAt = nowIso();
    // มัดจำที่แพลตฟอร์มถือไว้: มาใช้บริการ/ไม่มาตามนัด → เป็นของร้าน (รอโอน) · ยกเลิก → คืนลูกค้า
    if (b.deposit?.settlement === 'HELD') {
      if (to === 'CHECKED_IN' || to === 'NO_SHOW') {
        b.deposit.settlement = 'PAYOUT_PENDING';
        b.deposit.settledAt = nowIso();
      } else if (to === 'CANCELLED_BY_CUSTOMER' || to === 'CANCELLED_BY_MERCHANT' || to === 'REJECTED') {
        b.deposit.settlement = 'REFUNDED';
        b.deposit.settledAt = nowIso();
      }
    }
    const bar = s.bars.find((x) => x.id === b.barId)!;
    const msg: Partial<Record<BookingStatus, string>> = {
      CONFIRMED: 'ร้านยืนยันการจองแล้ว',
      REJECTED: 'ร้านไม่สามารถรับการจองนี้ได้',
      CANCELLED_BY_MERCHANT: 'ร้านยกเลิกการจอง',
      CHECKED_IN: 'เช็กอินสำเร็จ ขอให้สนุกนะ!',
      COMPLETED: 'ขอบคุณที่ใช้บริการ — รีวิวร้านได้แล้ว',
      NO_SHOW: 'การจองถูกยกเลิกเพราะเลยเวลาที่กำหนด',
      AWAITING_DEPOSIT: 'สลิปไม่ผ่าน กรุณาส่งใหม่',
    };
    if (msg[to])
      notify(b.userId, msg[to]!, `${bar.name} · ${fmtDate(b.datetime)}`, `/bookings/${b.id}`);
    return b;
  });
}

export function submitDeposit(id: string, slipDataUrl: string): void {
  const b = getBooking(id);
  if (!b) throw new Error('ไม่พบการจอง');
  const bar = getBar(b.barId)!;
  mutate((s) => {
    const bk = s.bookings.find((x) => x.id === id)!;
    const amount = depositFor(bar, bk.pax);
    bk.deposit = { amount, slipDataUrl, status: 'SUBMITTED', submittedAt: nowIso() };
    // เงินเข้าแพลตฟอร์ม → แอดมิน NightOut เป็นคนตรวจสลิป ร้านแค่รับทราบ
    adminIds().forEach((a) =>
      notify(a, 'มีสลิปมัดจำรอตรวจ', `${bar.name} · ${bk.userName} · ${amount} บาท`, '/deposits'),
    );
    merchantIdsOf(bar.id).forEach((m) =>
      notify(m, 'ลูกค้าโอนมัดจำแล้ว (รอ NightOut ตรวจ)', `${bk.userName} · ${amount} บาท`, '/merchant/bookings'),
    );
  });
  transition(id, 'DEPOSIT_SUBMITTED', 'CUSTOMER', b.userName);
}

/** แอดมิน NightOut ตรวจสลิป — ผ่าน = แพลตฟอร์มถือเงินไว้ (HELD) และยืนยันโต๊ะให้ */
export function reviewDeposit(id: string, ok: boolean, by: string): void {
  mutate((s) => {
    const bk = s.bookings.find((x) => x.id === id);
    if (bk?.deposit) {
      bk.deposit.status = ok ? 'VERIFIED' : 'REJECTED';
      if (ok) {
        bk.deposit.verifiedAt = nowIso();
        bk.deposit.settlement = 'HELD';
      }
    }
  });
  transition(id, ok ? 'CONFIRMED' : 'AWAITING_DEPOSIT', 'ADMIN', by);
}

/** แอดมินจ่ายมัดจำที่ค้างให้ร้าน: โอนเข้าบัญชีร้าน หรือเก็บเป็นเครดิตในร้าน */
export function settleDeposit(id: string, how: 'PAID_OUT' | 'CREDIT', by: string): void {
  mutate((s) => {
    const bk = s.bookings.find((x) => x.id === id);
    if (!bk?.deposit || bk.deposit.settlement !== 'PAYOUT_PENDING') return;
    bk.deposit.settlement = how;
    bk.deposit.settledAt = nowIso();
    s.audit.unshift({
      id: uid('au'),
      actor: by,
      action: how === 'PAID_OUT' ? 'DEPOSIT_PAID_OUT' : 'DEPOSIT_CREDIT',
      target: `${bk.code} · ${bk.deposit.amount} บาท`,
      at: nowIso(),
    });
  });
}

/** สรุปเงินมัดจำของร้าน: ถือไว้ / รอโอน / โอนแล้ว / เครดิต */
export function barLedger(barId: string) {
  const rows = getState().bookings.filter((b) => b.barId === barId && b.deposit?.settlement);
  const sum = (k: DepositSettlement) =>
    rows.filter((b) => b.deposit!.settlement === k).reduce((a, b) => a + b.deposit!.amount, 0);
  return {
    rows: [...rows].sort((a, b) => b.datetime.localeCompare(a.datetime)),
    held: sum('HELD'),
    payoutPending: sum('PAYOUT_PENDING'),
    paidOut: sum('PAID_OUT'),
    credit: sum('CREDIT'),
  };
}

/** มัดจำทั้งระบบ (แอดมิน): รอตรวจสลิป + รอโอนให้ร้าน */
export function platformDeposits() {
  const all = getState().bookings.filter((b) => b.deposit);
  return {
    toVerify: all.filter((b) => b.status === 'DEPOSIT_SUBMITTED'),
    toPayout: all.filter((b) => b.deposit!.settlement === 'PAYOUT_PENDING'),
    held: all.filter((b) => b.deposit!.settlement === 'HELD'),
    settled: all.filter((b) => ['PAID_OUT', 'CREDIT', 'REFUNDED'].includes(b.deposit!.settlement!)),
  };
}

/** Staff สแกน/กรอกรหัส → เช็กอิน */
export function checkInByCode(barId: string, codeOrToken: string, by: string): Booking {
  const v = codeOrToken.trim().toUpperCase();
  const b = getState().bookings.find(
    (x) => x.barId === barId && (x.code === v || [`NIGHTOUT:${x.id}`, `NIGHTLIST:${x.id}`].some((q) => q.toUpperCase() === v)),
  );
  if (!b) throw new Error('ไม่พบการจองนี้ในร้านของคุณ');
  if (b.status !== 'CONFIRMED') throw new Error(`สถานะปัจจุบันคือ ${b.status} — เช็กอินไม่ได้`);
  return transition(b.id, 'CHECKED_IN', 'STAFF', by);
}

/** งานตั้งเวลา (จำลอง pg_cron): NO_SHOW / EXPIRED */
export function runTimeouts(): { noShow: number; expired: number } {
  const now = Date.now();
  let noShow = 0;
  let expired = 0;
  for (const b of getState().bookings) {
    const bar = getBar(b.barId);
    const deadline = new Date(b.datetime).getTime() + (bar?.gracePeriodMinutes ?? 30) * 60_000;
    if (b.status === 'CONFIRMED' && now > deadline) {
      transition(b.id, 'NO_SHOW', 'SYSTEM', 'ระบบ');
      noShow++;
    } else if ((b.status === 'PENDING' || b.status === 'AWAITING_DEPOSIT') && now > deadline) {
      transition(b.id, 'EXPIRED', 'SYSTEM', 'ระบบ');
      expired++;
    }
  }
  return { noShow, expired };
}

export function autoCancelAt(b: Booking): Date {
  const bar = getBar(b.barId);
  return new Date(new Date(b.datetime).getTime() + (bar?.gracePeriodMinutes ?? 30) * 60_000);
}

/* =========================== Reviews =========================== */

/** ร้านนี้ผู้ใช้ปัจจุบันรีวิวได้ไหม — คืน booking ที่เช็กอินแล้วแต่ยังไม่รีวิว (ถ้ามี) */
export function reviewableBooking(barId: string): Booking | null {
  const u = currentUser();
  if (!u) return null;
  return (
    getState().bookings.find(
      (b) =>
        b.barId === barId &&
        b.userId === u.id &&
        ['CHECKED_IN', 'COMPLETED'].includes(b.status) &&
        !b.reviewed,
    ) ?? null
  );
}

export function barReviews(barId: string): Review[] {
  return getState()
    .reviews.filter((r) => r.barId === barId && (!r.status || r.status === 'PUBLISHED'))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function myReviews(): Review[] {
  const u = currentUser();
  return u ? getState().reviews.filter((r) => r.userId === u.id) : [];
}

export function addReview(
  bookingId: string,
  rating: number,
  comment: string,
  media: ReviewMedia[] = [],
): Review {
  const u = currentUser();
  const b = getBooking(bookingId);
  if (!u || !b) throw new Error('ไม่พบการจอง');
  if (!['CHECKED_IN', 'COMPLETED'].includes(b.status))
    throw new Error('รีวิวได้หลังเช็กอินแล้วเท่านั้น');
  if (b.reviewed) throw new Error('รีวิวการจองนี้ไปแล้ว');
  const review: Review = {
    id: uid('rv'),
    barId: b.barId,
    bookingId,
    userId: u.id,
    userName: u.displayName,
    rating,
    comment,
    createdAt: nowIso(),
    media: media.length ? media : undefined,
  };
  mutate((s) => {
    s.reviews.unshift(review);
    s.bookings.find((x) => x.id === bookingId)!.reviewed = true;
    const bar = s.bars.find((x) => x.id === b.barId)!;
    bar.rating =
      Math.round(((bar.rating * bar.reviewCount + rating) / (bar.reviewCount + 1)) * 10) / 10;
    bar.reviewCount += 1;
  });
  return review;
}

export function setReviewReported(id: string, reported: boolean): void {
  mutate((s) => {
    const r = s.reviews.find((x) => x.id === id);
    if (r) r.reported = reported;
  });
}

export function deleteReview(id: string, actor: string): void {
  mutate((s) => {
    const r = s.reviews.find((x) => x.id === id);
    s.reviews = s.reviews.filter((x) => x.id !== id);
    if (r)
      s.audit.unshift({
        id: uid('au'),
        actor,
        action: 'REMOVE_REVIEW',
        target: r.comment.slice(0, 40),
        at: nowIso(),
      });
  });
}

/* =========================== Favorites / Notifications =========================== */

export function favorites(): string[] {
  const u = currentUser();
  return u ? (getState().favorites[u.id] ?? []) : [];
}

export function toggleFavorite(barId: string): boolean {
  const u = currentUser();
  if (!u) throw new Error('กรุณาเข้าสู่ระบบ');
  return mutate((s) => {
    const list = (s.favorites[u.id] ??= []);
    const i = list.indexOf(barId);
    if (i >= 0) list.splice(i, 1);
    else list.push(barId);
    return i < 0;
  });
}

export function myNotifications(): AppNotification[] {
  const u = currentUser();
  return u ? getState().notifications.filter((n) => n.userId === u.id) : [];
}

export function markAllRead(): void {
  const u = currentUser();
  if (!u) return;
  mutate((s) =>
    s.notifications
      .filter((n) => n.userId === u.id && !n.readAt)
      .forEach((n) => (n.readAt = nowIso())),
  );
}

/* =========================== Promotions / Admin =========================== */

export const PROMOTION_PACKAGES = [
  {
    id: 'pp-1',
    name: 'ร้านแนะนำหน้าแรก',
    placement: 'HOME_RECOMMENDED' as const,
    days: 7,
    price: 1590,
  },
  {
    id: 'pp-2',
    name: 'ร้านแนะนำหน้าแรก',
    placement: 'HOME_RECOMMENDED' as const,
    days: 14,
    price: 2900,
  },
  { id: 'pp-3', name: 'Home Banner', placement: 'HOME_BANNER' as const, days: 7, price: 3500 },
  {
    id: 'pp-4',
    name: 'อันดับต้นในผลค้นหา',
    placement: 'SEARCH_TOP' as const,
    days: 7,
    price: 1500,
  },
  {
    id: 'pp-5',
    name: 'อันดับต้นในผลค้นหา',
    placement: 'SEARCH_TOP' as const,
    days: 30,
    price: 4900,
  },
];

export function orderPromotion(barId: string, packageId: string): PromotionOrder {
  const p = PROMOTION_PACKAGES.find((x) => x.id === packageId);
  if (!p) throw new Error('ไม่พบแพ็กเกจ');
  const order: PromotionOrder = {
    id: uid('pm'),
    barId,
    packageName: `${p.name} ${p.days} วัน`,
    placement: p.placement,
    days: p.days,
    price: p.price,
    status: 'PAYMENT_SUBMITTED',
    createdAt: nowIso(),
  };
  mutate((s) => void s.promotions.unshift(order));
  return order;
}

export function reviewPromotion(id: string, ok: boolean, actor: string): void {
  mutate((s) => {
    const p = s.promotions.find((x) => x.id === id);
    if (!p) return;
    p.status = ok ? 'ACTIVE' : 'REJECTED';
    const bar = s.bars.find((b) => b.id === p.barId);
    if (bar && ok) bar.promoted = true;
    s.audit.unshift({
      id: uid('au'),
      actor,
      action: ok ? 'APPROVE_PROMOTION' : 'REJECT_PROMOTION',
      target: `${bar?.name} · ${p.packageName}`,
      at: nowIso(),
    });
  });
}

export function setBarStatus(id: string, status: Bar['status'], actor: string): void {
  mutate((s) => {
    const b = s.bars.find((x) => x.id === id);
    if (!b) return;
    b.status = status;
    s.audit.unshift({
      id: uid('au'),
      actor,
      action: `BAR_${status}`,
      target: b.name,
      at: nowIso(),
    });
  });
}

export function verifySafety(barId: string, key: string, actor: string): void {
  mutate((s) => {
    const b = s.bars.find((x) => x.id === barId);
    const f = b?.safety.find((x) => x.key === key);
    if (!b || !f) return;
    f.source = 'ADMIN_VERIFIED';
    s.audit.unshift({
      id: uid('au'),
      actor,
      action: 'VERIFY_SAFETY',
      target: `${b.name} · ${key}`,
      at: nowIso(),
    });
  });
}

/** ค่าคอมจาก booking ที่เช็กอิน/เสร็จแล้ว (10% ของยอดประเมิน) — เดโม */
export function billingEvents() {
  return getState()
    .bookings.filter((b) => ['CHECKED_IN', 'COMPLETED', 'NO_SHOW'].includes(b.status))
    .map((b) => {
      const bar = getBar(b.barId);
      const base = b.pax * (bar?.avgPerPerson ?? 0);
      return {
      id: `be-${b.id}`,
      bookingCode: b.code,
      barId: b.barId,
      barName: bar?.name ?? '-',
      type: b.status === 'NO_SHOW' ? ('NO_SHOW' as const) : ('CHECK_IN' as const),
      baseAmount: base,
      amount: b.status === 'NO_SHOW' ? 0 : Math.round(base * 0.1),
      status: b.status === 'NO_SHOW' ? ('WAIVED' as const) : ('PENDING' as const),
      at: b.checkedInAt ?? b.datetime,
      };
    });
}
