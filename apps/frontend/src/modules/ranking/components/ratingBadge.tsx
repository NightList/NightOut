import type { Tier } from '@nightout/types';

/**
 * ป้ายคะแนนรีวิว (Figma "จัดอันดับ"): สี่เหลี่ยมมุมมน ตัวเลขสีเข้ม สีพื้นตามระดับดาวของร้าน
 * 5★ (S) ทอง · 4★ (A) ม่วง · 3★ (B) น้ำเงิน · 1–2★ (C) / ร้านใหม่ เทา
 */
const TONE: Record<Tier | 'NEW', string> = {
  S: 'bg-[#e8b64c]',
  A: 'bg-[#a349f5]',
  B: 'bg-[#5f6fd8]',
  C: 'bg-[#737687]',
  NEW: 'bg-[#737687]',
};

export function RatingBadge({
  rating,
  tier,
  small = false,
}: {
  rating: number;
  tier: Tier | null;
  small?: boolean;
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center font-bold ${small ? 'h-6 min-w-8 rounded-md px-1 text-xs' : 'size-10 rounded-lg text-sm'} tabular-nums text-[#15131c] ${TONE[tier ?? 'NEW']}`}
      aria-label={`คะแนนรีวิว ${rating.toFixed(1)}`}
    >
      {rating.toFixed(1)}
    </span>
  );
}
