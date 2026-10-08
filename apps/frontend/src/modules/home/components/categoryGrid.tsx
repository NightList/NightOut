import { ArrowRight, Crown } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { SectionHeader } from '@/ui/components/sectionHeader';
import type { HomeCategory } from '../type/category';

/**
 * ตำแหน่งบนกริดแบบ bento — เดสก์ท็อป 4 คอลัมน์ × 3 แถว:
 * ร้านยอดนิยม (2×2) | ผับ, ร้านอาหาร / ดนตรีสด, Rooftop · แถวล่าง: นั่งชิล, Outdoor, ปาร์ตี้ (กว้าง 2)
 * มือถือ 2 คอลัมน์: ยอดนิยมเต็มแถว (สูง 2) · ปาร์ตี้เต็มแถว
 */
const SPAN: Record<string, string> = {
  popular: 'col-span-2 row-span-2',
  party: 'col-span-2',
};

/**
 * "คืนนี้อยากได้ฟีลไหน" — การ์ดภาพเต็มใบ + ไล่เข้มด้านล่าง · ชื่อ/คำอธิบาย + ปุ่มลูกศรด้านล่าง
 * เนื้อหา (ชื่อ/คำอธิบาย/ลิงก์/ภาพ/ป้าย) มาจาก useHomeContent — แอดมินแก้ได้ · ตำแหน่งบนกริดตายตัวตาม key
 * ยังไม่มา (categories = undefined) → skeleton ตามกริดเดียวกัน
 */
export function CategoryGrid({
  eyebrow,
  title,
  categories,
}: {
  eyebrow?: string;
  title?: string;
  categories?: HomeCategory[];
}) {
  if (!categories || title === undefined) return <CategoryGridSkeleton />;
  return (
    <section aria-labelledby="home-categories" className="mx-auto max-w-7xl px-4 md:px-8">
      <SectionHeader
        id="home-categories"
        eyebrow={eyebrow || undefined}
        title={title}
        to="/search"
      />
      <ul className={GRID}>
        {categories.map((c) => (
          <li key={c.key} className={SPAN[c.key] ?? ''}>
            <CategoryCard category={c} />
          </li>
        ))}
      </ul>
    </section>
  );
}

const GRID =
  'grid auto-rows-[150px] grid-cols-2 gap-3 md:auto-rows-[190px] md:gap-4 lg:grid-cols-4 lg:auto-rows-[200px]';

/** ช่องบนกริดตามลำดับ slot ของ API (ใช้แค่วาง skeleton ให้ตรงตำแหน่งการ์ดจริง) */
const SKELETON_SLOTS = ['popular', 'pub', 'food', 'live', 'rooftop', 'chill', 'outdoor', 'party'];

function CategoryGridSkeleton() {
  return (
    <section
      role="status"
      aria-label="กำลังโหลดหมวดหมู่"
      className="mx-auto max-w-7xl px-4 motion-safe:animate-pulse md:px-8"
    >
      <div className="mb-5">
        <span className="mb-2 block h-4 w-24 rounded bg-muted/20" />
        <span className="block h-7 w-56 rounded-md bg-muted/20 md:h-9 md:w-72" />
      </div>
      <ul className={GRID}>
        {SKELETON_SLOTS.map((slot) => (
          <li
            key={slot}
            className={`rounded-2xl border border-white/[0.08] bg-[#14121c] ${SPAN[slot] ?? ''}`}
          />
        ))}
      </ul>
    </section>
  );
}

function CategoryCard({ category: c }: { category: HomeCategory }) {
  // การ์ดใหญ่ (ช่อง popular) ใช้ตัวอักษรใหญ่ + ปุ่มทอง · ป้ายแสดงได้ทุกช่องถ้าแอดมินใส่
  const featured = c.key === 'popular';
  return (
    <Link
      to={c.to}
      draggable={false}
      className="group relative flex h-full select-none flex-col justify-end overflow-hidden rounded-2xl border border-white/[0.08] bg-[#14121c] p-3 !text-white transition-[border-color,transform] duration-150 ease-out active:scale-[0.98] hover:border-purple/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold md:p-4"
    >
      <img
        src={c.image}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.04]"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-[#0b0912]/95 via-[#0b0912]/35 to-[#0b0912]/10"
      />

      <div className="relative flex items-end justify-between gap-2">
        <div className="min-w-0">
          {c.badge && (
            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-0.5 text-xs font-semibold text-on-gold">
              <Crown size={13} weight="fill" />
              {c.badge}
            </span>
          )}
          <h3
            className={`truncate font-semibold leading-tight ${
              featured ? 'text-2xl md:text-3xl' : 'text-[15px] md:text-base'
            }`}
          >
            {c.title}
          </h3>
          <p
            className={`mt-0.5 line-clamp-1 text-white/75 ${featured ? 'text-sm' : 'text-xs'}`}
          >
            {c.hint}
          </p>
        </div>
        <span
          aria-hidden
          className={`flex shrink-0 items-center justify-center rounded-full transition-transform duration-150 ease-out group-hover:translate-x-0.5 ${
            featured ? 'size-10 bg-gold text-on-gold' : 'size-7 bg-purple text-white md:size-8'
          }`}
        >
          <ArrowRight size={featured ? 18 : 15} weight="bold" />
        </span>
      </div>
    </Link>
  );
}
