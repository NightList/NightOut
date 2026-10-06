import { listBars, rankingByPeriod } from '@/services/data';
import { useDemo } from '@/hooks/useDemo';
import { AuroraBackdrop } from './components/auroraBackdrop';
import { CategoryGrid } from './components/categoryGrid';
import { Hero } from './components/hero';
import { Newsletter } from './components/newsletter';
import { PopularGrid } from './components/popularGrid';
import { WeeklySpotlight } from './components/weeklySpotlight';

/**
 * / — หน้าแรก
 * Hero → การ์ดหมวดหมู่ (ซ้อนทับขอบล่าง Hero) → อันดับประจำสัปดาห์ (แบนเนอร์อันดับ 1 + อันดับ 2–3) → กริดร้านยอดนิยม → สมัครข่าวสาร
 * (ฟุตเตอร์อยู่ใน MainLayout)
 */
export function HomePage() {
  useDemo();
  const popular = listBars({ sort: 'rating' }).slice(0, 8);
  // อันดับประจำสัปดาห์ตามโหวต (เดียวกับหน้า /ranking) — ไม่ซ้ำกับกริดยอดนิยมที่เรียงตามคะแนนรีวิว
  const weekly = rankingByPeriod('WEEK').slice(0, 3);

  return (
    <>
      <Hero />
      {/* ทุกส่วนใต้ Hero อยู่บนพื้นหลัง aurora เดียวกัน (<AuroraBackdrop>) — ซ้อนขึ้นทับ Hero ให้เห็นหมวดหมู่ตั้งแต่จอแรก · ธีมสว่างใช้พื้นเรียบ */}
      <div className="relative isolate z-10 -mt-28 md:-mt-36">
        <AuroraBackdrop />

        <div className="bg-gradient-to-b from-transparent via-background/80 to-background pt-24 md:pt-28 dark:bg-none">
          <CategoryGrid />
        </div>

        <div className="space-y-16 pb-10 pt-14 md:space-y-24 md:pb-14 md:pt-20">
          <WeeklySpotlight bars={weekly} />
          <PopularGrid bars={popular} />
          <Newsletter />
        </div>
      </div>
    </>
  );
}
