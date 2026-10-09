import { User } from '@phosphor-icons/react';
import { Layout } from 'antd';
import { Outlet, useLocation, useMatches } from 'react-router';
import { NAV } from '@/configs/nav';
import { useDemo } from '@/hooks/useDemo';
import { useAuth } from '@/services/auth';
import { AgeGate } from '@/ui/components/ageGate';
import { SiteFooter } from '@/ui/components/siteFooter';
import { BottomIsland, Navbar, type NavItem } from '@/ui/components/navbar';

/**
 * Layout หลักฝั่งลูกค้า
 * - Navbar แคปซูลลอย: หน้าแรกลอยทับ Hero (วิดีโอ) · หน้าอื่นเว้นที่ด้านบน
 * - หน้าแรกจัด container เอง (Hero เต็มจอ) · หน้าอื่นอยู่ใน max-w-7xl
 */
export function MainLayout() {
  useDemo();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  // handle ใน router:
  // - fullBleed: หน้าวาดเต็มจอเอง (ไม่มี container / ไม่เว้นที่ด้านบน)
  // - darkTop: ส่วนบนของหน้ามืดเสมอทุกธีม (ภาพ/วิดีโอกลางคืน) → navbar ใสตัวหนังสือขาวได้
  //   ไม่ใส่ = navbar ใช้สีตามธีม (เช่น /ranking ธีมสว่างพื้นขาว ถ้าใช้ตัวขาวจะมองไม่เห็น)
  const handles = useMatches().map(
    (m) => (m.handle ?? {}) as { fullBleed?: boolean; hideFooter?: boolean; darkTop?: boolean; merchantShell?: boolean },
  );
  const fullBleed = handles.some((h) => h.fullBleed);
  const hideFooter = handles.some((h) => h.hideFooter);
  // หน้าร้าน (/merchant/*): มือถือ/แท็บเล็ตใช้แถบบน + แท็บล่างของ MerchantLayout แทน navbar ของเว็บ
  const merchantShell = handles.some((h) => h.merchantShell);
  const bleed = isHome || fullBleed;
  const darkTop = isHome || handles.some((h) => h.darkTop);
  const isShop = user?.role === 'MERCHANT' || user?.role === 'STAFF';
  // ฝั่งร้านไม่มีหน้าการจองของลูกค้า — ซ่อน "การจอง" (ร้านดูการจองที่ /merchant/bookings)
  const baseNav = isShop ? NAV.filter((n) => n.to !== '/bookings') : NAV;
  const items: NavItem[] = [...baseNav, ...(isShop ? [{ to: '/merchant', label: 'ร้านของฉัน' }] : [])];

  return (
    <Layout className="min-h-dvh !bg-background">
      <AgeGate />
      <header className={`sticky top-0 z-40 h-0 ${merchantShell ? 'hidden lg:block' : ''}`}>
        <div className="flex justify-center px-3 pt-3 md:pt-4">
          <Navbar items={items} overVideo={darkTop} />
        </div>
      </header>

      {bleed ? (
        <main className="flex-1">
          <Outlet />
        </main>
      ) : (
        <main
          className={`mx-auto w-full max-w-7xl flex-1 ${
            merchantShell ? 'px-0 pb-0 pt-0 lg:px-4 lg:pb-10 lg:pt-24' : 'px-4 pb-24 pt-24 md:pb-10'
          }`}
        >
          <Outlet />
        </main>
      )}

      {!hideFooter && <SiteFooter />}

      {!merchantShell && <BottomIsland items={[...baseNav, { to: '/profile', label: 'โปรไฟล์', icon: User }]} />}
    </Layout>
  );
}
