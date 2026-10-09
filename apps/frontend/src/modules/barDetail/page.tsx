import { Button, Drawer, Empty, Tabs } from 'antd';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useDemo } from '@/hooks/useDemo';
import { barReviews, getBarBySlug } from '@/services/data';
import { NotFoundResult } from '@/ui/components/notFoundResult';
import { PRBadge } from '@/ui/components/prBadge';
import { PriceEstimator, type EstimatorValue } from '@/ui/components/priceEstimator';
import { ReviewList } from '@/ui/components/reviewList';
import { SafetyList } from '@/ui/components/safetyList';
import { BarFacts } from './components/barFacts';
import { BarGallery } from './components/barGallery';
import { BarHeader, BarHero } from './components/barHeader';
import { BookingBar, BookingCard } from './components/bookingActions';
import { LocationSection } from './components/locationSection';
import { MenuTable } from './components/menuTable';
import { OpeningHours } from './components/openingHours';
import { Perks, SocialLinks } from './components/perksAndLinks';
import { PromotionList } from './components/promotionList';

/** /bars/:slug — หน้าร้าน: หัวร้าน + แถบรูปร้าน → แท็บ (ข้อมูล/เมนู/ความปลอดภัย/รีวิว) · การ์ดจองด้านขวา · ลิ้นชักประเมินราคา */
export function BarDetailPage() {
  useDemo();
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const bar = getBarBySlug(slug);
  const [estOpen, setEstOpen] = useState(false);
  const [est, setEst] = useState<EstimatorValue>({ pax: 4, qty: {} });

  if (!bar || bar.status !== 'APPROVED') return <NotFoundResult title="ไม่พบร้านนี้" kind="bar" />;
  const reviews = barReviews(bar.id);
  const book = () => navigate(`/bars/${bar.slug}/book`);
  const estimate = () => setEstOpen(true);

  return (
    <div className="pb-20">
      <BarHero bar={bar} />
      <BarGallery bar={bar} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <BarHeader bar={bar} />
          <Tabs
            className="mt-6"
            items={[
              {
                key: 'info',
                label: 'ข้อมูลร้าน',
                children: (
                  <div className="space-y-6">
                    <BarFacts bar={bar} />
                    <PRBadge pr={bar.pr} />
                    <PromotionList promotions={bar.promotions} />
                    <LocationSection bar={bar} />
                    <OpeningHours hours={bar.hours} />
                    <Perks perks={bar.perks} />
                    <SocialLinks links={bar.links} />
                  </div>
                ),
              },
              { key: 'menu', label: 'เมนู & ราคา', children: <MenuTable menu={bar.menu} /> },
              { key: 'safety', label: 'ความปลอดภัย', children: <SafetyList bar={bar} /> },
              {
                key: 'reviews',
                label: `รีวิว (${reviews.length})`,
                children: reviews.length ? (
                  <ReviewList reviews={reviews.slice(0, 5)} more={`/bars/${bar.slug}/reviews`} />
                ) : (
                  <Empty description="ยังไม่มีรีวิว" />
                ),
              },
            ]}
          />
        </div>

        <aside className="hidden lg:block">
          <BookingCard avgPerPerson={bar.avgPerPerson} onEstimate={estimate} onBook={book} />
        </aside>
      </div>

      <BookingBar onEstimate={estimate} onBook={book} />

      <Drawer
        open={estOpen}
        onClose={() => setEstOpen(false)}
        title={`ประเมินราคา · ${bar.name}`}
        placement="right"
        size="large"
        footer={
          <Button block type="primary" size="large" onClick={book}>
            จองโต๊ะ
          </Button>
        }
      >
        <PriceEstimator bar={bar} value={est} onChange={setEst} />
      </Drawer>
    </div>
  );
}
