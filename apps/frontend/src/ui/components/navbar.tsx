import { Bell, SignOut, User, type Icon } from '@phosphor-icons/react';
import { myNotifications } from '@/services/data';
import { ThemeToggle } from '@nightout/ui';
import { App, Badge, Button, Dropdown, Empty, Tag } from 'antd';
import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { NOTIFICATION_PREVIEW_LIMIT } from '@/configs/app';
import { useDemo } from '@/hooks/useDemo';
import { useScrolled } from '@/hooks/useScrolled';
import { useAuth } from '@/services/auth';
import { timeAgo } from '@/ui/utils/format';

export interface NavItem {
  to: string;
  label: string;
  icon?: Icon;
  end?: boolean;
  /** แสดงเฉพาะ navbar บนจอใหญ่ (ไม่ใส่ใน BottomIsland มือถือ) */
  desktopOnly?: boolean;
}

/**
 * พื้นกระจกของ island มี 2 โหมด
 * - overVideo (หน้าแรก ยังไม่เลื่อน): กระจกใสบนวิดีโอ ตัวหนังสือขาว
 * - ปกติ: ใช้สีตามธีม (surface/text) → อ่านออกทั้ง dark และ light
 */
const ISLAND = {
  overVideo:
    'border-white/15 bg-white/15 text-white shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md',
  page: 'border-border bg-surface/85 text-text shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)] backdrop-blur-xl',
} as const;

const spring = { type: 'spring', stiffness: 420, damping: 34 } as const;

/**
 * Floating island navbar (บนสุด)
 * - แคปซูลลอยกลางจอ แยกจากขอบ · เลื่อนลงแล้วหดให้กะทัดรัด
 * - แถบไฮไลต์เลื่อนตามเมนูที่เลือก (layoutId)
 * - มือถือ: แสดงแค่โลโก้ + ปุ่ม, เมนูอยู่ที่ <BottomIsland>
 */
export function Navbar({
  items,
  overVideo = false,
  minimal = false,
}: {
  items: NavItem[];
  overVideo?: boolean;
  /** หน้า Auth: ไม่มีปุ่มเปลี่ยนธีม / ปุ่มเข้าสู่ระบบ (อยู่ในหน้าอยู่แล้ว) */
  minimal?: boolean;
}) {
  useDemo();
  const { user, signOut } = useAuth();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const scrolled = useScrolled();
  const reduce = useReducedMotion();
  // แจ้งเตือนจาก Supabase (services/sync.ts โหลดใหม่ทุก 60 วินาที)
  const notifications = user ? myNotifications() : [];
  const latestNotifications = notifications
    .toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, NOTIFICATION_PREVIEW_LIMIT);
  const unread = notifications.filter((n) => !n.readAt).length;
  const glass = overVideo && !scrolled;
  const dim = glass ? 'text-white/75 hover:text-white' : 'text-muted hover:text-text';

  const logout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      setProfileOpen(false);
      setNotificationsOpen(false);
      navigate('/', { replace: true });
    } catch {
      message.error('ออกจากระบบไม่สำเร็จ ลองใหม่อีกครั้ง');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <motion.div
      layout={!reduce}
      transition={spring}
      className={`flex items-center gap-2 rounded-full border px-2 transition-colors duration-300 ${glass ? ISLAND.overVideo : ISLAND.page} ${scrolled ? 'h-12 w-full max-w-3xl' : 'h-14 w-full max-w-4xl'}`}
    >
      <Link
        to="/"
        className="flex shrink-0 items-center gap-2 rounded-full pr-2 !text-gold"
        aria-label="NightOut หน้าแรก"
      >
        <img
          src="/images/common/logo.png"
          alt=""
          width={36}
          height={35}
          className={scrolled ? 'size-8' : 'size-9'}
        />
        <span
          className={`font-display text-lg font-bold ${glass ? 'text-gold' : 'text-gold-text'}`}
        >
          NightOut
        </span>
      </Link>

      <nav className="ml-auto hidden items-center md:flex" aria-label="เมนูหลัก">
        {items.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `relative isolate rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${isActive ? 'text-on-gold' : dim}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="island-active"
                    transition={reduce ? { duration: 0 } : spring}
                    className="absolute inset-0 -z-10 rounded-full bg-gold"
                  />
                )}
                <span className="relative">{n.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div
        className={`ml-auto flex items-center gap-0.5 md:ml-1 ${glass ? '[&_.ant-btn]:!text-white/85 [&_.ant-btn:hover]:!text-white' : ''}`}
      >
        {!minimal && <ThemeToggle />}
        {user && (
          <Dropdown
            placement="bottomRight"
            trigger={['click']}
            open={notificationsOpen}
            onOpenChange={setNotificationsOpen}
            popupRender={() => (
              <section
                role="dialog"
                aria-label="แจ้งเตือนล่าสุด"
                className="w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-surface text-text shadow-xl"
              >
                <div className="flex items-center justify-between gap-2 border-b border-border p-4">
                  <h2 className="font-semibold">แจ้งเตือน</h2>
                  <Link to="/notifications" onClick={() => setNotificationsOpen(false)}>
                    <Tag color="gold" className="!m-0 cursor-pointer">
                      ดูรายการทั้งหมด
                    </Tag>
                  </Link>
                </div>
                {latestNotifications.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ยังไม่มีแจ้งเตือน" />
                ) : (
                  <ul className="max-h-80 overflow-y-auto divide-y divide-border">
                    {latestNotifications.map((n) => (
                      <li key={n.id}>
                        <Link
                          to={n.link || '/notifications'}
                          onClick={() => setNotificationsOpen(false)}
                          className="flex gap-3 p-4 !text-text transition-colors hover:bg-card"
                        >
                          <Badge dot={!n.readAt} className="mt-1 shrink-0">
                            <Bell size={20} className="text-gold-text" />
                          </Badge>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{n.title}</p>
                            <p className="mt-1 break-words text-sm text-muted">{n.body}</p>
                            <p className="mt-1 text-xs text-muted">{timeAgo(n.createdAt)}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          >
            <Button
              type="text"
              shape="circle"
              aria-label={`แจ้งเตือน ${unread} รายการ`}
              aria-expanded={notificationsOpen}
              aria-haspopup="dialog"
              icon={
                <Badge count={unread} offset={[4, -4]}>
                  <Bell size={20} />
                </Badge>
              }
            />
          </Dropdown>
        )}
        {user ? (
          <Dropdown
            placement="bottomRight"
            trigger={['click']}
            open={profileOpen}
            onOpenChange={setProfileOpen}
            menu={{
              items: [
                {
                  key: 'profile',
                  icon: <User size={18} />,
                  label: <Link to="/profile">ดูโปรไฟล์</Link>,
                },
                {
                  key: 'logout',
                  icon: <SignOut size={18} />,
                  label: 'ออกจากระบบ',
                  danger: true,
                  disabled: signingOut,
                },
              ],
              onClick: ({ key }) => {
                setProfileOpen(false);
                if (key === 'logout') void logout();
              },
            }}
          >
            <Button
              type="text"
              shape="circle"
              aria-label="โปรไฟล์"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              loading={signingOut}
              icon={<User size={20} />}
            />
          </Dropdown>
        ) : minimal ? null : (
          <Link to="/login" className="ml-1">
            <Button type="primary" shape="round">
              เข้าสู่ระบบ
            </Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
}

/** Floating island ด้านล่าง (มือถือ) — ไอคอน + ป้ายชื่อ, ไฮไลต์เลื่อนตามหน้า */
export function BottomIsland({ items }: { items: NavItem[] }) {
  const reduce = useReducedMotion();
  return (
    <nav
      aria-label="เมนูล่าง"
      className="fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-3 md:hidden"
    >
      <div
        className={`flex w-full max-w-md items-center justify-between rounded-full border p-1.5 ${ISLAND.page}`}
      >
        {items
          .filter((n) => !n.desktopOnly)
          .map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `relative isolate flex flex-1 flex-col items-center gap-0.5 rounded-full py-1.5 text-[11px] ${isActive ? 'text-on-gold' : 'text-muted'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="bottom-island-active"
                      transition={reduce ? { duration: 0 } : spring}
                      className="absolute inset-0 -z-10 rounded-full bg-gold"
                    />
                  )}
                  {n.icon && <n.icon size={20} weight={isActive ? 'fill' : 'regular'} />}
                  {n.label}
                </>
              )}
            </NavLink>
          ))}
      </div>
    </nav>
  );
}
