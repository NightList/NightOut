import type { PublicHomeResult } from '@nightout/contracts';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchSiteHome } from '@/services/api/site-content';
import { siteContentKeys } from './keys';

export type {
  HomeCategory as SiteHomeCategory,
  HomeContent as SiteHomeContent,
  PublicHomeResult as SiteHome,
} from '@nightout/contracts';

/**
 * เก็บเนื้อหาหน้าแรกล่าสุดไว้ในเครื่อง — เปิดครั้งหน้าเห็นของที่แอดมินแก้ทันที (ไม่กระพริบจากค่าตั้งต้น) แล้วค่อยโหลดใหม่
 * เปลี่ยนรูปแบบ PublicHomeResult แล้วต้องขึ้นเลข version (cache เก่าจะถูกทิ้ง ไม่ส่งข้อมูลผิดรูปให้หน้า)
 */
const CACHE_KEY = 'nightout-site-home:v1';
const LEGACY_KEYS = ['nightout-site-home'];

interface Snapshot {
  data: PublicHomeResult;
  savedAt: number;
}

/** ตรวจรูปแบบขั้นต่ำที่หน้าแรกใช้ — cache เสีย/ผิดรูป = ทิ้ง */
const isSnapshot = (v: unknown): v is Snapshot => {
  const s = v as Partial<Snapshot> | null;
  return (
    typeof s?.savedAt === 'number' &&
    typeof s.data?.content?.hero_title_highlight === 'string' &&
    Array.isArray(s.data.categories)
  );
};

function readCache(): Snapshot | undefined {
  try {
    for (const k of LEGACY_KEYS) localStorage.removeItem(k);
    const raw = localStorage.getItem(CACHE_KEY);
    const v: unknown = raw ? JSON.parse(raw) : undefined;
    if (isSnapshot(v)) return v;
    if (raw) localStorage.removeItem(CACHE_KEY);
  } catch {
    /* อ่าน/parse ไม่ได้ — ไม่ใช้ cache */
  }
  return undefined;
}

/** อ่าน cache ครั้งเดียวต่อการเปิดเว็บ (initialData + initialDataUpdatedAt ใช้ร่วมกัน) */
let snapshot: Snapshot | undefined | null = null;
const cached = () => (snapshot === null ? (snapshot = readCache()) : snapshot);

/** คำขอที่ยิงไว้ตั้งแต่ boot (main.tsx) ที่ยังไม่ตอบ — queryFn ที่เรียกระหว่างนั้นรับต่อ ไม่ยิงซ้ำ */
let primed: Promise<PublicHomeResult> | undefined;

/**
 * เริ่มโหลดเนื้อหาหน้าแรกคู่กับ catalog ตอน boot — ภาพ Hero ของแอดมินจะรู้ตั้งแต่ render แรก ไม่ต้องโหลดภาพตั้งต้นทิ้ง
 * ตอบแล้ว: ใส่ snapshot ให้ initialData อ่านได้ทันที และเลิกใช้ promise นี้ (refetch ครั้งต่อไปยิงใหม่) · ล้มเหลวไม่เป็นไร (useSiteHome ลองใหม่เอง)
 */
export function prefetchSiteHome() {
  const p = fetchSiteHome();
  primed = p;
  const done = () => {
    if (primed === p) primed = undefined;
  };
  p.then((data) => {
    snapshot = { data, savedAt: Date.now() };
    done();
  }, done);
}

const queryFn = () => primed ?? fetchSiteHome();

/**
 * เนื้อหาหน้าแรก (GET /public/home) — ยังไม่มา/โหลดไม่ได้ = undefined (หน้าใช้ค่าตั้งต้นของตัวเอง)
 * staleTime สั้น + โหลดใหม่เมื่อกลับมาที่แท็บ → แอดมินแก้แล้วลูกค้าเห็นในการเปิด/สลับกลับมาครั้งถัดไป
 */
export function useSiteHome() {
  const q = useQuery({
    queryKey: siteContentKeys.home,
    queryFn,
    staleTime: 60_000,
    initialData: () => cached()?.data,
    initialDataUpdatedAt: () => cached()?.savedAt,
  });
  useEffect(() => {
    if (!q.data) return;
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ data: q.data, savedAt: q.dataUpdatedAt } satisfies Snapshot),
      );
    } catch {
      /* เต็ม/ถูกปิด — ไม่เป็นไร */
    }
  }, [q.data, q.dataUpdatedAt]);
  return q;
}
