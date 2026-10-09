import { CalendarBlank, MagnifyingGlass } from '@phosphor-icons/react';
import type { TeamBookingStatusBody } from '@nightout/contracts';
import type { BookingStatus } from '@nightout/types';
import { nextStatuses } from '@nightout/utils';
import { App, Calendar, Drawer, Empty, Segmented } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { barBookings, type Booking } from '@/services/data';
import { useMerchantBar } from '@/hooks/useMerchantBar';
import { BookingStatusTag } from '@/ui/components/bookingStatusTag';
import { Chip, Tile } from '@/ui/components/merchantUi';
import { BOOKING_STATUS } from '@/ui/utils/format';
import { setBookingStatus } from './api';
import { MiniCalendar } from './components/miniCalendar';

type TeamAction = TeamBookingStatusBody['to'];

/** ปุ่มท้ายแถว: [ปุ่มหลัก, ปุ่มรอง] ตามสถานะ · 'view' = ไปหน้ารายละเอียด · 'move' = ไปหน้ารายละเอียดแล้วเปิดย้ายโต๊ะ */
type RowAction = { label: string; to: TeamAction | 'view' | 'move'; primary?: boolean };
const ROW_ACTIONS: Partial<Record<BookingStatus, [RowAction, RowAction]>> = {
  PENDING: [{ label: 'รับจอง', to: 'CONFIRMED', primary: true }, { label: 'ปฏิเสธ', to: 'REJECTED' }],
  CONFIRMED: [{ label: 'เช็กอิน', to: 'CHECKED_IN', primary: true }, { label: 'ย้ายโต๊ะ', to: 'move' }],
  CHECKED_IN: [{ label: 'ดู', to: 'view' }, { label: 'ย้ายโต๊ะ', to: 'move' }],
  DEPOSIT_SUBMITTED: [{ label: 'ดู', to: 'view' }, { label: 'ย้ายโต๊ะ', to: 'move' }],
  AWAITING_DEPOSIT: [{ label: 'ดู', to: 'view' }, { label: 'ยกเลิก', to: 'CANCELLED_BY_MERCHANT' }],
};

/** สรุปของวัน (คอลัมน์ซ้าย) */
const DAY_SUMMARY: BookingStatus[] = ['CHECKED_IN', 'CONFIRMED', 'DEPOSIT_SUBMITTED', 'AWAITING_DEPOSIT', 'PENDING'];

/** ชิปกรองเหนือตาราง — "รอมัดจำ" รวมรอจ่ายและรอตรวจสลิป */
type Filter = 'ALL' | 'PENDING' | 'DEPOSIT' | 'CONFIRMED';
const FILTER_MATCH: Record<Exclude<Filter, 'ALL'>, BookingStatus[]> = {
  PENDING: ['PENDING'],
  DEPOSIT: ['AWAITING_DEPOSIT', 'DEPOSIT_SUBMITTED'],
  CONFIRMED: ['CONFIRMED'],
};

const hhmm = (iso: string) => dayjs(iso).format('HH:mm');
const dayKey = (d: Dayjs | string) => dayjs(d).format('YYYY-MM-DD');

/** /merchant/bookings — ปฏิทิน + สรุปวัน (ซ้าย) · ตาราง (ขวา) · มือถือเป็นแถบสัปดาห์ + การ์ด */
export function MerchantBookingsPage() {
  const bar = useMerchantBar();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [day, setDay] = useState<Dayjs>(() => dayjs());
  const [filter, setFilter] = useState<Filter>('ALL');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [mobileCalendar, setMobileCalendar] = useState(false);
  const actor = bar.staffRole === 'STAFF' ? 'STAFF' : 'MERCHANT';

  const all = barBookings(bar.id);
  const countByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of all) m.set(dayKey(b.datetime), (m.get(dayKey(b.datetime)) ?? 0) + 1);
    return m;
  }, [all]);

  const keyword = q.trim().toLowerCase();
  const ofDay = all
    .filter((b) => dayjs(b.datetime).isSame(day, 'day'))
    .filter((b) => !keyword || b.code.toLowerCase().includes(keyword) || b.userName.toLowerCase().includes(keyword))
    .sort((a, b) => a.datetime.localeCompare(b.datetime));
  const count = (f: Exclude<Filter, 'ALL'>) => ofDay.filter((b) => FILTER_MATCH[f].includes(b.status)).length;
  const rows = filter === 'ALL' ? ofDay : ofDay.filter((b) => FILTER_MATCH[filter].includes(b.status));

  const open = (b: Booking, move = false) => navigate(`/merchant/bookings/${b.id}${move ? '?move=1' : ''}`);
  const zoneTable = (b: Booking) =>
    [bar.zones.find((z) => z.id === b.zoneId)?.name, bar.zones.flatMap((z) => z.tables).find((t) => t.id === b.tableId)?.name]
      .filter(Boolean)
      .join(' · ');

  const run = async (b: Booking, a: RowAction) => {
    if (a.to === 'view') return open(b);
    if (a.to === 'move') return open(b, true);
    const to = a.to;
    setBusy(`${b.id}:${to}`);
    try {
      await setBookingStatus(b.id, to);
      message.success(`${a.label}แล้ว`);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  /** ตัดปุ่มเปลี่ยนสถานะที่บทบาทนี้ทำไม่ได้ (เช่น Staff ยกเลิกแทนร้านไม่ได้) */
  const actionsOf = (b: Booking) =>
    (ROW_ACTIONS[b.status] ?? []).filter(
      (a) => a.to === 'view' || a.to === 'move' || nextStatuses(b.status, actor).includes(a.to),
    );

  const actionButtons = (b: Booking) => {
    const acts = actionsOf(b);
    return [...acts].reverse().map((a) => (
      <button
        key={a.to}
        type="button"
        disabled={busy === `${b.id}:${a.to}`}
        onClick={(e) => {
          e.stopPropagation();
          void run(b, a);
        }}
        className={`merchant-pill inline-flex h-[30px] items-center rounded-[9px] px-2.5 text-[13px] ${
          a.primary ? 'bg-gold font-semibold text-on-gold' : 'border border-border text-text'
        } disabled:opacity-60`}
      >
        {a.label}
      </button>
    ));
  };

  const chips = (short: boolean) => (
    <div className="flex gap-1.5 overflow-x-auto">
      <Chip active={filter === 'ALL'} onClick={() => setFilter('ALL')}>
        ทั้งหมด {ofDay.length}
      </Chip>
      <Chip active={filter === 'PENDING'} onClick={() => setFilter('PENDING')}>
        {short ? 'รอยืนยัน' : 'รอร้านยืนยัน'} {count('PENDING')}
      </Chip>
      <Chip active={filter === 'DEPOSIT'} onClick={() => setFilter('DEPOSIT')}>
        รอมัดจำ {count('DEPOSIT')}
      </Chip>
      <Chip active={filter === 'CONFIRMED'} onClick={() => setFilter('CONFIRMED')}>
        ยืนยันแล้ว {count('CONFIRMED')}
      </Chip>
    </div>
  );

  const empty = <Empty className="!my-10" description={keyword ? 'ไม่พบการจองที่ค้นหา' : 'ไม่มีการจองในวันนี้'} />;
  const calendar = (
    <MiniCalendar
      value={day}
      onChange={(d) => {
        setDay(d);
        setMobileCalendar(false);
      }}
      hasBookings={(d) => countByDay.has(dayKey(d))}
    />
  );
  const week = Array.from({ length: 7 }, (_, i) => day.add(i - 2, 'day'));

  return (
    <>
      {/* ---------- Desktop ---------- */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="col-span-2 flex items-center justify-between gap-3">
          <h1 className="font-display text-[30px] font-bold">การจอง</h1>
          <div className="flex items-center gap-2">
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { label: 'รายการ', value: 'list' },
                { label: 'ปฏิทิน', value: 'calendar' },
              ]}
            />
            <label className="flex h-9 w-60 items-center gap-2 rounded-xl border border-border bg-card px-3 text-muted focus-within:border-gold">
              <MagnifyingGlass />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="รหัส / ชื่อลูกค้า"
                aria-label="ค้นหารหัสหรือชื่อลูกค้า"
                className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Tile className="!p-[18px]">{calendar}</Tile>
          <Tile className="flex flex-1 flex-col gap-2 !p-[18px]">
            <b className="text-sm font-semibold">{day.format('dddd D MMM')}</b>
            {DAY_SUMMARY.map((s) => (
              <span key={s} className="flex items-center justify-between border-t border-border/60 py-1.5 text-[13px]">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: BOOKING_STATUS[s].dot }} />
                  {BOOKING_STATUS[s].label}
                </span>
                <b className="font-semibold">{ofDay.filter((b) => b.status === s).length}</b>
              </span>
            ))}
          </Tile>
        </div>

        {view === 'calendar' ? (
          <Tile className="!p-3">
            <Calendar
              value={day}
              onSelect={(d, info) => {
                setDay(d);
                if (info.source === 'date') setView('list');
              }}
              cellRender={(d, info) => {
                if (info.type !== 'date') return info.originNode;
                const n = countByDay.get(dayKey(d));
                return n ? <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs text-gold-text">{n} การจอง</span> : null;
              }}
            />
          </Tile>
        ) : (
          <div className="flex min-w-0 flex-col overflow-hidden rounded-[20px] border border-border bg-card">
            <div className="border-b border-border px-[18px] py-3.5">{chips(false)}</div>
            {rows.length === 0 ? (
              empty
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="h-10 border-b border-border text-left text-xs text-muted">
                    <th className="w-16 pl-[18px] font-normal">เวลา</th>
                    <th className="w-[110px] font-normal">รหัส</th>
                    <th className="font-normal">ลูกค้า</th>
                    <th className="w-[50px] font-normal">คน</th>
                    <th className="font-normal">โซน · โต๊ะ</th>
                    <th className="font-normal">สถานะ</th>
                    <th className="pr-[18px]">
                      <span className="sr-only">จัดการ</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => open(b)}
                      className="h-[52px] cursor-pointer border-b border-border/60 last:border-b-0 hover:bg-surface/60"
                    >
                      <td className="pl-[18px] font-semibold tabular-nums">{hhmm(b.datetime)}</td>
                      <td className="font-mono text-xs text-muted">{b.code}</td>
                      <td>{b.userName}</td>
                      <td>{b.pax}</td>
                      <td className="text-muted">{zoneTable(b)}</td>
                      <td>
                        <BookingStatusTag status={b.status} />
                      </td>
                      <td className="pr-[18px]">
                        <span className="flex justify-end gap-1.5">{actionButtons(b)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ---------- มือถือ ---------- */}
      <div className="flex flex-col gap-2.5 lg:hidden">
        <div className="flex items-center gap-1">
          <h1 className="flex-1 text-[17px] font-bold">การจอง</h1>
          <button
            type="button"
            aria-label="ค้นหา"
            aria-pressed={mobileSearch}
            onClick={() => setMobileSearch((v) => !v)}
            className="grid size-10 place-items-center text-xl"
          >
            <MagnifyingGlass />
          </button>
          <button
            type="button"
            aria-label="เลือกวันจากปฏิทิน"
            onClick={() => setMobileCalendar(true)}
            className="grid size-10 place-items-center text-xl"
          >
            <CalendarBlank />
          </button>
        </div>
        {mobileSearch && (
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="รหัส / ชื่อลูกค้า"
            aria-label="ค้นหารหัสหรือชื่อลูกค้า"
            className="h-12 rounded-xl border border-border bg-card px-3.5 text-base text-text outline-none focus:border-gold"
          />
        )}
        <div className="-mx-4 grid grid-cols-7 gap-1 border-b border-border px-3 pb-3">
          {week.map((d) => {
            const sel = d.isSame(day, 'day');
            return (
              <button
                key={dayKey(d)}
                type="button"
                aria-pressed={sel}
                onClick={() => setDay(d)}
                className={`merchant-pill flex h-14 flex-col items-center justify-center gap-0.5 rounded-[14px] ${
                  sel ? 'bg-gold text-on-gold' : 'bg-card text-text'
                }`}
              >
                <span className="text-[11px]">{d.format('dd')}</span>
                <b className="text-base">{d.date()}</b>
              </button>
            );
          })}
        </div>
        {chips(true)}
        {rows.length === 0 ? (
          empty
        ) : (
          <ul className="m-0 grid list-none gap-2.5 p-0">
            {rows.map((b) => (
              <li key={b.id}>
                <div
                  role="link"
                  tabIndex={0}
                  onClick={() => open(b)}
                  onKeyDown={(e) => e.key === 'Enter' && open(b)}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-3"
                >
                  <b className="w-[46px] shrink-0 text-base tabular-nums">{hhmm(b.datetime)}</b>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
                    <span className="truncate">
                      {b.userName} · {b.pax} คน
                    </span>
                    <span className="truncate text-xs text-muted">{zoneTable(b).replace(' · ', ' ')}</span>
                  </span>
                  <BookingStatusTag status={b.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <Drawer
          placement="bottom"
          size="auto"
          open={mobileCalendar}
          onClose={() => setMobileCalendar(false)}
          title="เลือกวัน"
        >
          {calendar}
        </Drawer>
      </div>
    </>
  );
}
