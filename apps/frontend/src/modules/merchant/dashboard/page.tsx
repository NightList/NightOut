import { ArrowRight, ArrowUpRight, ForkKnife, QrCode, Star, Table as TableIcon, Tag, UsersThree } from '@phosphor-icons/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { barBookings, barReviews } from '@/services/data';
import { useMerchantBar } from '@/hooks/useMerchantBar';
import { BarRating } from '@/ui/components/barRating';
import { BookingStatusTag } from '@/ui/components/bookingStatusTag';
import { Meter, Ring, Tile, TileLabel } from '@/ui/components/merchantUi';
import { barImage } from '@/ui/utils/barImage';
import { baht } from '@/ui/utils/format';

const DAY = 24 * 60 * 60 * 1000;
const CLOSED = ['CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_MERCHANT', 'REJECTED', 'EXPIRED'];
const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
const hhmm = (iso: string) =>
  new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });

const QUICK = [
  { to: '/merchant/menu', icon: <ForkKnife />, label: 'แก้เมนู' },
  { to: '/merchant/tables', icon: <TableIcon />, label: 'โซน / โต๊ะ' },
  { to: '/merchant/promotions', icon: <Tag />, label: 'โปรโมชัน' },
  { to: '/merchant/staff', icon: <UsersThree />, label: 'พนักงาน' },
];

/** อัตรามาตามนัดของการจองที่ปิดงานแล้วในช่วงเวลา [from, to) — null = ไม่มีข้อมูล */
function showRateBetween(rows: { datetime: string; status: string }[], from: number, to: number) {
  const done = rows.filter((b) => {
    const t = new Date(b.datetime).getTime();
    return t >= from && t < to && ['CHECKED_IN', 'COMPLETED', 'NO_SHOW'].includes(b.status);
  });
  if (!done.length) return null;
  const noShow = done.filter((b) => b.status === 'NO_SHOW').length;
  return { rate: Math.round(((done.length - noShow) / done.length) * 100), noShow };
}

/** /merchant — ภาพรวมร้านแบบ Bento (4 คอลัมน์ · มือถือ 2 คอลัมน์) */
export function MerchantDashboardPage() {
  const bar = useMerchantBar();
  const [now] = useState(() => Date.now());
  const isStaff = bar.staffRole === 'STAFF';
  const all = barBookings(bar.id);
  const today = all.filter((b) => isToday(b.datetime)).sort((a, b) => a.datetime.localeCompare(b.datetime));
  const live = today.filter((b) => !CLOSED.includes(b.status));
  const totalPax = live.reduce((a, b) => a + b.pax, 0);
  const inPax = live.filter((b) => ['CHECKED_IN', 'COMPLETED'].includes(b.status)).reduce((a, b) => a + b.pax, 0);
  const checkInPct = totalPax ? (inPax / totalPax) * 100 : 0;

  const cur = showRateBetween(all, now - 30 * DAY, now);
  const prev = showRateBetween(all, now - 60 * DAY, now - 30 * DAY);
  const delta = cur && prev ? cur.rate - prev.rate : null;

  const heldToday = live.reduce(
    (a, b) => a + (b.deposit?.status === 'VERIFIED' && b.deposit.settlement === 'HELD' ? b.deposit.amount : 0),
    0,
  );
  const review = barReviews(bar.id).find((r) => r.status !== 'HIDDEN' && r.status !== 'REMOVED');

  const hero = (
    <div
      className="flex min-h-[140px] min-w-0 flex-col justify-end rounded-[20px] border border-border bg-cover bg-center p-4 text-white lg:col-span-2 lg:min-h-[200px] lg:p-6"
      style={{
        backgroundImage: `linear-gradient(to top, rgba(7,7,13,.92), rgba(7,7,13,.2)), url(${barImage(bar)})`,
      }}
    >
      <p className="hidden text-[13px] text-white/80 lg:block">
        {isStaff ? 'พนักงาน' : bar.staffRole === 'MANAGER' ? 'ผู้จัดการร้าน' : 'ร้านของฉัน'}
      </p>
      <h1 className="break-words font-display text-2xl font-bold lg:text-[32px] lg:leading-tight">{bar.name}</h1>
      <p className="mt-1 text-[13px] lg:text-sm [&_.text-muted]:!text-white/75">
        <BarRating bar={bar} /> · {bar.district}
      </p>
    </div>
  );

  const rows = (limit: number) =>
    today.length === 0 ? (
      <p className="py-8 text-center text-sm text-muted">ยังไม่มีการจองวันนี้</p>
    ) : (
      <ul className="m-0 list-none p-0">
        {today.slice(0, limit).map((b) => (
          <li key={b.id} className="border-b border-border/60 last:border-b-0">
            <Link
              to={`/merchant/bookings/${b.id}`}
              className="flex min-h-11 items-center gap-3 py-2 text-sm text-inherit"
            >
              <b className="w-12 shrink-0 font-semibold tabular-nums">{hhmm(b.datetime)}</b>
              <span className="min-w-0 flex-1 truncate">
                {b.userName}{' '}
                <span className="text-muted">
                  · {b.pax} คน<span className="hidden sm:inline"> · {bar.zones.find((z) => z.id === b.zoneId)?.name}</span>
                </span>
              </span>
              <BookingStatusTag status={b.status} />
            </Link>
          </li>
        ))}
      </ul>
    );

  return (
    <>
      {/* ---------- Desktop ---------- */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-4 lg:grid-rows-[repeat(3,minmax(190px,auto))]">
        {hero}

        <Tile className="flex flex-col justify-between gap-3">
          <TileLabel end={<Link to="/merchant/tonight" aria-label="ไปหน้าคืนนี้"><ArrowUpRight /></Link>}>คืนนี้</TileLabel>
          <div className="flex items-center gap-3.5">
            <Ring pct={checkInPct} />
            <span className="flex flex-col text-[13px] text-muted">
              <b className="text-[22px] text-text">
                {inPax}/{totalPax}
              </b>
              คนเช็กอินแล้ว
            </span>
          </div>
          <Link
            to="/merchant/tonight"
            className="flex h-[38px] items-center justify-center gap-2 rounded-xl bg-gold text-sm font-semibold !text-on-gold"
          >
            <QrCode />
            เปิด Scanner
          </Link>
        </Tile>

        <Tile className="flex flex-col gap-1.5">
          <TileLabel end={<Link to="/merchant/analytics" aria-label="ไปหน้าสถิติ"><ArrowUpRight /></Link>}>อัตรามาตามนัด</TileLabel>
          <span className="text-4xl font-semibold leading-tight">
            {cur ? cur.rate : '–'}
            <span className="text-base text-muted">%</span>
          </span>
          {delta !== null && (
            <span className={`text-xs ${delta >= 0 ? 'text-(--crowd-available)' : 'text-(--crowd-full)'}`}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}% ใน 30 วัน
            </span>
          )}
          <span className="mt-auto flex justify-between border-t border-border/60 pt-2 text-[13px]">
            <span className="text-muted">ไม่มาตามนัด</span>
            <span>{cur?.noShow ?? 0} โต๊ะ</span>
          </span>
        </Tile>

        <Tile className="col-span-2 row-span-2 flex flex-col gap-1 overflow-hidden">
          <span className="mb-1 flex items-center justify-between text-sm">
            <b className="font-semibold">การจองวันนี้ · {today.length}</b>
            <Link to="/merchant/bookings" className="inline-flex items-center gap-1">
              ทั้งหมด <ArrowRight size={14} />
            </Link>
          </span>
          {rows(9)}
        </Tile>

        {!isStaff && (
          <Tile className="flex flex-col gap-1.5">
            <TileLabel end={<Link to="/merchant/deposits" aria-label="ไปหน้าเงินมัดจำ"><ArrowUpRight /></Link>}>มัดจำวันนี้</TileLabel>
            <span className="text-[30px] font-semibold text-gold-text">{baht(heldToday)}</span>
            <span className="text-[13px] text-muted">NightOut ถือไว้ · โอนเข้าร้านหลังลูกค้าเช็กอิน</span>
          </Tile>
        )}

        <Tile className="flex flex-col gap-1.5">
          <TileLabel end={!isStaff && <Link to="/merchant/reviews" aria-label="ไปหน้ารีวิว"><ArrowUpRight /></Link>}>รีวิวใหม่</TileLabel>
          {review ? (
            <>
              <span className="flex text-[13px] text-gold" aria-label={`${review.rating} ดาว`}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} weight={i <= review.rating ? 'fill' : 'regular'} />
                ))}
              </span>
              <p className="line-clamp-3 text-sm leading-normal">“{review.comment}”</p>
              <span className="mt-auto text-xs text-muted">
                {review.userName}
                {!isStaff && (
                  <>
                    {' · '}
                    <Link to="/merchant/reviews">ดูรีวิว</Link>
                  </>
                )}
              </span>
            </>
          ) : (
            <p className="text-sm text-muted">ยังไม่มีรีวิว</p>
          )}
        </Tile>

        {!isStaff && (
          <Tile tone="surface" className="col-span-2 grid grid-cols-4 gap-2.5 !p-3.5">
            {QUICK.map((q) => (
              <Link
                key={q.to}
                to={q.to}
                className="merchant-pill flex flex-col items-center justify-center gap-1.5 rounded-[14px] border border-border bg-card text-[13px] text-inherit hover:border-gold"
              >
                <span className="text-[22px] text-gold">{q.icon}</span>
                {q.label}
              </Link>
            ))}
          </Tile>
        )}
      </div>

      {/* ---------- มือถือ ---------- */}
      <div className="grid grid-cols-2 gap-2.5 lg:hidden">
        <div className="col-span-2">{hero}</div>
        <Tile className="flex flex-col gap-1.5 !rounded-[18px] !p-3.5">
          <span className="text-xs text-muted">เช็กอินคืนนี้</span>
          <b className="text-[22px]">
            {inPax}/{totalPax}
          </b>
          <Meter pct={checkInPct} />
        </Tile>
        <Tile className="flex flex-col gap-1.5 !rounded-[18px] !p-3.5">
          <span className="text-xs text-muted">มาตามนัด</span>
          <b className="text-[22px]">{cur ? `${cur.rate}%` : '–'}</b>
          {delta !== null && (
            <span className={`text-[11px] ${delta >= 0 ? 'text-(--crowd-available)' : 'text-(--crowd-full)'}`}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}% ใน 30 วัน
            </span>
          )}
        </Tile>
        <Tile className="col-span-2 flex flex-col !rounded-[18px] !p-3.5">
          <span className="mb-1 flex justify-between text-sm">
            <b className="font-semibold">การจองวันนี้</b>
            <Link to="/merchant/bookings" className="text-[13px]">
              ทั้งหมด →
            </Link>
          </span>
          {rows(4)}
        </Tile>
        {!isStaff &&
          QUICK.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="merchant-pill flex h-14 items-center gap-2.5 rounded-2xl border border-border bg-surface px-3.5 text-sm text-inherit"
            >
              <span className="text-xl text-gold">{q.icon}</span>
              {q.label}
            </Link>
          ))}
      </div>
    </>
  );
}
