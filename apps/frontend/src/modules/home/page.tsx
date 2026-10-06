import { listBars, rankingByPeriod } from '@/services/data';
import { SectionHeader } from '@/ui/components/sectionHeader';
import { useDemo } from '@/hooks/useDemo';
import { CategoryChips } from './components/categoryChips';
import { Hero } from './components/hero';
import { Newsletter } from './components/newsletter';
import { PopularRail } from './components/popularRail';
import { WeeklyBarCard } from './components/weeklyBarCard';

/**
 * / — หน้าแรก (Figma: Main)
 * จอแรก: Hero → หมวดหมู่วงกลม → ร้านยอดนิยม (ซ้อนทับขอบล่าง Hero) · ต่อด้วยอันดับประจำสัปดาห์ → สมัครข่าวสาร
 * (ฟุตเตอร์อยู่ใน MainLayout)
 */
export function HomePage() {
  useDemo();
  const popular = listBars({ sort: 'rating' }).slice(0, 10);
  // อันดับประจำสัปดาห์ตามโหวต (เดียวกับหน้า /ranking) — ไม่ซ้ำกับแถวยอดนิยมที่เรียงตามคะแนนรีวิว
  const weekly = rankingByPeriod('WEEK').slice(0, 3);

  return (
    <>
      <Hero />
      {/* ซ้อนขึ้นทับ Hero ให้เห็นร้านตั้งแต่จอแรก */}
      <div className="relative z-10 -mt-28 bg-gradient-to-b from-transparent via-background/80 to-background pb-10 pt-24 md:-mt-36 md:pt-28">
        <CategoryChips />
        <PopularRail bars={popular} />
      </div>

      <div className="relative isolate overflow-hidden pb-10 md:pb-14">
        <div
          className="absolute inset-0 z-0 bg-[url(/images/home/base1-blur.webp)] bg-cover bg-center after:bg-black/60
               after:absolute after:inset-0 after:bg-linear-to-b after:from-background after:via-transparent after:to-gray-950"
          aria-hidden="true"
        />

        <div className="relative z-10 space-y-16 md:space-y-24">
          <section aria-labelledby="home-weekly" className="mx-auto max-w-7xl px-4 md:px-8">
            <SectionHeader id="home-weekly" title="อันดับประจำสัปดาห์" to="/ranking" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {weekly.map((b) => (
                <WeeklyBarCard key={b.id} bar={b} rank={b.rank} />
              ))}
            </div>
          </section>

          <Newsletter />
        </div>
      </div>
    </>
  );
}
