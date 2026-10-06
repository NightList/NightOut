import { ArrowRight } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { SectionHeader } from '@/ui/components/sectionHeader';
import { CATEGORIES } from '../utils/categories';
import { SURFACE } from '../utils/surface';

/**
 * การ์ดหมวดหมู่ใต้ Hero — ไอคอนใหญ่บนแสงเรืองม่วง + ฐานวงแหวน · ล่าง: ชื่อ · คำอธิบาย · ปุ่มลูกศร
 * มือถือ 2 คอลัมน์ · เดสก์ท็อป 4 คอลัมน์ · ทุกการ์ดโทนม่วงเดียวกัน
 */
export function CategoryGrid() {
  return (
    <section aria-labelledby="home-categories" className="mx-auto max-w-7xl px-4 md:px-8">
      <SectionHeader
        id="home-categories"
        eyebrow="เลือกตามสไตล์"
        title="หมวดหมู่ร้าน"
        to="/search"
      />
      <ul className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <li key={c.key}>
              <Link
                to={c.to}
                draggable={false}
                className={`group flex h-full select-none flex-col overflow-hidden rounded-2xl !text-text transition-[border-color,transform] duration-150 ease-out active:scale-[0.98] hover:border-purple/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold dark:hover:border-purple/50 ${SURFACE}`}
              >
                <div
                  className="relative flex aspect-[16/8] items-center justify-center overflow-hidden md:aspect-[16/10]"
                  style={{
                    background:
                      'radial-gradient(60% 70% at 50% 62%, rgba(167,56,245,0.2), transparent 70%)',
                  }}
                  aria-hidden
                >
                  <span className="absolute bottom-[14%] h-4 w-3/5 rounded-[50%] border border-purple/50 shadow-[0_0_8px_rgba(167,56,245,0.3)] md:h-7" />
                  <Icon
                    weight="duotone"
                    className="relative size-10 -translate-y-1 text-link transition-transform duration-300 ease-out group-hover:-translate-y-3 md:size-16"
                  />
                </div>
                <div className="flex flex-1 items-end justify-between gap-2 border-t border-border px-3 py-2.5 dark:border-white/[0.06] md:p-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-semibold md:text-base">{c.title}</h3>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">{c.hint}</p>
                  </div>
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-purple text-white transition-transform duration-150 ease-out group-hover:translate-x-0.5 md:size-8"
                    aria-hidden
                  >
                    <ArrowRight size={15} weight="bold" />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
