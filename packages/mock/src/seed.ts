import type { BarCategory, CrowdStatus } from '@nightout/types';
import type {
  AppNotification,
  AuditLog,
  Bar,
  BarPromotion,
  Booking,
  DemoUser,
  MenuItem,
  PricePackage,
  PromotionOrder,
  Review,
  SafetyFeature,
  SafetyKey,
  Zone,
} from './models';

/** PRNG แบบ seed → ข้อมูลเดโมเหมือนเดิมทุกครั้ง */
export function prng(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const STYLES = [
  'Live Music',
  'Chill',
  'Pub/Dance',
  'Rooftop',
  'Food-focused',
  'Quiet',
  'Outdoor',
  'Private Room',
  'Buffet',
] as const;

export const DISTRICTS = [
  'ทองหล่อ',
  'เอกมัย',
  'อารีย์',
  'สีลม',
  'สาทร',
  'รัชดา',
  'ลาดพร้าว',
  'ริมแม่น้ำ',
  'พระราม 9',
  'สุขุมวิท',
] as const;

export const SAFETY_LABELS: Record<SafetyKey, string> = {
  SECURITY: 'รปภ. / การ์ด',
  CCTV: 'กล้อง CCTV',
  FIRE_EXIT: 'ทางหนีไฟ + ถังดับเพลิง',
  FIRST_AID: 'ชุดปฐมพยาบาล',
  ID_CHECK: 'ตรวจบัตร 20+',
  PARKING_RIDE: 'ที่จอดรถ / เรียกรถกลับบ้าน',
  FEMALE_STAFF: 'พนักงานหญิงช่วยดูแล',
  LIGHTING: 'ทางเข้า/ที่จอดสว่าง',
  EMERGENCY_CONTACT: 'ช่องทางแจ้งเหตุฉุกเฉิน',
};

export const CATEGORY_LABELS: Record<BarCategory, string> = {
  PUB_BAR: 'ผับ / บาร์',
  CHILL: 'ร้านนั่งชิล',
  RESTAURANT: 'ร้านอาหารมีเครื่องดื่ม',
};

/** ชื่อร้านสมมติทั้งหมด — ห้ามใช้ชื่อร้านจริง */
const NAMES = [
  'Moonlit Cellar',
  'Velvet Hour',
  'Amber Alley',
  'Neon Orchid',
  'The Quiet Barrel',
  'Lantern Lane',
  'Midnight Mango',
  'Copper Crane',
  'Starfall Rooftop',
  'Jazz Hideaway',
  'Riverside Dram',
  'Violet Room',
  'Golden Owl',
  'Echo Garden',
  'Night Market Tap',
];

const COVERS = [
  'linear-gradient(135deg,#2E1065 0%,#A738F5 55%,#E8B64C 100%)',
  'linear-gradient(135deg,#0B1026 0%,#5869C8 60%,#A738F5 100%)',
  'linear-gradient(135deg,#1A0B2E 0%,#963BE8 50%,#FFD77A 100%)',
  'linear-gradient(135deg,#07070D 0%,#34283F 40%,#E8B64C 100%)',
  'linear-gradient(135deg,#140A1F 0%,#7E22CE 60%,#F5C85E 100%)',
];

const SAFETY_KEYS = Object.keys(SAFETY_LABELS) as SafetyKey[];
const CATEGORIES: BarCategory[] = ['PUB_BAR', 'CHILL', 'RESTAURANT'];
const CROWDS: CrowdStatus[] = ['AVAILABLE', 'ALMOST_FULL', 'FULL'];

function menuFor(barId: string, rand: () => number): MenuItem[] {
  const base: Omit<MenuItem, 'id'>[] = [
    { category: 'เครื่องดื่ม', name: 'เซ็ตขวด 700ml', price: 1200, available: true },
    { category: 'เครื่องดื่ม', name: 'เซ็ตขวด 1L', price: 1650, available: true },
    { category: 'เครื่องดื่ม', name: 'ทาวเวอร์ 3L', price: 890, available: true },
    { category: 'เครื่องดื่ม', name: 'ค็อกเทลประจำร้าน', price: 320, available: true },
    { category: 'มิกเซอร์', name: 'โซดา', price: 30, available: true },
    { category: 'มิกเซอร์', name: 'น้ำแข็ง (ถัง)', price: 40, available: true },
    { category: 'มิกเซอร์', name: 'โค้ก / สไปรท์', price: 35, available: true },
    { category: 'มิกเซอร์', name: 'น้ำเปล่า', price: 25, available: true },
    { category: 'อาหาร', name: 'ยำรวมมิตร', price: 220, available: true },
    { category: 'อาหาร', name: 'ข้าวผัดต้มยำ', price: 180, available: true },
    { category: 'ของทานเล่น', name: 'เฟรนช์ฟรายส์', price: 150, available: true },
    { category: 'ของทานเล่น', name: 'ปีกไก่ทอดน้ำปลา', price: 190, available: true },
  ];
  const f = 0.85 + rand() * 0.4;
  return base.map((m, i) => ({
    ...m,
    id: `${barId}-m${i + 1}`,
    price: Math.round((m.price * f) / 10) * 10,
  }));
}

/** PromptPay ของแพลตฟอร์ม — ลูกค้าโอนมัดจำเข้าที่นี่ (เดโม: เบอร์สมมติ) */
export const PLATFORM = {
  name: 'NightOut Co., Ltd.',
  promptpayId: '0812345678',
} as const;

/** โปรโมชันตัวอย่างต่อร้าน — โปรเบียร์ก่อน 2 ทุ่ม + โปรอื่นสลับกัน */
function promotionsFor(barId: string, i: number): BarPromotion[] {
  const list: BarPromotion[] = [
    {
      id: `${barId}-pr1`,
      title: 'โปรเบียร์ก่อน 2 ทุ่ม',
      description: 'เบียร์สด/ขวด ราคาพิเศษ เมื่อเช็กอินก่อน 20:00 น.',
      cutoffTime: '20:00',
      active: true,
    },
  ];
  if (i % 3 === 0)
    list.push({
      id: `${barId}-pr2`,
      title: 'Ladies Night พุธ',
      description: 'ค็อกเทลแก้วแรกฟรีสำหรับสุภาพสตรี ทุกวันพุธ',
      days: [3],
      active: true,
    });
  if (i % 4 === 1)
    list.push({
      id: `${barId}-pr3`,
      title: 'มา 6 คนขึ้นไป ฟรีของทานเล่น 1 จาน',
      description: 'จองผ่าน NightOut และเช็กอินครบตามจำนวน',
      active: true,
    });
  return list;
}

function packagesFor(barId: string, menu: MenuItem[]): PricePackage[] {
  const bottle = menu[0]!;
  const soda = menu[4]!;
  const ice = menu[5]!;
  const snack = menu[10]!;
  const mk = (
    id: string,
    name: string,
    paxMin: number,
    paxMax: number,
    q: [number, number, number, number],
  ) => {
    const items = [
      { menuItemId: bottle.id, quantity: q[0] },
      { menuItemId: soda.id, quantity: q[1] },
      { menuItemId: ice.id, quantity: q[2] },
      { menuItemId: snack.id, quantity: q[3] },
    ];
    const total = items.reduce(
      (s, it) => s + (menu.find((m) => m.id === it.menuItemId)?.price ?? 0) * it.quantity,
      0,
    );
    return {
      id: `${barId}-${id}`,
      name,
      paxMin,
      paxMax,
      items,
      totalPrice: Math.round(total * 0.92),
    };
  };
  return [
    mk('p1', 'เซ็ตโต๊ะ 2–3 คน', 2, 3, [1, 6, 2, 1]),
    mk('p2', 'เซ็ตโต๊ะ 3–4 คน', 3, 4, [2, 10, 3, 1]),
    mk('p3', 'เซ็ตปาร์ตี้ 6–8 คน', 6, 8, [3, 16, 5, 2]),
  ];
}

function zonesFor(barId: string, rand: () => number): Zone[] {
  const n = 3 + Math.floor(rand() * 3);
  return [
    {
      id: `${barId}-z1`,
      name: 'โซนหน้าเวที',
      capacityPax: n * 4,
      defaultDurationMinutes: 180,
      tables: Array.from({ length: n }, (_, i) => ({
        id: `${barId}-z1-t${i + 1}`,
        name: `A${i + 1}`,
        seats: 4,
      })),
    },
    {
      id: `${barId}-z2`,
      name: 'โซนนั่งชิล',
      capacityPax: n * 6,
      defaultDurationMinutes: 180,
      tables: Array.from({ length: n }, (_, i) => ({
        id: `${barId}-z2-t${i + 1}`,
        name: `B${i + 1}`,
        seats: 6,
      })),
    },
    {
      id: `${barId}-z3`,
      name: 'ห้อง Private',
      capacityPax: 12,
      defaultDurationMinutes: 240,
      tables: [{ id: `${barId}-z3-t1`, name: 'VIP', seats: 12 }],
    },
  ];
}

const COMMENTS = [
  'บรรยากาศดีมาก ดนตรีสดเพราะ พนักงานบริการดี',
  'ราคาตรงกับที่ประเมินในแอปเลย ไม่มีเซอร์ไพรส์ตอนเช็กบิล',
  'จองผ่านแอปแล้วได้โต๊ะดีทันที เช็กอินด้วย QR เร็วมาก',
  'รปภ. ดูแลดี ที่จอดรถสว่าง กลับดึกก็สบายใจ',
  'อาหารอร่อยกว่าที่คิด เหมาะกับไปกับเพื่อน 4–5 คน',
  'คนแน่นช่วงสามทุ่ม แนะนำจองก่อน',
  'เพลงดังไปหน่อยสำหรับคุยงาน แต่ถ้ามาสนุกคือดีเลย',
  'วิวสวยมาก ถ่ายรูปได้ทั้งคืน',
];
const REVIEWERS = ['ต้น', 'ฝน', 'เมย์', 'บอส', 'แพร', 'นิว', 'กอล์ฟ', 'มายด์', 'เจ', 'ปาล์ม'];

export interface DemoState {
  version: 3;
  bars: Bar[];
  reviews: Review[];
  bookings: Booking[];
  notifications: AppNotification[];
  users: DemoUser[];
  favorites: Record<string, string[]>;
  promotions: PromotionOrder[];
  audit: AuditLog[];
}

const isoDaysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export const DEMO_USERS = {
  customer: 'u-customer',
  merchant: 'u-merchant',
  staff: 'u-staff',
  admin: 'u-admin',
} as const;

export function createSeed(): DemoState {
  const rand = prng(20260929);
  const bars: Bar[] = NAMES.map((name, i) => {
    const id = `bar-${i + 1}`;
    const menu = menuFor(id, rand);
    const category = CATEGORIES[i % 3]!;
    const TOP: Record<number, number> = { 0: 94, 8: 92, 9: 90 }; // ให้มีร้าน Tier S ในเดโม
    const score = TOP[i] ?? Math.round(35 + rand() * 54);
    const reviewCount = i === 14 ? 3 : Math.round(20 + rand() * 1300);
    const styles = [...STYLES].sort(() => rand() - 0.5).slice(0, 2 + Math.floor(rand() * 2));
    if (category === 'PUB_BAR' && !styles.includes('Pub/Dance')) styles[0] = 'Pub/Dance';
    if (category === 'RESTAURANT' && !styles.includes('Food-focused')) styles[0] = 'Food-focused';
    const safety: SafetyFeature[] = SAFETY_KEYS.map((key) => {
      const r = rand();
      return {
        key,
        value: r > 0.3 ? 'YES' : r > 0.12 ? 'NO' : 'UNKNOWN',
        source: rand() > 0.45 ? 'ADMIN_VERIFIED' : 'SELF_DECLARED',
      };
    });
    const pkgs = packagesFor(id, menu);
    const avg = Math.round(pkgs[1]!.totalPrice / 3.5 / 10) * 10;
    return {
      id,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      category,
      district: DISTRICTS[i % DISTRICTS.length]!,
      address: `${100 + i * 7} ซอยสมมติ ${i + 1} เขต${DISTRICTS[i % DISTRICTS.length]} กรุงเทพฯ`,
      lat: 13.72 + rand() * 0.1,
      lng: 100.52 + rand() * 0.1,
      description: `${name} · ${CATEGORY_LABELS[category]} ย่าน${DISTRICTS[i % DISTRICTS.length]} บรรยากาศ ${styles.join(' · ')} เหมาะกับไปกับเพื่อนหรือฉลองโอกาสพิเศษ`,
      styles,
      cover: COVERS[i % COVERS.length]!,
      hours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        day,
        open: '18:00',
        close: '02:00',
        closed: day === 1 && i % 4 === 0,
      })),
      menu,
      packages: pkgs,
      promotions: promotionsFor(id, i),
      // PR ประจำร้าน (ร้านกรอกเอง) — ผับ/บาร์มีเยอะ ร้านอาหารมักไม่มี
      pr:
        category === 'PUB_BAR'
          ? { male: Math.floor(rand() * 4), female: 2 + Math.floor(rand() * 6) }
          : category === 'CHILL' && i % 2 === 0
            ? { male: Math.floor(rand() * 2), female: 1 + Math.floor(rand() * 3) }
            : { male: 0, female: 0 },
      zones: zonesFor(id, rand),
      fees: { serviceChargeRate: 10, vatRate: 7, otherFees: category === 'PUB_BAR' ? 200 : 0 },
      safety,
      links: [
        {
          type: 'INSTAGRAM',
          url: `https://instagram.com/${name.toLowerCase().replace(/\s+/g, '')}`,
        },
        { type: 'TIKTOK', url: `https://tiktok.com/@${name.toLowerCase().replace(/\s+/g, '')}` },
      ],
      crowd: CROWDS[Math.floor(rand() * 3)]!,
      crowdUpdatedAt: new Date(Date.now() - rand() * 50 * 60_000).toISOString(),
      score,
      // คะแนนรีวิวเฉลี่ยให้สอดคล้องกับคะแนนรวม (ดาว/Tier) ในข้อมูลเดโม
      rating: Math.round((1.2 + score * 0.038) * 10) / 10,
      reviewCount,
      avgPerPerson: avg,
      status: 'APPROVED',
      promoted: i === 0 || i === 3 || i === 8,
      editorsPick: i === 9,
      deposit: {
        amount: category === 'PUB_BAR' ? 500 : 300,
        unit: 'PER_TABLE',
        policy:
          'มัดจำหักเป็นค่าอาหาร/เครื่องดื่มในวันที่มา · ยกเลิกก่อน 6 ชม. คืนเต็มจำนวน · ไม่มาตามนัด ร้านขอเก็บมัดจำ',
      },
      payout: {
        bankName: ['กสิกรไทย', 'ไทยพาณิชย์', 'กรุงเทพ', 'กรุงไทย'][i % 4]!,
        accountNo: `${String(1234567890 + i * 97531).slice(0, 10)}`,
        accountName: `บจก. ${name}`,
      },
      gracePeriodMinutes: [15, 30, 60][i % 3]!,
      perks: [
        'น้ำดื่มฟรี 1 ขวด/โต๊ะ เมื่อจองผ่าน NightOut',
        i % 2 === 0 ? 'ยกเว้นค่าเข้า' : 'ส่วนลดอาหาร 10%',
      ],
    };
  });
  // ร้านรออนุมัติ 1 ร้าน (สำหรับหน้า admin)
  bars.push({
    ...bars[1]!,
    id: 'bar-16',
    slug: 'sapphire-social',
    name: 'Sapphire Social',
    district: 'สุขุมวิท',
    status: 'PENDING_REVIEW',
    promoted: false,
    editorsPick: false,
    reviewCount: 0,
    score: 0,
    rating: 0,
  });

  const reviews: Review[] = [];
  bars.slice(0, 15).forEach((b) => {
    for (let k = 0; k < 4; k++) {
      reviews.push({
        id: `rv-${b.id}-${k}`,
        barId: b.id,
        userName: REVIEWERS[Math.floor(rand() * REVIEWERS.length)]!,
        rating: Math.max(3, Math.min(5, Math.round(b.rating + (rand() - 0.5)))),
        comment: COMMENTS[Math.floor(rand() * COMMENTS.length)]!,
        createdAt: isoDaysAgo(Math.floor(rand() * 60)),
        reported: b.id === 'bar-3' && k === 0,
        // ตัวอย่างรีวิวที่แนบรูป (รีวิวแรกของทุกร้าน) — ของจริงเป็นรูปจาก Storage
        media:
          k === 0
            ? [
                { id: `md-${b.id}-1`, type: 'image', src: '/images/bars/placeholder.webp' },
                { id: `md-${b.id}-2`, type: 'image', src: '/images/home/hero-poster.jpg' },
              ]
            : undefined,
      });
    }
  });

  const now = new Date();
  const at = (h: number, m = 0, dayOffset = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  const bar1 = bars[0]!;
  const mkBooking = (
    n: number,
    userName: string,
    datetime: string,
    pax: number,
    status: Booking['status'],
    extra: Partial<Booking> = {},
  ): Booking => ({
    id: `bk-seed-${n}`,
    code: `NL-${(4000 + n * 37).toString(36).toUpperCase()}`,
    barId: bar1.id,
    userId: n === 1 ? DEMO_USERS.customer : `u-guest-${n}`,
    userName,
    zoneId: bar1.zones[n % 2]!.id,
    tableId: bar1.zones[n % 2]!.tables[n % bar1.zones[n % 2]!.tables.length]!.id,
    datetime,
    pax,
    status,
    createdAt: isoDaysAgo(1),
    history: [{ from: null, to: status, by: 'SYSTEM', at: isoDaysAgo(1) }],
    shareToken: `sh-seed-${n}`,
    ...extra,
  });
  const held = (days: number): Booking['deposit'] => ({
    amount: 500,
    status: 'VERIFIED',
    submittedAt: isoDaysAgo(days + 0.2),
    verifiedAt: isoDaysAgo(days),
    settlement: 'HELD',
  });
  const bookings: Booking[] = [
    mkBooking(1, 'Demo Customer', at(21, 0), 4, 'CONFIRMED', {
      deposit: held(0.5),
      promotionId: 'bar-1-pr1',
      promotionTitle: 'โปรเบียร์ก่อน 2 ทุ่ม',
    }),
    mkBooking(2, 'คุณต้น', at(20, 30), 3, 'CONFIRMED', { deposit: held(0.8) }),
    mkBooking(3, 'คุณเมย์', at(22, 0), 6, 'DEPOSIT_SUBMITTED', {
      deposit: { amount: 500, status: 'SUBMITTED', submittedAt: isoDaysAgo(0.1) },
    }),
    mkBooking(4, 'คุณบอส', at(21, 30), 2, 'AWAITING_DEPOSIT'),
    mkBooking(5, 'คุณแพร', at(20, 0, -3), 4, 'COMPLETED', {
      checkedInAt: at(20, 10, -3),
      deposit: { ...held(3.5)!, settlement: 'PAYOUT_PENDING', settledAt: at(20, 10, -3) },
    }),
    mkBooking(6, 'คุณนิว', at(21, 0, -5), 5, 'NO_SHOW', {
      deposit: { ...held(5.5)!, settlement: 'PAID_OUT', settledAt: isoDaysAgo(4) },
    }),
  ];

  const users: DemoUser[] = [
    {
      id: DEMO_USERS.customer,
      email: 'demo@nightout.app',
      displayName: 'Demo Customer',
      role: 'CUSTOMER',
      createdAt: isoDaysAgo(30),
      preferences: { styles: ['Live Music', 'Chill'], budget: 800, pax: 4, districts: ['ทองหล่อ'] },
    },
    {
      id: DEMO_USERS.merchant,
      email: 'owner@moonlit.demo',
      displayName: 'เจ้าของ Moonlit Cellar',
      role: 'MERCHANT',
      barId: 'bar-1',
      createdAt: isoDaysAgo(90),
      preferences: { styles: [], districts: [] },
    },
    {
      id: DEMO_USERS.staff,
      email: 'staff@moonlit.demo',
      displayName: 'Staff หน้าร้าน',
      role: 'STAFF',
      barId: 'bar-1',
      createdAt: isoDaysAgo(60),
      preferences: { styles: [], districts: [] },
    },
    {
      id: DEMO_USERS.admin,
      email: 'admin@nightout.app',
      displayName: 'NightOut Admin',
      role: 'ADMIN',
      createdAt: isoDaysAgo(120),
      preferences: { styles: [], districts: [] },
    },
    ...REVIEWERS.map((n, i) => ({
      id: `u-guest-${i + 2}`,
      email: `guest${i + 2}@example.com`,
      displayName: `คุณ${n}`,
      role: 'CUSTOMER' as const,
      createdAt: isoDaysAgo(10 + i),
      preferences: { styles: [], districts: [] },
    })),
  ];

  return {
    version: 3,
    bars,
    reviews,
    bookings,
    notifications: [
      {
        id: 'nt-1',
        userId: DEMO_USERS.customer,
        title: 'ยืนยันการจองแล้ว',
        body: `Moonlit Cellar ยืนยันโต๊ะคืนนี้ 21:00 น. แล้ว`,
        link: '/bookings/bk-seed-1',
        createdAt: isoDaysAgo(0.5),
      },
      {
        id: 'nt-2',
        userId: DEMO_USERS.merchant,
        title: 'มีสลิปมัดจำรอตรวจ',
        body: 'คุณเมย์ ส่งสลิปมัดจำ 500 บาท',
        link: '/merchant/deposits',
        createdAt: isoDaysAgo(0.1),
      },
    ],
    users,
    favorites: { [DEMO_USERS.customer]: ['bar-1', 'bar-9'] },
    promotions: [
      {
        id: 'pm-1',
        barId: 'bar-1',
        packageName: 'ร้านแนะนำหน้าแรก 14 วัน',
        placement: 'HOME_RECOMMENDED',
        days: 14,
        price: 2900,
        status: 'ACTIVE',
        createdAt: isoDaysAgo(3),
      },
      {
        id: 'pm-2',
        barId: 'bar-6',
        packageName: 'อันดับต้นในผลค้นหา 7 วัน',
        placement: 'SEARCH_TOP',
        days: 7,
        price: 1500,
        status: 'PAYMENT_SUBMITTED',
        createdAt: isoDaysAgo(0.3),
      },
    ],
    audit: [
      {
        id: 'au-1',
        actor: 'admin@nightout.app',
        action: 'APPROVE_BAR',
        target: 'Moonlit Cellar',
        at: isoDaysAgo(80),
      },
      {
        id: 'au-2',
        actor: 'admin@nightout.app',
        action: 'VERIFY_SAFETY',
        target: 'Jazz Hideaway · CCTV',
        at: isoDaysAgo(20),
      },
    ],
  };
}
