import { CheckCircle, Clock, Coins, DownloadSimple, LockSimple } from '@phosphor-icons/react';
import { Alert, Empty, Skeleton } from 'antd';
import dayjs from 'dayjs';
import { useState, type ReactNode } from 'react';
import { barBookings } from '@/services/data';
import { useMerchantBar } from '@/hooks/useMerchantBar';
import { BookingStatusTag } from '@/ui/components/bookingStatusTag';
import { Chip, Tile } from '@/ui/components/merchantUi';
import { BOOKING_STATUS, baht } from '@/ui/utils/format';
import { useBarLedger, type DepositLedgerRow } from './api';

type Settlement = DepositLedgerRow['settlement'];

/** ข้อความ + สีของสถานะเงิน (คอลัมน์ขวาสุด) */
const MONEY: Record<Settlement, { label: string; cls: string }> = {
  NONE: { label: 'รอ NightOut ตรวจสลิป', cls: 'text-muted' },
  HELD: { label: 'NightOut ถือไว้', cls: 'text-gold-text' },
  PAYOUT_PENDING: { label: 'รอโอนเข้าร้าน', cls: 'text-text' },
  PAID_OUT: { label: 'โอนแล้ว', cls: 'text-(--crowd-available)' },
  CREDIT: { label: 'เป็นเครดิตร้าน', cls: 'text-link' },
  REFUND_PENDING: { label: 'รอคืนลูกค้า', cls: 'text-muted' },
  REFUNDED: { label: 'คืนลูกค้า', cls: 'text-muted' },
};

type Filter = 'ALL' | 'HELD' | 'PAYOUT_PENDING' | 'PAID_OUT' | 'REFUND';
const FILTERS: { key: Filter; label: string; match: Settlement[] }[] = [
  { key: 'ALL', label: 'ทั้งหมด', match: [] },
  { key: 'HELD', label: 'NightOut ถือไว้', match: ['HELD'] },
  { key: 'PAYOUT_PENDING', label: 'รอโอน', match: ['PAYOUT_PENDING'] },
  { key: 'PAID_OUT', label: 'โอนแล้ว', match: ['PAID_OUT'] },
  { key: 'REFUND', label: 'คืนลูกค้า', match: ['REFUND_PENDING', 'REFUNDED'] },
];

const moneyLabel = (r: DepositLedgerRow) =>
  r.settlement === 'PAID_OUT' && r.settled_at
    ? `โอนแล้ว ${dayjs(r.settled_at).format('D MMM')}`
    : MONEY[r.settlement]?.label ?? r.settlement;

/** ดาวน์โหลดแถวที่กรองอยู่เป็น CSV (มี BOM ให้ Excel อ่านภาษาไทยได้) */
function downloadCsv(rows: DepositLedgerRow[], statusOf: (r: DepositLedgerRow) => string, name: string) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    ['วันที่จอง', 'รหัส', 'ลูกค้า', 'สถานะการจอง', 'ยอด', 'สถานะเงิน'],
    ...rows.map((r) => [
      dayjs(r.booking_datetime).format('YYYY-MM-DD HH:mm'),
      r.booking_code,
      r.customer_name ?? '',
      statusOf(r),
      Number(r.amount),
      moneyLabel(r),
    ]),
  ].map((l) => l.map(esc).join(','));
  const url = URL.createObjectURL(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function StatTile({
  icon,
  title,
  value,
  sub,
  valueCls,
  highlight,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  sub: string;
  valueCls: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-1.5 rounded-[20px] border p-5 ${
        highlight
          ? 'border-gold/35 bg-[linear-gradient(160deg,color-mix(in_srgb,var(--gold)_14%,var(--card)),var(--card))]'
          : 'border-border bg-card'
      }`}
    >
      <span className="flex items-center gap-2 text-sm text-muted">
        <span className={valueCls}>{icon}</span>
        {title}
      </span>
      <span className={`text-[30px] font-semibold ${valueCls}`}>{value}</span>
      <span className="text-xs text-muted">{sub}</span>
    </div>
  );
}

/**
 * /merchant/deposits — เงินมัดจำของร้าน (ไม่เห็นสลิปของลูกค้า)
 * ลูกค้าโอนเข้า NightOut · แพลตฟอร์มตรวจสลิปและถือเงินไว้ · ลูกค้าเช็กอิน/ไม่มา → เงินเป็นของร้าน
 * แล้ว NightOut โอนเข้าบัญชีร้าน หรือเก็บเป็นเครดิตร้านตามที่ตกลง
 */
export function MerchantDepositsPage() {
  const bar = useMerchantBar();
  const { data = [], isLoading, error } = useBarLedger(bar.id);
  const [filter, setFilter] = useState<Filter>('ALL');

  const statusById = new Map(barBookings(bar.id).map((b) => [b.id, b.status]));
  const ledger = data
    .filter((r) => r.status !== 'REJECTED')
    .sort((a, b) => b.booking_datetime.localeCompare(a.booking_datetime));
  const match = FILTERS.find((f) => f.key === filter)!.match;
  const rows = filter === 'ALL' ? ledger : ledger.filter((r) => match.includes(r.settlement));
  const of = (k: Settlement) => ledger.filter((r) => r.settlement === k);
  const sum = (list: DepositLedgerRow[]) => list.reduce((a, r) => a + Number(r.amount), 0);
  const thisMonth = dayjs().startOf('month');
  const paidMonth = of('PAID_OUT').filter((r) => r.settled_at && dayjs(r.settled_at).isAfter(thisMonth));
  const statusLabel = (r: DepositLedgerRow) => {
    const s = statusById.get(r.booking_id);
    return s ? BOOKING_STATUS[s].label : '';
  };
  const account = bar.payout.accountNo
    ? `เข้าบัญชี ${bar.payout.bankName} ${bar.payout.accountNo}`
    : 'ยังไม่ได้ตั้งบัญชีรับเงิน — ตั้งได้ที่ตั้งค่าการจอง';

  const stats = {
    held: { icon: <LockSimple />, title: 'NightOut ถือไว้', value: baht(sum(of('HELD'))), sub: `${of('HELD').length} การจอง · รอเช็กอิน`, valueCls: 'text-gold-text', highlight: true },
    pending: { icon: <Clock />, title: 'รอโอนเข้าร้าน', value: baht(sum(of('PAYOUT_PENDING'))), sub: 'NightOut โอนเข้าบัญชีร้านรอบถัดไป', valueCls: 'text-text' },
    paid: { icon: <CheckCircle />, title: `โอนแล้ว (${thisMonth.format('MMM')})`, value: baht(sum(paidMonth)), sub: account, valueCls: 'text-(--crowd-available)' },
    credit: { icon: <Coins />, title: 'เครดิต', value: baht(sum(of('CREDIT'))), sub: 'เก็บเป็นเครดิตร้าน', valueCls: 'text-link' },
  };

  const chips = (
    <div className="flex gap-1.5 overflow-x-auto">
      {FILTERS.map((f) => (
        <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
          {f.label}
        </Chip>
      ))}
    </div>
  );
  const errorAlert = error && (
    <Alert className="!mb-4" type="error" showIcon title="โหลดมัดจำไม่สำเร็จ" description={(error as Error).message} />
  );
  const empty = <Empty className="!my-10" description={ledger.length ? 'ไม่มีรายการในตัวกรองนี้' : 'ยังไม่มีมัดจำ'} />;

  return (
    <>
      {/* ---------- Desktop ---------- */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-4">
        <div className="col-span-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[30px] font-bold">เงินมัดจำ</h1>
            <p className="mt-1 text-sm text-muted">
              ลูกค้าโอนผ่าน PromptPay · NightOut ตรวจสลิปและถือไว้ แล้วโอนเข้าบัญชีร้าน
            </p>
          </div>
          <button
            type="button"
            disabled={!rows.length}
            onClick={() => downloadCsv(rows, statusLabel, `deposits-${dayjs().format('YYYY-MM-DD')}.csv`)}
            className="merchant-pill inline-flex h-9 items-center gap-2 rounded-xl border border-border px-3.5 text-sm disabled:opacity-50"
          >
            <DownloadSimple />
            ส่งออก CSV
          </button>
        </div>
        {errorAlert && <div className="col-span-4">{errorAlert}</div>}
        <StatTile {...stats.held} />
        <StatTile {...stats.pending} />
        <StatTile {...stats.paid} />
        <StatTile {...stats.credit} />

        <div className="col-span-4 flex min-w-0 flex-col overflow-hidden rounded-[20px] border border-border bg-card">
          <div className="border-b border-border px-[18px] py-3.5">{chips}</div>
          {isLoading ? (
            <Skeleton active className="p-[18px]" />
          ) : rows.length === 0 ? (
            empty
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="h-10 border-b border-border text-left text-xs text-muted">
                  <th className="w-[130px] pl-[18px] font-normal">วันที่จอง</th>
                  <th className="w-[120px] font-normal">รหัส</th>
                  <th className="font-normal">ลูกค้า</th>
                  <th className="font-normal">สถานะการจอง</th>
                  <th className="w-[110px] text-right font-normal">ยอด</th>
                  <th className="pr-[18px] text-right font-normal">สถานะเงิน</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const s = statusById.get(r.booking_id);
                  return (
                    <tr key={r.deposit_id} className="h-[46px] border-b border-border/60 last:border-b-0">
                      <td className="pl-[18px] text-muted">{dayjs(r.booking_datetime).format('D MMM HH:mm')}</td>
                      <td className="font-mono text-xs text-muted">{r.booking_code}</td>
                      <td>{r.customer_name ?? '-'}</td>
                      <td>{s ? <BookingStatusTag status={s} /> : '-'}</td>
                      <td className="text-right font-semibold text-gold-text">{baht(Number(r.amount))}</td>
                      <td className={`pr-[18px] text-right text-[13px] ${MONEY[r.settlement]?.cls ?? ''}`}>{moneyLabel(r)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ---------- มือถือ ---------- */}
      <div className="flex flex-col gap-2.5 lg:hidden">
        <h1 className="text-[17px] font-bold">เงินมัดจำ</h1>
        {errorAlert}
        <div className="flex flex-col gap-1 rounded-[20px] border border-gold/35 bg-[linear-gradient(160deg,color-mix(in_srgb,var(--gold)_14%,var(--card)),var(--card))] p-[18px]">
          <span className="text-[13px] text-muted">NightOut ถือไว้</span>
          <b className="text-[32px] text-gold-text">{stats.held.value}</b>
          <span className="text-xs text-muted">{stats.held.sub}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { title: 'รอโอน', value: stats.pending.value, cls: stats.pending.valueCls },
            { title: 'โอนแล้ว', value: stats.paid.value, cls: stats.paid.valueCls },
            { title: 'เครดิต', value: stats.credit.value, cls: stats.credit.valueCls },
          ].map((s) => (
            <Tile key={s.title} className="flex flex-col gap-0.5 !rounded-[14px] !p-3">
              <span className="text-[11px] text-muted">{s.title}</span>
              <b className={`truncate text-[15px] ${s.cls}`}>{s.value}</b>
            </Tile>
          ))}
        </div>
        {chips}
        {isLoading ? (
          <Skeleton active />
        ) : rows.length === 0 ? (
          empty
        ) : (
          <ul className="m-0 list-none p-0">
            {rows.map((r) => (
              <li key={r.deposit_id} className="flex items-center gap-3 border-b border-border/60 py-3">
                <span className="flex min-w-0 flex-1 flex-col text-sm">
                  <span className="truncate">{r.customer_name ?? '-'}</span>
                  <span className="truncate text-xs text-muted">
                    {dayjs(r.booking_datetime).format('D MMM')} · {r.booking_code}
                  </span>
                </span>
                <span className="flex flex-col items-end">
                  <b className="text-gold-text">{baht(Number(r.amount))}</b>
                  <span className={`text-[11px] ${MONEY[r.settlement]?.cls ?? ''}`}>{moneyLabel(r)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
