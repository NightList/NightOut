import { CalendarCheck } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { CATEGORY_LABELS, type BarWithTier } from '@/services/data';
import { useCrowdStatus } from '@/hooks/useCrowdStatus';
import { BarRating } from '@/ui/components/barRating';
import { FavoriteButton } from '@/ui/components/favoriteButton';
import { SectionHeader } from '@/ui/components/sectionHeader';
import { barImage } from '@/ui/utils/barImage';
import { baht } from '@/ui/utils/format';
import { SURFACE, SURFACE_HOVER } from '../utils/surface';
import { PromotedTag } from './promotedTag';

/** ป้ายมุมซ้ายบนรูป (ไม่ใช่โฆษณา) — ร้านโปรโมทใช้ <PromotedTag> แทนและมาก่อนเสมอ · ไม่เข้าเงื่อนไขก็ไม่แสดง */
function badgeOf(bar: BarWithTier): { label: string; className: string } | null {
  if (bar.isNew) return { label: 'ร้านใหม่', className: 'bg-[var(--crowd-available)] text-white' };
  return null;
}

/** จุดสถานะคน + ประเภท · ย่าน (สถานะเก่าเกิน 60 นาที = จุดเทา "ไม่ทราบสถานะ") */
function CrowdLine({ bar }: { bar: BarWithTier }) {
  const crowd = useCrowdStatus(bar.crowd, bar.crowdUpdatedAt);
  return (
    <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted">
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ background: crowd.dot }}
        title={crowd.label}
        role="img"
        aria-label={`สถานะ: ${crowd.label}`}
      />
      <span className="truncate">
        {CATEGORY_LABELS[bar.category]} · {bar.district}
      </span>
    </p>
  );
}

/**
 * การ์ดร้าน (กริดร้านยอดนิยม) — รูป · ป้าย · หัวใจ · ดาว · ชื่อ · ประเภท/ย่าน · งบต่อคน · ปุ่มจองโต๊ะ
 * ทั้งการ์ดกดไปหน้าร้าน (ลิงก์ที่ชื่อขยายเต็มการ์ด) · หัวใจกับปุ่มจองอยู่ชั้นบน
 */
function PopularBarCard({ bar }: { bar: BarWithTier }) {
  const badge = badgeOf(bar);
  return (
    <article
      className={`group relative flex h-full flex-col rounded-2xl p-2 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-gold ${SURFACE} ${SURFACE_HOVER}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black/30">
        {/* กริดนี้อยู่ใต้ส่วนอันดับ (พ้นจอแรก) — lazy ทุกรูป ไม่แย่งโหลดกับภาพ Hero */}
        <img
          src={barImage(bar)}
          alt=""
          width={400}
          height={300}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {bar.promoted ? (
          <PromotedTag variant="solid" className="absolute left-2 top-2" />
        ) : (
          badge && (
            <span
              className={`absolute left-2 top-2 rounded-md px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
            >
              {badge.label}
            </span>
          )
        )}
        <FavoriteButton
          barId={bar.id}
          className="!absolute right-2 top-2 z-10 !size-8 !min-w-8 !border-0 !bg-black/55 !text-white backdrop-blur-md"
        />
      </div>

      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3">
        <p className="min-w-0 text-xs [&>span]:flex-wrap [&>span]:gap-y-0.5">
          <BarRating bar={bar} compact />
        </p>
        <h3 className="mt-1 truncate text-[15px] font-semibold md:text-base">
          <Link
            to={`/bars/${bar.slug}`}
            draggable={false}
            className="!text-text outline-none after:absolute after:inset-0 after:rounded-2xl"
          >
            {bar.name}
          </Link>
        </h3>
        <CrowdLine bar={bar} />
        {bar.avgPerPerson > 0 && (
          <p className="mt-2">
            <span className="text-lg font-bold text-gold-text">{baht(bar.avgPerPerson)}</span>
            <span className="text-xs text-muted"> / คน โดยประมาณ</span>
          </p>
        )}

        <div className="mt-auto pt-3">
          <Link
            to={`/bars/${bar.slug}/book`}
            draggable={false}
            className="relative z-10 flex select-none items-center justify-center gap-1.5 rounded-lg bg-gold py-2 text-sm font-semibold !text-on-gold transition duration-150 ease-out [touch-action:manipulation] hover:bg-gold-highlight active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <CalendarCheck size={16} weight="fill" aria-hidden />
            จองโต๊ะ
          </Link>
        </div>
      </div>
    </article>
  );
}

/**
 * กริดร้านยอดนิยม (ร้านที่แอดมินปัก + เติมด้วยคะแนนรีวิว · ดู utils/popularBars) — มือถือ 2 คอลัมน์ · md ขึ้นไป 4 คอลัมน์
 * หัวข้อแก้ได้ที่ Backoffice · ระหว่างรอ API ใช้ข้อความเดิม (section นี้อยู่พ้นจอแรก ไม่ต้องมี skeleton)
 */
export function PopularGrid({
  bars,
  eyebrow = 'คะแนนรีวิวสูงสุด',
  title = 'ร้านยอดนิยม',
}: {
  bars: BarWithTier[];
  eyebrow?: string;
  title?: string;
}) {
  if (!bars.length) return null;
  return (
    <section aria-labelledby="home-popular" className="mx-auto max-w-7xl px-4 md:px-8">
      <SectionHeader id="home-popular" eyebrow={eyebrow || undefined} title={title} to="/search" />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {bars.map((b) => (
          <li key={b.id}>
            <PopularBarCard bar={b} />
          </li>
        ))}
      </ul>
    </section>
  );
}
