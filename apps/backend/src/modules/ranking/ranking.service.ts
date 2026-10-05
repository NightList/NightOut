import { Injectable } from '@nestjs/common';
import type { Tier } from '@nightout/types';
import { isNewBar, scoreToStars, starsToTier } from '@nightout/utils';

/** TODO: คำนวณคะแนนรวมจากรีวิว/เช็กอิน/Safety/ข้อมูลราคา แล้วบันทึก tier_scores (job รายวัน) */
@Injectable()
export class RankingService {
  classify(score: number, reviewCount: number): { stars: number | null; tier: Tier | null } {
    if (isNewBar(reviewCount)) return { stars: null, tier: null };
    const stars = scoreToStars(score);
    return { stars, tier: starsToTier(stars) };
  }
}
