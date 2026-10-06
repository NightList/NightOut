import { ArrowRight, MapPin, Star } from '@phosphor-icons/react';
import { safetyScore, type BarWithTier } from '@/services/data';
import { Link } from 'react-router';
import { useNow } from '@/hooks/useNow';
import { barImage } from '@/ui/utils/barImage';
import { CROWD } from '@/ui/utils/format';
import { FavoriteButton } from '@/ui/components/favoriteButton';

/** ป้ายสถานะคน (มุมซ้ายบนรูป) — เกิน 60 นาทีถือว่าไม่ทราบ */
function StatusPill({ bar }: { bar: BarWithTier }) {
  const now = useNow(60_000);
  const stale = now - new Date(bar.crowdUpdatedAt).getTime() > 60 * 60_000;
  const c = CROWD[bar.crowd];
  return (
    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#d9d9d9]/90 px-3.5 py-0.5 text-xs font-medium text-[#1b1924] backdrop-blur-md">
      <span className="size-2 rounded-full" style={{ background: stale ? '#9a98a6' : c.dot }} />
      {stale ? 'ไม่ทราบสถานะ' : c.label}
    </span>
  );
}

/**
 * การ์ดร้านประจำสัปดาห์ (Figma: Main → Card ร้าน)
 * รูปมีขอบใน + สถานะ + หัวใจ · ชื่อทอง · ดาว (จำนวนรีวิว) | ย่าน · ความปลอดภัย x/100
 * ล่าง: "ดูรายละเอียด →" ขอบทอง + ป้าย "แนะนำ" (ร้านโปรโมท = โฆษณา)
 */
export function WeeklyBarCard({ bar, rank }: { bar: BarWithTier; rank?: number }) {
  return (
    <Link
      to={`/bars/${bar.slug}`}
      className="group flex h-full flex-col rounded-[18px] border border-border bg-card p-2.5 !text-text transition-colors hover:border-purple/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold dark:border-white/15 dark:bg-[#1b1924]/55 backdrop-blur-xl"
    >
      <div className="relative aspect-[16/9] overflow-hidden rounded-[14px] bg-black/30">
        <img
          src={barImage(bar)}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <StatusPill bar={bar} />
        {rank != null && (
          <span
            className="absolute bottom-2.5 left-2.5 inline-flex size-9 items-center justify-center rounded-full border border-gold bg-black/70 text-base font-bold text-gold backdrop-blur-md"
            aria-label={`อันดับ ${rank}`}
          >
            {rank}
          </span>
        )}
        <FavoriteButton
          barId={bar.id}
          className="!absolute right-2.5 top-2.5 !size-9 !min-w-9 !border-0 !bg-[#9a98a6]/80 !text-white backdrop-blur-md"
        />
      </div>

      <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
        <div className="flex items-center gap-4">
          <h3 className="truncate text-lg font-semibold text-gold-text">{bar.name}</h3>
          {bar.promoted && (
            <span
              title="ร้านโปรโมท (โฆษณา)"
              className="relative inline-flex items-center gap-1 rounded-full border border-gold/70 bg-slate-900 px-3 py-1 text-xs text-gold-text"
            >
              แนะนำ<span className="sr-only"> · โฆษณา</span>
            </span>
          )}
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          {bar.isNew ? (
            <span>ร้านใหม่</span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Star size={18} weight="fill" className="text-gold" />
              <span className="text-gold-text">{bar.rating.toFixed(1)}</span>
              <span>({bar.reviewCount.toLocaleString('th-TH')})</span>
            </span>
          )}
          <span className="h-4 w-px bg-muted/50" aria-hidden />
          <span className="inline-flex items-center gap-1">
            <MapPin size={16} />
            {bar.district}
          </span>
        </p>
        <p className="mt-3 text-sm text-muted">
          ความปลอดภัย <span className="text-purple">{safetyScore(bar)}/100</span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-5">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-gold px-4 py-1.5 text-sm font-semibold text-gold-text transition-colors group-hover:bg-gold group-hover:text-on-gold">
            ดูรายละเอียด <ArrowRight size={14} weight="bold" />
          </span>
        </div>
      </div>
    </Link>
  );
}
