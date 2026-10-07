import { ArrowRight, Crown } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { SectionHeader } from '@/ui/components/sectionHeader';
import type { HomeCategory } from '../type/category';
import { CATEGORIES } from '../utils/categories';

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
 * "คืนนี้อยากได้ฟีลไหน" — การ์ดภาพเต็มใบ + ไล่เข้มด้านล่าง · ไอคอนหมวดมุมซ้ายบน · ชื่อ/คำอธิบาย + ปุ่มลูกศรด้านล่าง
 * การ์ดเด่น (มี badge) ใช้ป้ายและปุ่มสีทอง ที่เหลือปุ่มม่วง
 */
export function CategoryGrid() {
  return (
    <section aria-labelledby="home-categories" className="mx-auto max-w-7xl px-4 md:px-8">
      <SectionHeader
        id="home-categories"
        eyebrow="เลือกตามสไตล์"
        title="คืนนี้อยากได้ฟีลไหน"
        to="/search"
      />
      <ul className="grid auto-rows-[150px] grid-cols-2 gap-3 md:auto-rows-[190px] md:gap-4 lg:grid-cols-4 lg:auto-rows-[200px]">
        {CATEGORIES.map((c) => (
          <li key={c.key} className={SPAN[c.key] ?? ''}>
            <CategoryCard category={c} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function CategoryCard({ category: c }: { category: HomeCategory }) {
  const Icon = c.icon;
  const featured = Boolean(c.badge);
  return (
    <Link
      to={c.to}
      draggable={false}
      className="group relative flex h-full select-none flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#14121c] p-3 !text-white transition-[border-color,transform] duration-150 ease-out active:scale-[0.98] hover:border-purple/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold md:p-4"
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

      <span
        aria-hidden
        className="relative flex size-8 items-center justify-center rounded-lg border border-purple/40 bg-[#1a1028]/70 text-link md:size-9"
      >
        <Icon size={18} weight="duotone" />
      </span>

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
