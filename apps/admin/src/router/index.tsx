import { createBrowserRouter } from 'react-router';
import { MainLayout } from '@/layouts/main';
import { AuditLogsPage } from '@/modules/auditLogs/page';
import { BarMediaPage } from '@/modules/barMedia/page';
import { BarsPage } from '@/modules/bars/page';
import { BillingPage } from '@/modules/billing/page';
import { BookingsPage } from '@/modules/bookings/page';
import { DashboardPage } from '@/modules/dashboard/page';
import { DepositsPage } from '@/modules/deposits/page';
import { LoginPage } from '@/modules/login/page';
import { MerchantsPage } from '@/modules/merchants/page';
import { PromotionsPage } from '@/modules/promotions/page';
import { RankingPage } from '@/modules/ranking/page';
import { ReviewsPage } from '@/modules/reviews/page';
import { SafetyPage } from '@/modules/safety/page';
import { SettingsPage } from '@/modules/settings/page';
import { TeamPage } from '@/modules/team/page';
import { HomeContentPage } from '@/modules/homeContent/page';
import { UsersPage } from '@/modules/users/page';

/** route ของ Backoffice — ต้องตรงกับเมนูใน configs/menu.tsx */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'merchants', element: <MerchantsPage /> },
      { path: 'bars', element: <BarsPage /> },
      { path: 'bar-media', element: <BarMediaPage /> },
      { path: 'safety', element: <SafetyPage /> },
      { path: 'ranking', element: <RankingPage /> },
      { path: 'promotions', element: <PromotionsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'team', element: <TeamPage /> },
      { path: 'home-content', element: <HomeContentPage /> },
      { path: 'bookings', element: <BookingsPage /> },
      { path: 'deposits', element: <DepositsPage /> },
      { path: 'reviews', element: <ReviewsPage /> },
      { path: 'billing', element: <BillingPage /> },
      { path: 'audit-logs', element: <AuditLogsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
], { basename: import.meta.env.BASE_URL.replace(/\/$/, "") });
