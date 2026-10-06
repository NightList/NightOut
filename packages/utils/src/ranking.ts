import type { Tier } from '@nightout/types';

/** จำนวนรีวิว (จากการเช็กอินจริง) ขั้นต่ำก่อนได้ดาว — น้อยกว่านี้แสดง "ร้านใหม่" */
export const MIN_REVIEWS_FOR_STARS = 5;

/** คะแนนรวม 0–100 → ดาว 1–5 */
export function scoreToStars(score: number): 1 | 2 | 3 | 4 | 5 {
  if (score >= 90) return 5;
  if (score >= 75) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  return 1;
}

/** ดาว → Tier: S = 5★, A = 4★, B = 3★, C = 1–2★ */
export function starsToTier(stars: number): Tier {
  if (stars >= 5) return 'S';
  if (stars >= 4) return 'A';
  if (stars >= 3) return 'B';
  return 'C';
}

export function isNewBar(reviewCount: number): boolean {
  return reviewCount < MIN_REVIEWS_FOR_STARS;
}
