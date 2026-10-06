import {
  CalendarCheck,
  ChartLine,
  ChatCircleText,
  ForkKnife,
  Gauge,
  Gear,
  Megaphone,
  QrCode,
  Receipt,
  ShieldCheck,
  Storefront,
  Table as TableIcon,
  Tag,
  UsersThree,
  Wallet,
} from '@phosphor-icons/react';
import { getBar } from '@/services/data';
import { Alert, Menu, Result } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '@/services/auth';
import { useDemo } from '@/hooks/useDemo';
import { barImage } from '@/ui/utils/barImage';

const ITEMS = [
  { key: '/merchant', icon: <Gauge />, label: 'แดชบอร์ด', staff: false },
  { key: '/merchant/tonight', icon: <QrCode />, label: 'คืนนี้ (Scanner)', staff: true },
  { key: '/merchant/bookings', icon: <CalendarCheck />, label: 'การจอง', staff: true },
  { key: '/merchant/deposits', icon: <Wallet />, label: 'เงินมัดจำ', staff: false },
  { key: '/merchant/store', icon: <Storefront />, label: 'ข้อมูลร้าน', staff: false },
  { key: '/merchant/menu', icon: <ForkKnife />, label: 'เมนู', staff: false },
  { key: '/merchant/promotions', icon: <Tag />, label: 'โปรโมชัน', staff: false },
  { key: '/merchant/tables', icon: <TableIcon />, label: 'โซน / โต๊ะ', staff: false },
  { key: '/merchant/safety', icon: <ShieldCheck />, label: 'ความปลอดภัย', staff: false },
  { key: '/merchant/settings', icon: <Gear />, label: 'ตั้งค่าการจอง', staff: false },
  { key: '/merchant/promote', icon: <Megaphone />, label: 'โปรโมทร้าน', staff: false },
  { key: '/merchant/reviews', icon: <ChatCircleText />, label: 'รีวิว', staff: false },
  { key: '/merchant/analytics', icon: <ChartLine />, label: 'สถิติ', staff: false },
  { key: '/merchant/billing', icon: <Receipt />, label: 'ค่าคอม', staff: false },
  { key: '/merchant/staff', icon: <UsersThree />, label: 'พนักงาน', staff: false },
];

/** Layout ฝั่งร้าน — Staff เห็นเฉพาะ คืนนี้ + การจอง */
export function MerchantLayout() {
  useDemo();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const bar = user?.barId ? getBar(user.barId) : null;
  if (!bar)
    return (
      <Result
        status="info"
        title="บัญชีนี้ยังไม่ได้ผูกกับร้าน"
        subTitle="สมัครเป็นร้านค้าเพื่อเริ่มใช้งาน"
      />
    );
  // สิทธิ์ตามบทบาทในทีมร้านนี้ (bar_staff) — พนักงานเห็นแค่ คืนนี้ + การจอง
  const items = ITEMS.filter((i) => bar.staffRole !== 'STAFF' || i.staff).map(
    ({ key, icon, label }) => ({ key, icon, label }),
  );
  const selected = [...items]
    .sort((a, b) => b.key.length - a.key.length)
    .find((i) => location.pathname.startsWith(i.key))?.key;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div
          className="mb-3 rounded-2xl border border-border bg-cover bg-center p-4"
          style={{
            backgroundImage: `linear-gradient(to top, rgba(0,0,0,.65), rgba(0,0,0,.15)), url(${barImage(bar)})`,
          }}
        >
          <p className="text-xs text-white/80">
            {bar.staffRole === 'STAFF' ? 'พนักงาน' : bar.staffRole === 'MANAGER' ? 'ผู้จัดการร้าน' : 'ร้านของฉัน'}
          </p>
          <p className="font-display text-xl font-bold text-white">{bar.name}</p>
        </div>
        <Menu
          mode="inline"
          selectedKeys={selected ? [selected] : []}
          items={items}
          onClick={(e) => navigate(e.key)}
          className="!hidden !rounded-2xl !border !border-border lg:!block"
        />
        <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden">
          {items.map((i) => (
            <button
              key={i.key}
              type="button"
              onClick={() => navigate(i.key)}
              className={`flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-sm ${selected === i.key ? 'border-gold text-gold-text' : 'border-border text-muted'}`}
            >
              {i.icon} {i.label}
            </button>
          ))}
        </div>
      </aside>
      <section className="min-w-0">
        {bar.status !== 'APPROVED' && (
          <Alert
            className="!mb-4"
            showIcon
            type={bar.status === 'PENDING_REVIEW' || bar.status === 'DRAFT' ? 'info' : 'warning'}
            title={
              bar.status === 'PENDING_REVIEW' || bar.status === 'DRAFT'
                ? 'ร้านกำลังรอทีม NightOut ตรวจ — ลูกค้ายังไม่เห็นร้าน ระหว่างนี้เตรียมข้อมูลร้าน เมนู โต๊ะ และตั้งค่าการจองได้'
                : bar.status === 'REJECTED'
                  ? 'ร้านยังไม่ผ่านการตรวจ — ลูกค้ายังไม่เห็นร้าน'
                  : 'ร้านถูกระงับชั่วคราว — ลูกค้าไม่เห็นร้านและจองไม่ได้'
            }
            description={bar.statusReason}
          />
        )}
        <Outlet context={bar} />
      </section>
    </div>
  );
}
