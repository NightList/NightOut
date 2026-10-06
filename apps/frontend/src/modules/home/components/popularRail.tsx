import { CaretLeft, CaretRight, Sparkle, Star } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { CATEGORY_LABELS, type BarWithTier } from '@/services/data';
import { barImage } from '@/ui/utils/barImage';
import { CROWD } from '@/ui/utils/format';

/** การ์ดร้านแบบเล็ก (Figma: ร้านยอดนิยม) — รูป · ดาว · ชื่อ · ประเภท · ย่าน + จุดสถานะคน */
function CompactBarCard({ bar, eager }: { bar: BarWithTier; eager: boolean }) {
  const crowd = CROWD[bar.crowd];
  return (
    <Link
      to={`/bars/${bar.slug}`}
      draggable={false}
      className="group block w-[168px] shrink-0 snap-start select-none rounded-2xl border border-white/15 bg-[#1b1924]/60 p-1.5 !text-text backdrop-blur-xl transition-colors hover:border-gold/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold md:w-[200px]"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black/30">
        <img
          src={barImage(bar)}
          alt=""
          width={400}
          height={300}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {!bar.isNew && (
          <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-xs font-semibold text-white backdrop-blur-md">
            <Star size={12} weight="fill" className="text-gold" aria-hidden />
            {bar.rating.toFixed(1)}
          </span>
        )}
        {bar.promoted && (
          <span
            title="ร้านโปรโมท (โฆษณา)"
            className="absolute bottom-1.5 left-1.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] text-gold-text backdrop-blur-md"
          >
            แนะนำ<span className="sr-only"> · โฆษณา</span>
          </span>
        )}
      </div>
      <div className="px-1.5 pb-1.5 pt-2.5">
        <h3 className="truncate text-[15px] font-semibold text-white">{bar.name}</h3>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-white/65">
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
      </div>
    </Link>
  );
}

/**
 * แถวร้านยอดนิยมแบบเลื่อนข้าง (Figma: ใต้หมวดหมู่) — scroll-snap ปัดด้วยนิ้วได้ · เดสก์ท็อปมีลูกศร
 * แถบสั้นด้านล่างบอกตำแหน่ง (นับจากตำแหน่งที่เลื่อน) · ภาพ 3 ใบแรกโหลดทันที ที่เหลือ lazy
 */
export function PopularRail({ bars }: { bars: BarWithTier[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false, progress: 0 });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdge({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft >= max - 4,
      progress: max > 0 ? el.scrollLeft / max : 0,
    });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, bars.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
  };

  const BARS = 4;
  const active = Math.min(BARS - 1, Math.round(edge.progress * (BARS - 1)));

  return (
    <section aria-labelledby="home-popular" className="mx-auto mt-8 max-w-7xl px-4 md:mt-10 md:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        <div className="flex shrink-0 items-center gap-3 md:w-44">
          <Sparkle size={28} weight="fill" className="shrink-0 text-gold" aria-hidden />
          <div>
            <h2 id="home-popular" className="text-xl font-bold text-white">
              ร้านยอดนิยม
            </h2>
            <p className="text-xs text-white/65">อัปเดตจากรีวิวผู้ใช้จริง</p>
          </div>
        </div>

        <div className="relative min-w-0 flex-1">
          <ul
            ref={ref}
            onScroll={measure}
            className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] md:mx-0 md:scroll-px-0 md:px-0 [&::-webkit-scrollbar]:hidden"
          >
            {bars.map((b, i) => (
              <li key={b.id} className="shrink-0">
                <CompactBarCard bar={b} eager={i < 3} />
              </li>
            ))}
          </ul>
          <button
            type="button"
            aria-label="ร้านก่อนหน้า"
            disabled={edge.start}
            onClick={() => scrollBy(-1)}
            className="absolute -left-4 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/70 text-white backdrop-blur-md transition active:scale-95 disabled:pointer-events-none disabled:opacity-0 md:flex"
          >
            <CaretLeft size={18} weight="bold" />
          </button>
          <button
            type="button"
            aria-label="ร้านถัดไป"
            disabled={edge.end}
            onClick={() => scrollBy(1)}
            className="absolute -right-4 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-gold/70 bg-black/70 text-gold backdrop-blur-md transition active:scale-95 disabled:pointer-events-none disabled:opacity-0 md:flex"
          >
            <CaretRight size={18} weight="bold" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2" aria-hidden>
        {Array.from({ length: BARS }, (_, i) => (
          <span
            key={i}
            className={`h-1 w-14 rounded-full transition-colors duration-200 ${i === active ? 'bg-gold' : 'bg-white/20'}`}
          />
        ))}
      </div>
    </section>
  );
}
