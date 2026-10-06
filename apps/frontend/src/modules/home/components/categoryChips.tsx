import { Link } from 'react-router';
import { CATEGORIES } from '../utils/categories';

/**
 * แถวหมวดหมู่วงกลมไอคอน (Figma: ใต้ Hero) — ซ้อนทับขอบล่างของ Hero
 * มือถือปัดข้างได้ (snap) · "ร้านยอดนิยม" เป็นตัวเด่นด้วยวงทอง
 */
export function CategoryChips() {
  return (
    <nav aria-label="หมวดหมู่ร้าน" className="mx-auto max-w-7xl px-4 md:px-8">
      <ul className="-mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:justify-center md:gap-9 md:px-0 [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((c, i) => {
          const Icon = c.icon;
          const lead = i === 0;
          return (
            <li key={c.key} className="shrink-0 snap-start">
              <Link
                to={c.to}
                draggable={false}
                className="group flex w-[72px] flex-col items-center gap-2 select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold md:w-20"
              >
                <span
                  className={`flex size-14 items-center justify-center rounded-full border bg-black/45 backdrop-blur-md transition duration-150 ease-out group-active:scale-95 md:size-16 ${
                    lead
                      ? 'border-gold text-gold shadow-[0_0_24px_rgba(232,182,76,0.35)]'
                      : 'border-white/20 text-gold-text group-hover:border-gold/70'
                  }`}
                >
                  <Icon size={26} weight={lead ? 'fill' : 'regular'} aria-hidden />
                </span>
                <span
                  className={`text-center text-[13px] leading-tight text-balance ${
                    lead ? 'font-semibold text-gold-text' : 'text-white/85'
                  }`}
                >
                  {c.title}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
