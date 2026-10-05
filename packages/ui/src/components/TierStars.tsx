import { Star } from '@phosphor-icons/react';
import type { Tier } from '@nightout/types';

/** จำนวนดาวของแต่ละ Tier (ใช้เมื่อไม่รู้ดาวจริง) — S=5 A=4 B=3 C=2 */
export const TIER_STARS: Record<Tier, number> = { S: 5, A: 4, B: 3, C: 2 };

export interface TierStarsProps {
  /** ดาวจริงจาก scoreToStars (1–5) — ถ้าไม่ส่ง จะใช้ค่าตาม tier */
  stars?: number | null;
  tier?: Tier | null;
  size?: 'sm' | 'lg';
  /** ข้อความใต้ดาว (lg) เช่น "1–2 ดาว" สำหรับ Tier C */
  label?: string;
}

/**
 * ระดับร้านแสดงเป็นดาว (ไม่แสดงตัวอักษร S/A/B/C ให้ผู้ใช้เห็น)
 * sm: แถวดาวเล็กในการ์ด · lg: หัวแถวในหน้าจัดอันดับ
 */
export function TierStars({ stars, tier, size = 'sm', label }: TierStarsProps) {
  const n = stars ?? (tier ? TIER_STARS[tier] : 0);
  if (!n) return null;
  const lg = size === 'lg';
  const px = lg ? 18 : 14;
  const row = (
    <span className="inline-flex text-(--gold-text)" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={px}
          weight={i <= n ? 'fill' : 'regular'}
          className={i <= n ? undefined : 'text-(--border)'}
        />
      ))}
    </span>
  );
  if (!lg) {
    return (
      <span className="inline-flex items-center" role="img" aria-label={`ระดับ ${n} ดาว`}>
        {row}
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-24 w-28 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-(--border) bg-(--surface)"
      role="img"
      aria-label={`ระดับ ${label ?? `${n} ดาว`}`}
    >
      {row}
      <span className="text-sm font-semibold text-(--text)">{label ?? `${n} ดาว`}</span>
    </span>
  );
}
