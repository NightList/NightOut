import { ArrowRight, Crown, MapPin, ShieldCheck } from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { safetyScore, type RankedBar } from '@/services/data';
import { useCrowdStatus } from '@/hooks/useCrowdStatus';
import { BarRating } from '@/ui/components/barRating';
import { FavoriteButton } from '@/ui/components/favoriteButton';
import { SectionHeader } from '@/ui/components/sectionHeader';
import { barImage } from '@/ui/utils/barImage';
import { prefersLightweight } from '../utils/prefersLightweight';
import { SURFACE, SURFACE_HOVER } from '../utils/surface';
import { useDiagonalVar } from '../utils/useDiagonalVar';
import { useOffscreenPause } from '../utils/useOffscreenPause';
import { PromotedTag } from './promotedTag';
import './weeklySpotlight.css';

/** ป้ายสถานะคนบนรูป — เกิน 60 นาทีถือว่าไม่ทราบ (กติกาจาก useCrowdStatus) */
function StatusPill({ bar, className = '' }: { bar: RankedBar; className?: string }) {
  const crowd = useCrowdStatus(bar.crowd, bar.crowdUpdatedAt);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-0.5 text-xs font-medium text-white backdrop-blur-md ${className}`}
    >
      <span className="size-2 rounded-full" style={{ background: crowd.dot }} />
      {crowd.label}
    </span>
  );
}

/** ดาว (ระดับร้าน) + คะแนนรีวิว · ย่าน · ความปลอดภัย */
function BarMeta({ bar, className = '' }: { bar: RankedBar; className?: string }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted ${className}`}>
      <BarRating bar={bar} compact />
      <span className="inline-flex items-center gap-1">
        <MapPin size={15} aria-hidden />
        {bar.district}
      </span>
      <span className="inline-flex items-center gap-1">
        <ShieldCheck size={15} aria-hidden />
        ความปลอดภัย <span className="text-link">{safetyScore(bar)}/100</span>
      </span>
    </p>
  );
}

/**
 * อันดับ 1 — แบนเนอร์กว้าง ขอบมีแสงทอง-ม่วงวิ่งรอบ (weeklySpotlight.css) · ซ้าย: ชื่อใหญ่ไล่สีทอง + ข้อมูล + ปุ่ม · ขวา: รูปร้านจางเข้าหาข้อความ
 * กล่องจำนวนโหวตมุมขวาล่างของรูป · ทั้งแบนเนอร์กดไปหน้าร้าน (ลิงก์ที่ชื่อขยายเต็มกล่อง)
 */
function LeaderBanner({ bar }: { bar: RankedBar }) {
  const ringRef = useRef<HTMLDivElement>(null);
  const [still] = useState(() => prefersLightweight());
  const paused = useOffscreenPause(ringRef, !still);
  useDiagonalVar(ringRef, '--ring-size');
  return (
    <div
      ref={ringRef}
      data-still={still}
      data-paused={paused}
      className="spotlight-ring relative isolate overflow-hidden rounded-3xl p-px has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-gold"
    >
      <article
        className="group relative isolate grid overflow-hidden rounded-[calc(1.5rem-1px)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:grid-cols-[1.05fr_1fr]"
        style={{
          background:
            'radial-gradient(60% 80% at 0% 100%, rgba(167,56,245,0.16), transparent 65%), linear-gradient(110deg, var(--card) 20%, color-mix(in srgb, var(--hero-via) 70%, var(--card)) 100%)',
        }}
      >
        <div className="relative aspect-[16/9] md:order-2 md:aspect-auto md:min-h-[300px]">
          <img
            src={barImage(bar)}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.03] md:[mask-image:linear-gradient(to_right,transparent,black_35%)]"
          />
          <StatusPill bar={bar} className="absolute left-3 top-3 md:left-auto md:right-14" />
          <FavoriteButton
            barId={bar.id}
            className="!absolute right-3 top-3 z-10 !size-9 !min-w-9 !border-0 !bg-black/55 !text-white backdrop-blur-md"
          />
          <div className="absolute bottom-3 right-3 rounded-xl border border-purple/60 bg-black/70 px-4 py-2 text-center text-white backdrop-blur-sm md:bottom-5 md:right-5 md:px-5 md:py-3">
            <p className="text-[11px] text-white/75">โหวตสัปดาห์นี้</p>
            <p className="text-2xl font-bold leading-tight text-gold md:text-4xl">
              {bar.votes.toLocaleString('th-TH')}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4 p-5 md:order-1 md:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <Crown size={22} weight="fill" className="text-gold" aria-hidden />
            <span className="text-sm font-medium text-link">อันดับ 1 ประจำสัปดาห์</span>
            {bar.promoted && <PromotedTag />}
          </div>
          <h3 className="text-3xl font-bold leading-tight text-balance md:text-5xl">
            <Link
              to={`/bars/${bar.slug}`}
              className="bg-gradient-to-r from-[var(--title-from)] to-[var(--title-to)] bg-clip-text !text-transparent outline-none after:absolute after:inset-0"
            >
              {bar.name}
            </Link>
          </h3>
          <BarMeta bar={bar} />
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gold px-5 py-2 text-sm font-semibold text-on-gold transition-colors group-hover:bg-gold-highlight">
            ดูรายละเอียด <ArrowRight size={14} weight="bold" aria-hidden />
          </span>
        </div>
      </article>
    </div>
  );
}

/** อันดับ 2–3 — การ์ดแนวนอน: รูปสี่เหลี่ยม + เลขอันดับ · ชื่อ · ข้อมูล · จำนวนโหวต */
function RunnerUpCard({ bar }: { bar: RankedBar }) {
  return (
    <article
      className={`group relative flex items-center gap-4 rounded-2xl p-3 md:p-4 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-gold ${SURFACE} ${SURFACE_HOVER}`}
    >
      <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-black/30 md:size-28">
        <img
          src={barImage(bar)}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
        <span className="absolute left-1.5 top-1.5 inline-flex size-7 items-center justify-center rounded-full border border-gold bg-black/70 text-sm font-bold text-gold backdrop-blur-md">
          {bar.rank}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-semibold text-gold-text md:text-lg">
            <Link
              to={`/bars/${bar.slug}`}
              className="!text-gold-text outline-none after:absolute after:inset-0"
            >
              {bar.name}
            </Link>
          </h3>
          {bar.promoted && <PromotedTag />}
        </div>
        <BarMeta bar={bar} className="mt-1 !text-xs" />
        <p className="mt-2 text-xs text-muted">
          <span className="font-semibold text-text">{bar.votes.toLocaleString('th-TH')}</span>{' '}
          โหวตสัปดาห์นี้
        </p>
      </div>
      <span
        className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-purple text-white transition-transform duration-150 ease-out group-hover:translate-x-0.5 sm:flex"
        aria-hidden
      >
        <ArrowRight size={16} weight="bold" />
      </span>
    </article>
  );
}

/** อันดับประจำสัปดาห์ (ตามโหวต เหมือนหน้า /ranking) — แบนเนอร์อันดับ 1 + การ์ดอันดับ 2–3 */
export function WeeklySpotlight({ bars }: { bars: RankedBar[] }) {
  const [leader, ...rest] = bars;
  if (!leader) return null;
  return (
    <section aria-labelledby="home-weekly" className="mx-auto max-w-7xl px-4 md:px-8">
      <SectionHeader
        id="home-weekly"
        eyebrow="นับจากโหวตของคนที่เช็กอินจริง"
        title="อันดับประจำสัปดาห์"
        to="/ranking"
      />
      <LeaderBanner bar={leader} />
      {rest.length > 0 && (
        <ul className="mt-4 grid gap-4 md:mt-5 md:grid-cols-2 md:gap-5">
          {rest.map((b) => (
            <li key={b.id}>
              <RunnerUpCard bar={b} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
