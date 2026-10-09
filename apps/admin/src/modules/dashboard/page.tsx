import { PageContainer, StatisticCard } from '@ant-design/pro-components';
import { Link } from 'react-router';
import { LoadError } from '@/ui/components/LoadError';
import { useAdminDashboard } from './api';

const CARDS = [
  { key: 'bookings_today', title: 'การจองวันนี้', to: '/bookings' },
  { key: 'bars_pending', title: 'ร้านรออนุมัติ', to: '/merchants' },
  { key: 'deposits_to_verify', title: 'สลิปมัดจำรอตรวจ', to: '/deposits' },
  { key: 'payouts_pending', title: 'มัดจำรอโอนให้ร้าน', to: '/deposits' },
  { key: 'promo_slips_pending', title: 'สลิปโปรโมทรอตรวจ', to: '/promotions' },
  { key: 'reviews_reported', title: 'รีวิวถูกรายงาน', to: '/reviews' },
] as const;

/** ภาพรวมงานที่ทีมต้องทำวันนี้ — กดการ์ดเพื่อไปหน้าที่จัดการได้ */
export function DashboardPage() {
  const { data, isLoading, error, refetch } = useAdminDashboard();
  return (
    <PageContainer title="แดชบอร์ด">
      <LoadError error={error} onRetry={() => void refetch()} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((c) => (
          <Link key={c.key} to={c.to} className="block">
            <StatisticCard
              hoverable
              loading={isLoading}
              statistic={{ title: c.title, value: data?.[c.key] ?? 0 }}
            />
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
