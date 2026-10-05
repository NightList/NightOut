import type { BarPromotion, MenuItem, ReviewMedia, SafetyValue } from '@nightout/mock';
import type { BookingStatus, CrowdStatus } from '@nightout/types';
import { Rest } from '@nightout/utils/rest';
import { uploadDepositSlip, uploadPromoSlip, uploadReviewMedia, uploadSafetyEvidence } from '@/services/storage';
import { currentProfile, refresh, setProfileName } from '@/services/sync';

/**
 * การบันทึกทั้งหมดของหน้าเว็บ → Rest (Axios) → NestJS (/api/...) → ฟังก์ชันใน DB → โหลดข้อมูลใหม่ผ่าน API
 * แทนฟังก์ชันเขียนของ @nightout/mock เดิม (createBooking, transition, updateBar …) — คืน Promise ทุกตัว
 */
const me = () => {
  const p = currentProfile();
  if (!p) throw new Error('กรุณาเข้าสู่ระบบ');
  return p;
};

// ----------------------------- ลูกค้า -----------------------------
export async function createBooking(input: {
  barId: string;
  zoneId: string;
  datetime: string;
  pax: number;
  promotionId?: string;
  note?: string;
}) {
  const r = await Rest.post<{ id: string; code: string; status: BookingStatus; deposit_required: number }>('/bookings', {
      bar_id: input.barId,
      zone_id: input.zoneId,
      datetime: input.datetime,
      pax: input.pax,
      promotion_id: input.promotionId ?? null,
      note: input.note?.trim() || null,
    });
  await refresh();
  return r;
}

/** อัปโหลดสลิปเข้า deposit-slips/<user>/... แล้วแจ้งหลังบ้าน */
export async function submitDeposit(bookingId: string, slip: Blob) {
  const path = await uploadDepositSlip(me().id, bookingId, slip);
  await Rest.post(`/bookings/${bookingId}/deposit`, { slip_path: path });
  await refresh();
}

export async function cancelBooking(bookingId: string, reason?: string) {
  await Rest.post(`/bookings/${bookingId}/cancel`, { reason: reason ?? null });
  await refresh();
}

export async function addReview(bookingId: string, rating: number, comment: string, media: ReviewMedia[]) {
  const reviewId = crypto.randomUUID();
  const uploaded = await uploadReviewMedia(me().id, reviewId, media);
  await Rest.post(`/bookings/${bookingId}/review`, { review_id: reviewId, rating, comment, media: uploaded });
  await refresh({ public: true });
}

export async function reportReview(reviewId: string, reason: 'SPAM' | 'OFFENSIVE' | 'FAKE' | 'PRIVACY' | 'OTHER' = 'OTHER', detail?: string) {
  await Rest.post(`/reviews/${reviewId}/report`, { reason, detail: detail ?? null });
  await refresh();
}

/** คืน true = เพิ่มเป็นร้านโปรด */
export async function toggleFavorite(barId: string) {
  const r = await Rest.post<{ favorite: boolean }>(`/me/favorites/${barId}/toggle`);
  await refresh();
  return r.favorite;
}

export async function markAllRead() {
  await Rest.post('/me/notifications/read', {});
  await refresh();
}

export async function updateProfile(patch: {
  display_name?: string;
  style_ids?: string[];
  district_ids?: string[];
  budget_per_person?: number | null;
  usual_pax?: number | null;
  onboarded?: boolean;
}) {
  await Rest.patch('/me/profile', patch);
  if (patch.display_name) setProfileName(patch.display_name);
  await refresh();
}

/** ลบบัญชี (ต้องไม่มีการจองที่ยังไม่จบ) — หลังจากนี้เข้าสู่ระบบไม่ได้ */
export async function deleteAccount() {
  await Rest.post('/me/delete', {});
}

export async function respondInvite(barId: string, accept: boolean) {
  await Rest.post(`/invites/${barId}/respond`, { accept });
  await refresh();
}

export async function merchantJoin(input: { name: string; category: string; district_id?: string | null; address: string; license?: string }) {
  const r = await Rest.post<{ id: string; status: string }>('/merchant/join', input);
  await refresh();
  return r;
}

// ----------------------------- ร้านค้า -----------------------------
export async function setBookingStatus(bookingId: string, to: BookingStatus, reason?: string) {
  await Rest.post(`/merchant/bookings/${bookingId}/status`, { to, reason: reason ?? null });
  await refresh();
}

export async function checkIn(barId: string, code: string) {
  const r = await Rest.post<{ id: string; code: string; pax: number; zone_name: string | null; customer_name: string | null }>(`/merchant/bars/${barId}/check-in`, { code });
  await refresh();
  return r;
}

export async function setCrowd(barId: string, status: CrowdStatus) {
  await Rest.post(`/merchant/bars/${barId}/crowd`, { status });
  await refresh({ public: true });
}

export async function updateBarInfo(
  barId: string,
  info: {
    name?: string;
    description?: string | null;
    address?: string;
    district_id?: string | null;
    style_keys?: string[];
    hours?: { day_of_week: number; open_time: string | null; close_time: string | null; is_closed: boolean }[];
    links?: { type: string; url: string }[];
  },
) {
  await Rest.patch(`/merchant/bars/${barId}/info`, info);
  await refresh({ public: true });
}

export async function setMenu(barId: string, menu: MenuItem[]) {
  await Rest.put(`/merchant/bars/${barId}/menu`, { items: menu.map((m) => ({ id: m.id, category: m.category, name: m.name, price: m.price, available: m.available })) });
  await refresh({ public: true });
}

/** คืนจำนวนโปรที่รอแอดมินตรวจถ้อยคำ */
export async function setBarPromotions(barId: string, list: BarPromotion[]) {
  const r = await Rest.put<{ pending: number }>(`/merchant/bars/${barId}/promotions`, {
      items: list.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description || null,
        cutoff_time: p.cutoffTime ?? null,
        days: p.days ?? null,
        active: p.active,
      })),
    });
  await refresh({ public: true });
  return r.pending;
}

export async function setFees(barId: string, fees: { serviceChargeRate: number; vatRate: number; otherFees: number }) {
  await Rest.put(`/merchant/bars/${barId}/fees`, { service_charge: fees.serviceChargeRate ?? 0, vat: fees.vatRate ?? 0, other: fees.otherFees ?? 0 });
  await refresh({ public: true });
}

export async function setZones(
  barId: string,
  zones: { id?: string; name: string; capacityPax: number; defaultDurationMinutes: number; tables: { id?: string; name: string; seats: number }[] }[],
) {
  await Rest.put(`/merchant/bars/${barId}/zones`, {
      zones: zones.map((z) => ({
        id: z.id ?? null,
        name: z.name,
        capacity_pax: z.capacityPax,
        default_duration_minutes: z.defaultDurationMinutes,
        tables: z.tables.map((t) => ({ id: t.id ?? null, name: t.name, seats: t.seats })),
      })),
    });
  await refresh({ public: true });
}

export async function setSafety(barId: string, key: string, value: SafetyValue) {
  await Rest.put(`/merchant/bars/${barId}/safety/${key}`, { value });
  await refresh({ public: true });
}

/** อัปโหลดหลักฐาน (รูป/PDF) เข้า bar-verifications แล้วให้ทีม NightOut ตรวจ */
export async function uploadSafetyProof(barId: string, key: string, file: Blob) {
  const path = await uploadSafetyEvidence(barId, key, file);
  await Rest.put(`/merchant/bars/${barId}/safety/${key}/evidence`, { path });
}

export async function updateBookingSettings(
  barId: string,
  s: { deposit_amount?: number; deposit_unit?: string; deposit_policy?: string; grace_minutes?: number; pr_male?: number; pr_female?: number; pr_lgbtq?: number },
) {
  await Rest.patch(`/merchant/bars/${barId}/booking-settings`, s);
  await refresh({ public: true });
}

export async function setPayoutAccount(barId: string, a: { bank_code: string; account_name: string; account_no: string }) {
  await Rest.put(`/merchant/bars/${barId}/payout-account`, a);
  await refresh();
}

export async function orderPromotion(barId: string, packageId: string, slip: Blob) {
  const path = await uploadPromoSlip(barId, slip);
  await Rest.post(`/merchant/bars/${barId}/promotion-orders`, { package_id: packageId, slip_path: path });
  await refresh();
}

export async function inviteStaff(barId: string, email: string, role: 'MANAGER' | 'STAFF' | 'OWNER') {
  await Rest.post(`/merchant/bars/${barId}/staff`, { email, role });
}

export async function removeStaff(barId: string, userId: string) {
  await Rest.delete(`/merchant/bars/${barId}/staff/${userId}`);
}
