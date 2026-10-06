import { listBars, rankingByPeriod } from '@/services/data';
import { SectionHeader } from '@/ui/components/sectionHeader';
import { useDemo } from '@/hooks/useDemo';
import { AuroraBackdrop } from './components/auroraBackdrop';
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
      {/* ทุกส่วนใต้ Hero อยู่บนพื้นหลัง aurora เดียวกัน (<AuroraBackdrop>) — ซ้อนขึ้นทับ Hero ให้เห็นร้านตั้งแต่จอแรก · ธีมสว่างใช้พื้นเรียบ */}
      <div className="relative isolate z-10 -mt-28 md:-mt-36">
        <AuroraBackdrop />

        <div className="bg-gradient-to-b from-transparent via-background/80 to-background pb-10 pt-24 md:pt-28 dark:bg-none">
          <CategoryChips />
          <PopularRail bars={popular} />
        </div>

        <div className="pb-10 md:pb-14">
          <div className="space-y-16 md:space-y-24">
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
      </div>
    </>
  );
}
