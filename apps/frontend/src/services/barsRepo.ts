import type { Bar } from '@nightout/mock';

/**
 * แปลงแถวจาก view `bar_detail` (ร้านสาธารณะ) / `my_bar_detail` (ร้านของฉัน ทุกสถานะ) → รูปแบบ Bar ที่หน้าเว็บใช้
 * ข้อมูลร้านมาจาก Supabase เท่านั้น — services/sync.ts เอาไปใส่ store ของ @nightout/mock (ใช้เป็น cache)
 * หน้าเว็บจึงยังเรียก listBars() / getBarBySlug() ได้เหมือนเดิม
 */

/** รูปแบบ key ตาม view (snake_case ตามหลังบ้าน — ดู Db.BarDetail ใน @nightout/types) */
export interface BarDetailRow {
  id: string;
  slug: string;
  name: string;
  category: Bar['category'];
  lat: number;
  lng: number;
  cover_image_url: string | null;
  cover_style: string | null;
  district: { id: string; slug: string; name_th: string } | null;
  styles: string[];
  has_pr: boolean;
  pr_counts: { male: number; female: number; lgbtq: number };
  rating_avg: number | null;
  rating_count: number;
  avg_price_per_person: number | null;
  score: number | null;
  current_crowd: Bar['crowd'] | null;
  crowd_updated_at: string | null;
  is_promoted: boolean;
  description: string | null;
  address: string;
  perks: string[];
  hours: { day_of_week: number; open_time: string | null; close_time: string | null; is_closed: boolean }[];
  links: { type: string; url: string }[];
  booking_settings: {
    deposit_amount: number;
    deposit_unit: Bar['deposit']['unit'];
    deposit_policy: string | null;
    refund_before_hours?: number;
    grace_minutes: number;
  } | null;
  fees: { fee_type: string; calc: string; value: number }[];
  menu: { id: string; category: string | null; name: string; price: number; is_available: boolean }[];
  packages: {
    id: string;
    name: string;
    pax_min: number;
    pax_max: number;
    total_price: number;
    items: { menu_item_id: string | null; quantity: number }[];
  }[];
  promotions: {
    id: string;
    title: string;
    description: string | null;
    cutoff_time: string | null;
    days_of_week: number[];
    /** เฉพาะ my_bar_detail */
    active?: boolean;
    moderation_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  }[];
  zones: {
    id: string;
    name: string;
    capacity_pax: number;
    default_duration_minutes: number;
    tables: { id: string; name: string; seats: number }[];
  }[];
  safety: { key: string; value: 'YES' | 'NO' | 'UNKNOWN'; source: 'SELF_DECLARED' | 'ADMIN_VERIFIED' | null }[];
  /** เฉพาะ my_bar_detail */
  status?: Bar['status'];
  status_reason?: string | null;
  staff_role?: 'OWNER' | 'MANAGER' | 'STAFF';
  payout_account?: { bank_code: string; account_name: string; account_no_last4: string } | null;
}

const DEFAULT_COVER = 'linear-gradient(135deg,#2E1065 0%,#A738F5 55%,#E8B64C 100%)';
const LINK_TYPES = ['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'WEBSITE'] as const;

/** view ส่ง key ของสไตล์ (ตัวใหญ่) → ชื่อที่หน้าเว็บแสดง (เติมจากตาราง styles ตอนโหลด master) */
export const STYLE_LABELS: Record<string, string> = {
  LIVE_MUSIC: 'Live Music',
  CHILL: 'Chill',
  PUB_DANCE: 'Pub/Dance',
  ROOFTOP: 'Rooftop',
  FOOD_FOCUSED: 'Food-focused',
  QUIET: 'Quiet',
  OUTDOOR: 'Outdoor',
  PRIVATE_ROOM: 'Private Room',
  BUFFET: 'Buffet',
};

export function toBar(r: BarDetailRow): Bar {
  const pct = (type: string) => r.fees.find((f) => f.fee_type === type && f.calc === 'PERCENTAGE')?.value ?? 0;
  const settings = r.booking_settings;
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    district: r.district?.name_th ?? '',
    districtId: r.district?.id,
    address: r.address,
    lat: Number(r.lat),
    lng: Number(r.lng),
    description: r.description ?? '',
    styles: r.styles.map((k) => STYLE_LABELS[k] ?? k),
    cover: r.cover_style ?? DEFAULT_COVER,
    coverUrl: r.cover_image_url ?? undefined,
    hours: r.hours.map((h) => ({
      day: h.day_of_week,
      open: h.open_time ?? '18:00',
      close: h.close_time ?? '02:00',
      closed: h.is_closed,
    })),
    menu: r.menu.map((m) => ({
      id: m.id,
      category: (m.category ?? 'อาหาร') as Bar['menu'][number]['category'],
      name: m.name,
      price: Number(m.price),
      available: m.is_available,
    })),
    packages: r.packages.map((p) => ({
      id: p.id,
      name: p.name,
      paxMin: p.pax_min,
      paxMax: p.pax_max,
      totalPrice: Number(p.total_price),
      items: p.items
        .filter((it) => it.menu_item_id)
        .map((it) => ({ menuItemId: it.menu_item_id!, quantity: it.quantity })),
    })),
    promotions: r.promotions.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description ?? '',
      cutoffTime: p.cutoff_time ?? undefined,
      days: p.days_of_week.length >= 7 ? undefined : p.days_of_week,
      // bar_detail ส่งเฉพาะโปรที่ active + ผ่านการตรวจแล้ว · my_bar_detail ส่งทุกโปรพร้อมสถานะ
      active: p.active ?? true,
      moderationStatus: p.moderation_status,
    })),
    pr: { male: r.pr_counts.male, female: r.pr_counts.female, lgbtq: r.pr_counts.lgbtq },
    zones: r.zones.map((z) => ({
      id: z.id,
      name: z.name,
      capacityPax: z.capacity_pax,
      defaultDurationMinutes: z.default_duration_minutes,
      tables: z.tables,
    })),
    fees: {
      serviceChargeRate: Number(pct('SERVICE_CHARGE')),
      vatRate: Number(pct('VAT')),
      otherFees: r.fees.filter((f) => f.calc === 'FIXED_PER_TABLE').reduce((s, f) => s + Number(f.value), 0),
    },
    safety: r.safety.map((s) => ({
      key: s.key as Bar['safety'][number]['key'],
      value: s.value,
      source: s.source ?? 'SELF_DECLARED',
    })),
    links: r.links
      .filter((l): l is { type: Bar['links'][number]['type']; url: string } =>
        (LINK_TYPES as readonly string[]).includes(l.type),
      )
      .map((l) => ({ type: l.type, url: l.url })),
    // ร้านยังไม่เคยอัปเดตความแน่น (null) → เวลาเก่ามาก ให้หน้าเว็บแสดง "ไม่ทราบสถานะ"
    crowd: r.current_crowd ?? 'AVAILABLE',
    crowdUpdatedAt: r.crowd_updated_at ?? new Date(0).toISOString(),
    score: Number(r.score ?? 0),
    rating: Number(r.rating_avg ?? 0),
    reviewCount: r.rating_count,
    avgPerPerson: Number(r.avg_price_per_person ?? 0),
    status: r.status ?? 'APPROVED', // bar_detail มีเฉพาะร้าน APPROVED
    statusReason: r.status_reason ?? undefined,
    staffRole: r.staff_role,
    promoted: r.is_promoted,
    deposit: {
      amount: Number(settings?.deposit_amount ?? 0),
      unit: settings?.deposit_unit ?? 'PER_TABLE',
      policy: settings?.deposit_policy ?? '',
      refundBeforeHours: settings?.refund_before_hours ?? 24,
    },
    // เลขบัญชีเต็มไม่ออกจาก DB (เข้ารหัส) — แสดงแค่ 4 ตัวท้าย
    payout: r.payout_account
      ? {
          bankName: r.payout_account.bank_code,
          accountNo: `••••${r.payout_account.account_no_last4}`,
          accountName: r.payout_account.account_name,
        }
      : { bankName: '', accountNo: '', accountName: '' },
    gracePeriodMinutes: settings?.grace_minutes ?? 30,
    perks: r.perks,
  };
}
