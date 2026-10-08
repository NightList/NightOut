import { CaretDown, MagnifyingGlass, MapPin } from '@phosphor-icons/react';
import { DISTRICTS, type SiteHomeContent } from '@/services/data';
import { Dropdown } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { SkyBackdrop } from './skyBackdrop';

const HERE = 'ตำแหน่งปัจจุบัน';

/**
 * Hero (Figma: Main → Hero) — ภาพท้องฟ้ายามค่ำ + motion เบา ๆ เต็มจอ (<SkyBackdrop>)
 * หัวข้อ 3 ท่อน เช่น "คืนนี้ไป | ร้านไหน | ดี" (ตัวกลางใหญ่สีทอง) + ช่องค้นหากระจก มีเลือกย่าน/ตำแหน่ง
 * ข้อความ/ภาพมาจาก content (แอดมินแก้ได้ · ดู useHomeContent) · ยังไม่มา = skeleton แทนหัวข้อ (ช่องค้นหาใช้ได้เลย)
 */
export function Hero({
  content: c,
  failed = false,
  onRetry,
}: {
  content?: Omit<SiteHomeContent, 'updated_at'>;
  /** โหลดเนื้อหาไม่สำเร็จ → แสดงข้อความ + ปุ่มลองใหม่แทน skeleton */
  failed?: boolean;
  onRetry?: () => void;
}) {
  const navigate = useNavigate();
  const [area, setArea] = useState(HERE);

  return (
    <section className="relative isolate flex min-h-[540px] items-center overflow-hidden bg-[#07070d] pb-24 pt-20 md:min-h-[620px] md:pb-32 md:pt-24">
      {/* ยังไม่รู้ภาพ Hero จาก API → แสดงแค่พื้นสีกลางคืน (ไม่โหลดภาพตั้งต้นทิ้งแล้วสลับกลางคัน) */}
      <SkyBackdrop imageUrl={c?.hero_image_url} pending={!c} />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
      {/* ธีมสว่างเท่านั้น: ไล่ขอบล่างเข้าสีพื้น · ธีมมืดต่อกับพื้นหลัง aurora ของหน้าแรก (<AuroraBackdrop> ใน page.tsx) */}
      <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-background to-transparent dark:hidden" />

      <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 text-center md:px-8">
        {c ? (
          <>
            <h1 className="flex items-end justify-center gap-x-2 font-bold leading-none text-white md:gap-x-5">
              <span className="shrink-0 pb-[0.35em] text-xl drop-shadow sm:text-3xl md:text-5xl">
                {c.hero_title_lead}
              </span>
              <span className="bg-gradient-to-b from-[#ffe39a] via-gold to-[#b9832a] -mt-[0.3em] bg-clip-text pb-[0.1em] pt-[0.3em] text-[3.9rem] leading-[1.1] text-transparent sm:text-[5.5rem] drop-shadow-[0_4px_24px_rgba(232,182,76,0.35)] md:text-[9rem]">
                {c.hero_title_highlight}
              </span>
              {c.hero_title_tail && (
                <span className="shrink-0 pb-[0.35em] text-xl drop-shadow sm:text-3xl md:text-5xl">
                  {c.hero_title_tail}
                </span>
              )}
            </h1>
            {c.hero_subtitle && (
              <p className="mt-4 max-w-xl text-balance text-base text-white/80 md:text-lg">
                {c.hero_subtitle}
              </p>
            )}
          </>
        ) : failed ? (
          <div role="alert" className="flex flex-col items-center gap-4 text-white">
            <p className="max-w-md text-balance text-base text-white/80 md:text-lg">
              โหลดเนื้อหาหน้าแรกไม่สำเร็จ ตรวจการเชื่อมต่อแล้วลองใหม่
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg border border-white/25 px-5 py-2 text-sm font-semibold text-white transition select-none hover:bg-white/10 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              ลองใหม่
            </button>
          </div>
        ) : (
          <HeroTitleSkeleton />
        )}

        <form
          role="search"
          className="mt-8 flex w-full max-w-3xl flex-wrap items-center text-left gap-2 rounded-lg border sm:flex-nowrap border-white/15 bg-white/10 p-1.5 pl-5 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          onSubmit={(e) => {
            e.preventDefault();
            const q = new FormData(e.currentTarget).get('q')?.toString().trim() ?? '';
            const sp = new URLSearchParams();
            if (q) sp.set('q', q);
            if (area !== HERE) sp.set('district', area);
            navigate(`/search${sp.size ? `?${sp}` : ''}`);
          }}
        >
          <MagnifyingGlass size={20} className="shrink-0 text-white/70" aria-hidden />
          <input
            name="q"
            aria-label="ค้นหาร้าน"
            placeholder={c?.hero_search_placeholder}
            className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-white outline-none placeholder:text-white/70"
          />
          <span className="hidden h-7 w-px bg-white/20 sm:block" aria-hidden />
          <Dropdown
            trigger={['click']}
            menu={{
              selectable: true,
              selectedKeys: [area],
              onClick: ({ key }) => setArea(key),
              items: [HERE, ...DISTRICTS].map((d) => ({ key: d, label: d })),
            }}
          >
            <button
              type="button"
              aria-label={`ย่าน: ${area}`}
              className="order-last -ml-3.5 flex w-[calc(100%+0.875rem)] shrink-0 items-center gap-1.5 border-t border-white/10 px-3 pb-1.5 pt-3 text-sm text-white/85 transition-colors select-none hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-gold sm:order-none sm:ml-0 sm:w-auto sm:rounded-full sm:border-t-0 sm:py-2"
            >
              <MapPin size={18} weight="fill" className="text-gold" />
              <span className="truncate">{area}</span>
              <CaretDown size={14} className="ml-auto sm:ml-0" />
            </button>
          </Dropdown>
          <button
            type="submit"
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-on-gold transition select-none hover:bg-gold-highlight active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold md:px-7"
          >
            <MagnifyingGlass size={16} weight="bold" />
            ค้นหา
          </button>
        </form>
      </div>
    </section>
  );
}

/** แทนหัวข้อ + คำโปรยระหว่างรอ API — สูงใกล้ของจริง หน้าไม่กระโดดตอนข้อมูลมา */
function HeroTitleSkeleton() {
  return (
    <div role="status" aria-label="กำลังโหลด" className="flex w-full flex-col items-center motion-safe:animate-pulse">
      <div className="flex items-end gap-x-2 md:gap-x-5">
        <span className="mb-[0.6em] h-6 w-16 rounded-md bg-white/10 sm:h-8 sm:w-24 md:h-12 md:w-40" />
        <span className="h-[3.6rem] w-36 rounded-xl bg-gold/15 sm:h-[5rem] sm:w-52 md:h-[8.5rem] md:w-96" />
        <span className="mb-[0.6em] h-6 w-8 rounded-md bg-white/10 sm:h-8 sm:w-10 md:h-12 md:w-16" />
      </div>
      <span className="mt-5 h-4 w-72 max-w-full rounded bg-white/10 md:h-5 md:w-[28rem]" />
      <span className="mt-2 h-4 w-48 rounded bg-white/10 md:h-5 md:w-72" />
    </div>
  );
}
