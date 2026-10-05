import { CATEGORY_LABELS, listBars, rankingByPeriod, type RankingPeriod } from '@/services/data';
import type { BarCategory } from '@nightout/types';
import { Empty, Segmented } from 'antd';
import { useSearchParams } from 'react-router';
import { useDemo } from '@/hooks/useDemo';
import { Podium } from './components/podium';
import { RadialCarousel } from './components/radialCarousel';
import { RankList } from './components/rankList';
import { ScrollReveal } from './components/scrollReveal';
import { SplitHeading } from './components/splitHeading';

const PERIOD_LABEL: Record<RankingPeriod, string> = { WEEK: 'สัปดาห์นี้', MONTH: 'เดือนนี้' };

/**
 * /ranking — จัดอันดับรายสัปดาห์ / รายเดือน (Figma "จัดอันดับ")
 * 1) Hero วงล้อการ์ดหมุน (GSAP: หมุนต่อเนื่อง + scrub ตามการเลื่อน)
 * 2) "สัปดาห์นี้ผู้ชนะได้แก่…" + แท่น 3 อันดับ (การ์ดกางเป็นพัดตามการเลื่อน)
 * 3) อันดับ 4–10 (ไล่ขึ้นทีละแถว)
 * ตัวเลือกช่วงเวลา/ประเภทร้านอยู่ใน URL (?period=MONTH&category=PUB_BAR) แชร์ลิงก์ได้
 */
export function RankingPage() {
  useDemo();
  const [params, setParams] = useSearchParams();
  const period = (params.get('period') as RankingPeriod | null) ?? 'WEEK';
  const category = (params.get('category') as BarCategory | null) ?? 'ALL';
  const ranked = rankingByPeriod(period, category);
  const heroBars = listBars({ sort: 'rating' });

  const set = (k: string, v: string, fallback: string) => {
    const p = new URLSearchParams(params);
    if (v === fallback) p.delete(k);
    else p.set(k, v);
    setParams(p, { replace: true, preventScrollReset: true });
  };

  return (
    <div className="pb-24 md:pb-16">
      <RadialCarousel bars={heroBars}>
        <h1 className="text-3xl font-bold sm:text-5xl lg:text-6xl">
          จัดอันดับร้าน
        </h1>
        <p className="mx-auto mt-2 max-w-48 text-balance text-xs text-muted sm:max-w-md sm:text-base">
          นับจากโหวตของคนที่เช็กอินจริง โฆษณาซื้ออันดับไม่ได้
        </p>
      </RadialCarousel>

      <section className="mx-auto max-w-7xl px-4 pt-16 sm:pt-24">
        <ScrollReveal className="flex flex-col items-center gap-3">
          <Segmented
            size="large"
            value={period}
            onChange={(v) => set('period', String(v), 'WEEK')}
            options={[
              { label: 'รายสัปดาห์', value: 'WEEK' },
              { label: 'รายเดือน', value: 'MONTH' },
            ]}
          />
          <div className="-mx-4 max-w-[100vw] overflow-x-auto px-4 [scrollbar-width:none]">
          <Segmented
            value={category}
            onChange={(v) => set('category', String(v), 'ALL')}
            options={[
              { label: 'ทั้งหมด', value: 'ALL' },
              ...(['PUB_BAR', 'CHILL', 'RESTAURANT'] as const).map((c) => ({
                label: CATEGORY_LABELS[c],
                value: c,
              })),
            ]}
          />
          </div>
        </ScrollReveal>

        <div className="mt-14 sm:mt-20">
          <SplitHeading key={period} lead={PERIOD_LABEL[period]} text="ผู้ชนะได้แก่" />
        </div>

        {ranked.length === 0 ? (
          <Empty className="mt-12" description="ยังไม่มีร้านในหมวดนี้" />
        ) : (
          <>
            <div className="mt-10 sm:mt-14">
              <Podium key={`${period}-${category}`} top3={ranked.slice(0, 3)} />
            </div>
            <div className="mt-16 sm:mt-20">
              <RankList key={`${period}-${category}`} rows={ranked.slice(3, 10)} />
            </div>
          </>
        )}

        <ScrollReveal>
        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted">
          อันดับรีเซ็ตทุกวันจันทร์ (รายสัปดาห์) และวันที่ 1 (รายเดือน) · 1 การจองที่เช็กอินแล้ว = 1 โหวต ·
          ร้านที่มีรีวิวน้อยกว่า 5 รีวิวยังไม่ติดอันดับ
        </p>
        </ScrollReveal>
      </section>
    </div>
  );
}
