import { HOME_POPULAR_MAX } from '@nightout/contracts';
import { getBar, listBars, type BarWithTier } from '@/services/data';

/**
 * ร้านในกริด "ร้านยอดนิยม" — ร้านที่แอดมินปักไว้ก่อน (ตามลำดับ) แล้วเติมช่องที่เหลือด้วยร้านคะแนนรีวิวสูงสุดที่ไม่ซ้ำ
 * ร้านที่ปักแต่ไม่อยู่ใน catalog / ไม่ APPROVED แล้ว ข้ามไป (ช่องนั้นเติมอัตโนมัติแทน)
 */
export function pickPopular(pinnedIds: readonly string[], limit = HOME_POPULAR_MAX): BarWithTier[] {
  const pinned = pinnedIds
    .map(getBar)
    .filter((b): b is BarWithTier => b?.status === 'APPROVED')
    .slice(0, limit);
  const taken = new Set(pinned.map((b) => b.id));
  const fill = listBars({ sort: 'rating' }).filter((b) => !taken.has(b.id));
  return [...pinned, ...fill].slice(0, limit);
}
