import { homeCategoryIcon } from '@nightout/ui';
import { useEffect, useState } from 'react';
import { useSiteHome } from '@/services/data';
import type { HomeCategory } from '../type/category';
import { DEFAULT_CATEGORIES, DEFAULT_CONTENT } from './categories';

/**
 * เนื้อหาหน้าแรก (Hero + การ์ดหมวด) จาก API — ยังไม่มา/ต่อไม่ได้ใช้ค่าตั้งต้น
 * การ์ดยึดลำดับ slot ของค่าตั้งต้นเสมอ (กริด bento ต้องมีครบ 8 ช่อง) แล้วทับด้วยค่าจาก API ที่ slot ตรงกัน
 * heroPending = ยังไม่รู้ว่าแอดมินตั้งภาพ Hero ไว้ไหม (ไม่มี cache และ API ยังไม่ตอบ) → หน้ายังไม่ควรโหลดภาพตั้งต้น
 * รอไม่เกิน HERO_WAIT_MS และเลิกรอทันทีที่ API ล้มครั้งแรก (ไม่รอ retry) → ใช้ภาพตั้งต้น
 */
const HERO_WAIT_MS = 1500;

export function useHomeContent() {
  const { data, isPending, failureCount } = useSiteHome();
  const waiting = !data && isPending && failureCount === 0;
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!waiting) return;
    const t = setTimeout(() => setTimedOut(true), HERO_WAIT_MS);
    return () => clearTimeout(t);
  }, [waiting]);
  const heroPending = waiting && !timedOut;
  const content = data?.content ?? DEFAULT_CONTENT;
  const bySlot = new Map(data?.categories.map((c) => [c.slot, c]));
  const categories: HomeCategory[] = DEFAULT_CATEGORIES.map((d) => {
    const c = bySlot.get(d.slot) ?? d;
    return {
      key: d.slot,
      title: c.title,
      hint: c.hint,
      to: c.link_to,
      icon: homeCategoryIcon(c.icon),
      image: c.image_url,
      badge: c.badge ?? undefined,
    };
  });
  return { content, categories, heroPending };
}
