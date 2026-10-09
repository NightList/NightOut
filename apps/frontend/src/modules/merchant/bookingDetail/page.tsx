import { ArrowLeft, ArrowUUpLeft, ArrowsLeftRight, Check, CheckCircle, Clock, Wallet, XCircle } from '@phosphor-icons/react';
import type { TeamBookingStatusBody } from '@nightout/contracts';
import type { BookingStatus } from '@nightout/types';
import { nextStatuses } from '@nightout/utils';
import { App, Button, Result } from 'antd';
import dayjs from 'dayjs';
import { useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { barBookings } from '@/services/data';
import { useMerchantBar } from '@/hooks/useMerchantBar';
import { BookingStatusTag } from '@/ui/components/bookingStatusTag';
import { SETTLEMENT_LABEL } from '@/ui/components/depositCard';
import { Tile } from '@/ui/components/merchantUi';
import { BOOKING_STATUS, baht } from '@/ui/utils/format';
import { setBookingStatus, useTableOptions } from './api';
import { MoveTableModal } from './modal/moveTableModal';
import { canRefund, RefundModal } from './modal/refundModal';

/** สถานะที่ยังถือโต๊ะอยู่ → ย้ายโต๊ะได้ */
const MOVABLE: BookingStatus[] = ['PENDING', 'AWAITING_DEPOSIT', 'DEPOSIT_SUBMITTED', 'CONFIRMED', 'CHECKED_IN'];

type TeamAction = TeamBookingStatusBody['to'];
const isTeamAction = (s: BookingStatus): s is TeamAction =>
  s === 'CONFIRMED' || s === 'REJECTED' || s === 'CHECKED_IN' || s === 'COMPLETED' || s === 'CANCELLED_BY_MERCHANT';

/** ปุ่มเปลี่ยนสถานะ — primary = ปุ่มทองท้ายสุด · danger = ขอบแดง */
const ACTION: Partial<Record<TeamAction, { label: string; primary?: boolean; danger?: boolean }>> = {
  REJECTED: { label: 'ปฏิเสธ', danger: true },
  CANCELLED_BY_MERCHANT: { label: 'ยกเลิกการจอง', danger: true },
  COMPLETED: { label: 'ปิดโต๊ะ' },
  CONFIRMED: { label: 'รับจอง', primary: true },
  CHECKED_IN: { label: 'เช็กอิน', primary: true },
};
const ORDER: TeamAction[] = ['REJECTED', 'CANCELLED_BY_MERCHANT', 'COMPLETED', 'CONFIRMED', 'CHECKED_IN'];

const DAY_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
/** [5, 6] → "ศ–ส" · [1, 3] → "จ, พ" · ว่าง = ทุกวัน */
function daysLabel(days?: number[]) {
  if (!days?.length || days.length === 7) return 'ทุกวัน';
  const s = [...days].sort((a, b) => a - b);
  const run = s.every((d, i) => i === 0 || d === s[i - 1]! + 1);
  return run && s.length > 2 ? `${DAY_SHORT[s[0]!]}–${DAY_SHORT[s.at(-1)!]}` : s.map((d) => DAY_SHORT[d]).join(', ');
}

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`flex flex-col gap-0.5 ${wide ? 'col-span-2' : ''}`}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="m-0 text-sm">{children}</dd>
    </div>
  );
}

/** รายละเอียดการจอง (ร้าน) — Bento: ข้อมูล · มัดจำ · โปร · ประวัติ · จัดการหน้างาน */
export function MerchantBookingDetailPage() {
  const bar = useMerchantBar();
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { message } = App.useApp();
  const [busy, setBusy] = useState<TeamAction | null>(null);
  const [moving, setMoving] = useState(() => params.get('move') === '1');
  const [refunding, setRefunding] = useState(false);

  const all = barBookings(bar.id);
  const booking = all.find((b) => b.id === id);
  const canMove = !!booking && MOVABLE.includes(booking.status);
  const { data: tableOptions } = useTableOptions(bar.id, canMove ? booking.id : null);

  if (!booking)
    return (
      <Result
        status="404"
        title="ไม่พบการจองนี้"
        subTitle="รหัสการจองไม่ถูกต้อง หรือไม่ใช่ของร้านนี้"
        extra={
          <Link to="/merchant/bookings">
            <Button type="primary">กลับไปรายการจอง</Button>
          </Link>
        }
      />
    );

  const actor = bar.staffRole === 'STAFF' ? 'STAFF' : 'MERCHANT';
  const zone = bar.zones.find((z) => z.id === booking.zoneId);
  const table = bar.zones.flatMap((z) => z.tables).find((t) => t.id === booking.tableId);
  const place = [zone?.name, table?.name].filter(Boolean).join(' ');
  const start = dayjs(booking.datetime);
  const end = start.add(zone?.defaultDurationMinutes ?? 0, 'minute');
  const hours = (zone?.defaultDurationMinutes ?? 0) / 60;

  // ประวัติลูกค้าคนนี้กับร้านนี้ (นับเฉพาะที่ปิดงานแล้ว)
  const mine = all.filter((b) => b.userId === booking.userId);
  const visits = mine.filter((b) => ['CHECKED_IN', 'COMPLETED'].includes(b.status)).length;
  const noShows = mine.filter((b) => b.status === 'NO_SHOW').length;
  const visitLabel = `${visits ? `ครั้งที่ ${visits + (['CHECKED_IN', 'COMPLETED'].includes(booking.status) ? 0 : 1)}` : 'ครั้งแรก'}${
    noShows ? ` · ไม่มา ${noShows} ครั้ง` : visits ? ' · ไม่เคยไม่มา' : ''
  }`;

  const promo = booking.promotionId ? bar.promotions.find((p) => p.id === booking.promotionId) : undefined;
  const promoTitle = promo?.title ?? booking.promotionTitle;
  const promoCond = promo && [promo.cutoffTime ? `ก่อน ${promo.cutoffTime}` : 'ทั้งคืน', daysLabel(promo.days)].join(' · ');
  const estimate = bar.avgPerPerson * booking.pax;

  const d = booking.deposit;
  const depositAmount = d?.amount ?? booking.depositRequired ?? 0;
  const slip =
    d?.status === 'VERIFIED'
      ? { icon: <CheckCircle weight="fill" />, text: 'NightOut ตรวจสลิปแล้ว', short: 'ตรวจสลิปแล้ว', cls: 'text-(--crowd-available)' }
      : d?.status === 'SUBMITTED'
        ? { icon: <Clock />, text: 'รอ NightOut ตรวจสลิป', short: 'รอตรวจสลิป', cls: 'text-link' }
        : d?.status === 'REJECTED'
          ? { icon: <XCircle weight="fill" />, text: 'สลิปไม่ผ่าน', short: 'สลิปไม่ผ่าน', cls: 'text-(--crowd-full)' }
          : { icon: <Clock />, text: 'ลูกค้ายังไม่ได้โอน', short: 'ยังไม่โอน', cls: 'text-muted' };
  const settlementText = d?.settlement
    ? d.settlement === 'HELD'
      ? 'NightOut ถือไว้ · โอนเข้าร้านหลังเช็กอิน'
      : SETTLEMENT_LABEL[d.settlement].label
    : 'เงินเข้า NightOut ก่อน แล้วค่อยโอนให้ร้าน';

  const allowed = nextStatuses(booking.status, actor).filter(isTeamAction);
  const actions = ORDER.filter((s) => allowed.includes(s) && ACTION[s]);
  const primary = actions.find((s) => ACTION[s]!.primary);
  const refundable = canRefund(booking);
  const freeTables = tableOptions?.filter((o) => o.available && !o.is_current && o.table_id).length;

  const act = async (to: TeamAction) => {
    setBusy(to);
    try {
      await setBookingStatus(booking.id, to);
      message.success(`${ACTION[to]!.label}แล้ว`);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const closeMove = () => {
    setMoving(false);
    if (params.has('move')) setParams({}, { replace: true });
  };

  const actionButton = (s: TeamAction, cls = 'h-10 px-4') => {
    const a = ACTION[s]!;
    return (
      <button
        key={s}
        type="button"
        disabled={busy !== null}
        onClick={() => void act(s)}
        className={`merchant-pill inline-flex items-center justify-center gap-2 rounded-xl text-sm disabled:opacity-60 ${cls} ${
          a.primary
            ? 'bg-gold font-semibold text-on-gold'
            : a.danger
              ? 'border border-[color-mix(in_srgb,var(--crowd-full)_45%,transparent)] text-(--crowd-full)'
              : 'border border-border'
        }`}
      >
        {s === 'CHECKED_IN' && <Check />}
        {busy === s ? 'กำลังบันทึก…' : a.label}
      </button>
    );
  };

  const history = [...booking.history].reverse().map((h, i) => (
    <li key={i} className="flex items-center gap-3 text-sm">
      <span className="size-2.5 shrink-0 rounded-full" style={{ background: BOOKING_STATUS[h.to].dot }} />
      <span className="min-w-0 flex-1">
        {BOOKING_STATUS[h.to].label} · {h.by}
      </span>
      <span className="shrink-0 text-xs text-muted">{dayjs(h.at).format('D MMM HH:mm')}</span>
    </li>
  ));

  const onsiteTile = (
    icon: ReactNode,
    title: string,
    sub: string,
    enabled: boolean,
    onClick: () => void,
  ) => (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      className="merchant-pill flex flex-col items-start gap-1.5 rounded-2xl border border-border bg-card p-4 text-left hover:border-gold disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border"
    >
      <span className="text-[22px]">{icon}</span>
      <b className="text-sm font-semibold">{title}</b>
      <span className="text-xs text-muted">{sub}</span>
    </button>
  );

  return (
    <>
      {/* ---------- Desktop ---------- */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-4 lg:grid-rows-[auto_minmax(200px,auto)_minmax(200px,auto)]">
        <div className="col-span-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <Link to="/merchant/bookings" className="inline-flex items-center gap-1 text-[13px]">
              <ArrowLeft size={14} /> การจอง
            </Link>
            <h1 className="mt-1 font-display text-[30px] font-bold">
              {booking.userName} · {booking.pax} คน
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">
              <BookingStatusTag status={booking.status} />
              {booking.code} · {start.format('dddd D MMM HH:mm')} · {place}
            </p>
          </div>
          {actions.length > 0 && <div className="flex shrink-0 gap-2">{actions.map((s) => actionButton(s))}</div>}
        </div>

        <Tile className="col-span-2 !p-[22px]">
          <dl className="m-0 grid grid-cols-2 content-start gap-x-6 gap-y-3.5">
            <span className="col-span-2 text-sm font-semibold">ข้อมูลการจอง</span>
            <Field label="ลูกค้า">{booking.userName}</Field>
            <Field label="มาร้านนี้">{visitLabel}</Field>
            <Field label="เวลา">
              {start.format('HH:mm')}
              {hours > 0 && ` – ${end.format('HH:mm')} (${hours.toLocaleString('th-TH')} ชม.)`}
            </Field>
            <Field label="โซน / โต๊ะ">{place || 'ไม่ระบุโต๊ะ'}</Field>
            {booking.note && (
              <Field label="หมายเหตุ" wide>
                {booking.note}
              </Field>
            )}
            {booking.cancelReason && (
              <Field label="เหตุผลที่ยกเลิก / ปฏิเสธ" wide>
                {booking.cancelReason}
              </Field>
            )}
          </dl>
        </Tile>

        <Tile className="flex flex-col gap-2.5 !p-[22px]">
          <span className="flex justify-between text-sm font-semibold">
            เงินมัดจำ <Wallet className="text-gold" />
          </span>
          <span className="text-[30px] font-semibold text-gold-text">{baht(depositAmount)}</span>
          <span className={`flex items-center gap-1.5 text-[13px] ${slip.cls}`}>
            {slip.icon}
            {slip.text}
          </span>
          <span className="mt-auto text-xs text-muted">{settlementText}</span>
        </Tile>

        <Tile className="flex flex-col gap-2.5 !p-[22px]">
          <span className="text-sm font-semibold">โปรที่ลูกค้าเลือก</span>
          {promoTitle ? (
            <span className="flex flex-col gap-0.5 rounded-[14px] border border-gold/35 bg-gold/10 p-3">
              <b className="text-sm font-semibold text-gold">{promoTitle}</b>
              {promoCond && <span className="text-xs text-muted">{promoCond}</span>}
            </span>
          ) : (
            <span className="text-sm text-muted">ไม่ได้เลือกโปร</span>
          )}
          {estimate > 0 && (
            <span className="mt-auto flex justify-between text-[13px]">
              <span className="text-muted">ยอดประเมิน</span>
              {baht(estimate)} · {baht(bar.avgPerPerson)}/คน
            </span>
          )}
        </Tile>

        <Tile className="col-span-2 flex flex-col gap-3 !p-[22px]">
          <span className="text-sm font-semibold">ประวัติสถานะ</span>
          <ul className="m-0 grid list-none gap-3 p-0">{history}</ul>
        </Tile>

        <Tile tone="surface" className="col-span-2 flex flex-col gap-3 !p-[22px]">
          <span className="text-sm font-semibold">
            จัดการหน้างาน <span className="text-xs font-normal text-muted">· ทุกคนในทีมรวม PR</span>
          </span>
          <div className="grid flex-1 grid-cols-2 gap-3">
            {onsiteTile(
              <ArrowsLeftRight className="text-gold" />,
              'ย้ายโต๊ะ',
              canMove
                ? freeTables === undefined
                  ? 'เลือกจากโต๊ะที่ว่างตอนนี้'
                  : `เลือกจากโต๊ะที่ว่างตอนนี้ ${freeTables} โต๊ะ`
                : 'ย้ายได้เฉพาะการจองที่ยังถือโต๊ะอยู่',
              canMove,
              () => setMoving(true),
            )}
            {onsiteTile(
              <ArrowUUpLeft className="text-link" />,
              'ยืนยันการคืนเงิน',
              refundable ? 'มัดจำเข้าคิวให้ NightOut โอนคืน' : 'คืนได้เมื่อ NightOut ตรวจสลิปแล้วและยังถือเงินอยู่',
              refundable,
              () => setRefunding(true),
            )}
          </div>
        </Tile>
      </div>

      {/* ---------- มือถือ ---------- */}
      <div className="flex flex-col gap-3 lg:hidden">
        <Link to="/merchant/bookings" className="inline-flex min-h-10 items-center gap-1.5 self-start text-sm text-text">
          <ArrowLeft size={18} />
          <b className="font-mono">{booking.code}</b>
        </Link>
        <div>
          <h1 className="text-[22px] font-semibold">
            {booking.userName} · {booking.pax} คน
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-muted">
            <BookingStatusTag status={booking.status} />
            {start.format('D MMM HH:mm')} · {place}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Tile className="flex flex-col gap-1 !rounded-2xl !p-3.5">
            <span className="text-xs text-muted">มัดจำ</span>
            <b className="text-xl text-gold-text">{baht(depositAmount)}</b>
            <span className={`text-[11px] ${slip.cls}`}>{slip.short}</span>
          </Tile>
          <Tile className="flex flex-col gap-1 !rounded-2xl !p-3.5">
            <span className="text-xs text-muted">โปร</span>
            <b className="text-sm text-gold">{promoTitle ?? 'ไม่ได้เลือก'}</b>
            {promo?.cutoffTime && <span className="text-[11px] text-muted">ก่อน {promo.cutoffTime}</span>}
          </Tile>
        </div>
        <Tile className="!rounded-2xl !p-3.5">
          <dl className="m-0 flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">มาร้านนี้</dt>
              <dd className="m-0 text-right">{visitLabel}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">เวลา</dt>
              <dd className="m-0 text-right">
                {start.format('HH:mm')}
                {hours > 0 && ` – ${end.format('HH:mm')}`}
              </dd>
            </div>
            {booking.note && (
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 text-muted">หมายเหตุ</dt>
                <dd className="m-0 text-right">{booking.note}</dd>
              </div>
            )}
          </dl>
        </Tile>
        <Tile className="flex flex-col gap-2.5 !rounded-2xl !p-3.5">
          <b className="text-sm font-semibold">ประวัติสถานะ</b>
          <ul className="m-0 grid list-none gap-2.5 p-0 [&_li]:text-[13px]">{history}</ul>
        </Tile>
        {actions.filter((s) => !ACTION[s]!.primary).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.filter((s) => !ACTION[s]!.primary).map((s) => actionButton(s, 'h-11 flex-1 px-4'))}
          </div>
        )}
      </div>

      {/* มือถือ — แถบปุ่มล่าง: ย้ายโต๊ะ · คืนเงิน · ปุ่มหลัก */}
      <div className="merchant-actionbar fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1fr_1fr_1.4fr] gap-2 border-t border-border bg-surface px-4 pt-3 lg:hidden">
        <button
          type="button"
          disabled={!canMove}
          onClick={() => setMoving(true)}
          className="merchant-pill h-12 rounded-xl border border-border text-sm disabled:opacity-40"
        >
          ย้ายโต๊ะ
        </button>
        <button
          type="button"
          disabled={!refundable}
          onClick={() => setRefunding(true)}
          className="merchant-pill h-12 rounded-xl border border-border text-sm disabled:opacity-40"
        >
          คืนเงิน
        </button>
        {primary ? (
          actionButton(primary, 'h-12')
        ) : (
          <span className="grid h-12 place-items-center rounded-xl border border-border text-sm text-muted">
            {BOOKING_STATUS[booking.status].label}
          </span>
        )}
      </div>

      <MoveTableModal barId={bar.id} booking={moving ? booking : null} onClose={closeMove} />
      <RefundModal booking={refunding ? booking : null} onClose={() => setRefunding(false)} />
    </>
  );
}
