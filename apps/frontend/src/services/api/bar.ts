import type * as C from '@nightout/contracts';
import type { BarPromotion, MenuItem } from '@nightout/mock';
import { Rest } from '@nightout/utils/rest';
import { uploadSafetyEvidence } from '@/services/api/storage';
import { refresh } from '@/services/sync';

/** bar — ข้อมูลร้าน เมนู โปร ค่าธรรมเนียม โซน ความปลอดภัย ตั้งค่าการจอง บัญชีรับเงิน ความแน่น สมัครลงร้าน · backend: domains/bar */

export async function merchantJoin(input: C.MerchantJoinBody) {
  const r = await Rest.post<C.MerchantJoinResult>('/merchant/join', input);
  await refresh();
  return r;
}

export async function setCrowd(barId: string, status: C.CrowdBody['status']) {
  await Rest.post(`/merchant/bars/${barId}/crowd`, { status } satisfies C.CrowdBody);
  await refresh({ public: true });
}

export async function updateBarInfo(barId: string, info: C.BarInfoBody) {
  await Rest.patch(`/merchant/bars/${barId}/info`, info);
  await refresh({ public: true });
}

export async function setMenu(barId: string, menu: MenuItem[]) {
  const body: C.MenuBody = { items: menu.map((m) => ({ id: m.id, category: m.category, name: m.name, price: m.price, available: m.available })) };
  await Rest.put(`/merchant/bars/${barId}/menu`, body);
  await refresh({ public: true });
}

/** คืนจำนวนโปรที่รอแอดมินตรวจถ้อยคำ */
export async function setBarPromotions(barId: string, list: BarPromotion[]) {
  const body: C.BarPromotionsBody = {
    items: list.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description || null,
      cutoff_time: p.cutoffTime ?? null,
      days: p.days ?? null,
      active: p.active,
    })),
  };
  const r = await Rest.put<C.BarPromotionsResult>(`/merchant/bars/${barId}/promotions`, body);
  await refresh({ public: true });
  return r.pending;
}

export async function setFees(barId: string, fees: { serviceChargeRate: number; vatRate: number; otherFees: number }) {
  await Rest.put(`/merchant/bars/${barId}/fees`, {
    service_charge: fees.serviceChargeRate ?? 0,
    vat: fees.vatRate ?? 0,
    other: fees.otherFees ?? 0,
  } satisfies C.FeesBody);
  await refresh({ public: true });
}

export async function setZones(
  barId: string,
  zones: { id?: string; name: string; capacityPax: number; defaultDurationMinutes: number; tables: { id?: string; name: string; seats: number }[] }[],
) {
  const body: C.ZonesBody = {
    zones: zones.map((z) => ({
      id: z.id ?? null,
      name: z.name,
      capacity_pax: z.capacityPax,
      default_duration_minutes: z.defaultDurationMinutes,
      tables: z.tables.map((t) => ({ id: t.id ?? null, name: t.name, seats: t.seats })),
    })),
  };
  await Rest.put(`/merchant/bars/${barId}/zones`, body);
  await refresh({ public: true });
}

export async function setSafety(barId: string, key: string, value: C.SafetyValue) {
  await Rest.put(`/merchant/bars/${barId}/safety/${key}`, { value } satisfies C.SafetyBody);
  await refresh({ public: true });
}

/** อัปโหลดหลักฐาน (รูป/PDF) เข้า bar-verifications แล้วให้ทีม NightOut ตรวจ */
export async function uploadSafetyProof(barId: string, key: string, file: Blob) {
  const path = await uploadSafetyEvidence(barId, key, file);
  await Rest.put(`/merchant/bars/${barId}/safety/${key}/evidence`, { path } satisfies C.EvidenceBody);
}

export async function updateBookingSettings(barId: string, s: C.BookingSettingsBody) {
  await Rest.patch(`/merchant/bars/${barId}/booking-settings`, s);
  await refresh({ public: true });
}

export async function setPayoutAccount(barId: string, a: C.PayoutAccountBody) {
  await Rest.put(`/merchant/bars/${barId}/payout-account`, a);
  await refresh();
}
