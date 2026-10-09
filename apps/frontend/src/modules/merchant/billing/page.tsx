import { Alert, Empty, Skeleton } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useMerchantBar } from '@/hooks/useMerchantBar';
import { baht } from '@/ui/utils/format';
import { useBillingEvents, type BillingEventRow } from './api';

/** สถานะของเดือน (สรุปจากสถานะของรายการในเดือนนั้น) */
function monthState(rows: BillingEventRow[]) {
  if (rows.some((r) => r.status === 'INVOICED')) return { label: 'รอชำระ', cls: 'text-[#d87a16]' };
  if (rows.some((r) => r.status === 'PENDING')) return { label: 'สะสมอยู่', cls: 'text-gold-text' };
  if (rows.every((r) => r.status === 'WAIVED')) return { label: 'ยกเว้นค่าคอม', cls: 'text-muted' };
  return { label: 'ชำระแล้ว', cls: 'text-(--crowd-available)' };
}

const monthName = (period: string) => {
  const d = dayjs(`${period.slice(0, 7)}-01`);
  return d.isValid() ? `${d.format('MMMM')} ${d.year() + 543}` : period;
};

/** /merchant/billing — ค่าคอมรายเดือน (การ์ดเดือนซ้าย) + billing events ของเดือนที่เลือก (ขวา) */
export function MerchantBillingPage() {
  const bar = useMerchantBar();
  const { data = [], isLoading, error } = useBillingEvents(bar.id);
  const months = [...new Set(data.map((r) => r.period.slice(0, 7)))].sort().reverse();
  const [picked, setPicked] = useState<string | null>(null);
  const month = picked && months.includes(picked) ? picked : (months[0] ?? null);
  const rows = data
    .filter((r) => r.period.slice(0, 7) === month)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const total = (list: BillingEventRow[]) => list.filter((r) => r.status !== 'WAIVED').reduce((a, r) => a + Number(r.amount), 0);
  const checkIns = (list: BillingEventRow[]) => list.filter((r) => r.event_type === 'CHECK_IN').length;
  const outstanding = data.filter((r) => r.status === 'PENDING' || r.status === 'INVOICED').reduce((s, r) => s + Number(r.amount), 0);

  const label = (r: BillingEventRow) => (r.event_type === 'CHECK_IN' ? 'เช็กอิน' : 'ไม่มาตามนัด');
  const amountCls = (r: BillingEventRow) => (r.status === 'WAIVED' ? 'text-muted line-through' : 'text-text');

  const monthCard = (m: string, compact: boolean) => {
    const list = data.filter((r) => r.period.slice(0, 7) === m);
    const st = monthState(list);
    const on = m === month;
    return (
      <button
        key={m}
        type="button"
        aria-pressed={on}
        onClick={() => setPicked(m)}
        className={`merchant-pill flex flex-col gap-1 rounded-[18px] border text-left ${compact ? 'min-w-[150px] p-3' : 'p-4'} ${
          on
            ? 'border-gold/35 bg-[linear-gradient(160deg,color-mix(in_srgb,var(--gold)_14%,var(--card)),var(--card))]'
            : 'border-border bg-card'
        }`}
      >
        <span className="flex justify-between gap-2 text-[13px]">
          <b className={compact ? 'text-xs font-normal text-muted' : 'font-semibold'}>{monthName(m)}</b>
          {!compact && <span className={st.cls}>{st.label}</span>}
        </span>
        <b className={`font-semibold ${compact ? 'text-lg' : 'text-2xl'}`}>{baht(total(list))}</b>
        <span className={`text-xs ${compact ? st.cls : 'text-muted'}`}>{compact ? st.label : `${checkIns(list)} เช็กอิน`}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-bold lg:font-display lg:text-[30px]">ค่าคอม</h1>
        <p className="mt-1 text-xs text-muted lg:text-sm">
          คิดต่อการจองที่ลูกค้าเช็กอินจริง (ยอดประเมินต่อหัว × จำนวนคน) · ไม่มาตามนัดไม่คิดค่าคอม · ค้างชำระ{' '}
          <b className="text-gold-text">{baht(outstanding)}</b>
        </p>
      </div>
      {error && <Alert type="error" showIcon title="โหลดค่าคอมไม่สำเร็จ" description={(error as Error).message} />}

      {isLoading ? (
        <Skeleton active />
      ) : months.length === 0 ? (
        <div className="rounded-[20px] border border-border bg-card">
          <Empty className="!my-10" description="ยังไม่มีค่าคอม — เกิดขึ้นเมื่อลูกค้าเช็กอินที่ร้าน" />
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden gap-4 lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
            <div className="flex flex-col gap-3">{months.map((m) => monthCard(m, false))}</div>
            <div className="min-w-0 self-start overflow-hidden rounded-[20px] border border-border bg-card">
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                <b className="font-semibold">Billing events · {month && monthName(month)}</b>
                <span className="text-[13px] text-muted">
                  ยอดรวม <b className="text-gold-text">{baht(total(rows))}</b>
                </span>
              </div>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="h-10 border-b border-border text-left text-xs text-muted">
                    <th className="w-[120px] pl-5 font-normal">วันที่</th>
                    <th className="w-[120px] font-normal">รหัสจอง</th>
                    <th className="font-normal">รายการ</th>
                    <th className="font-normal">ฐานคิด</th>
                    <th className="w-[110px] pr-5 text-right font-normal">จำนวน</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="h-12 border-b border-border/60 last:border-b-0">
                      <td className="pl-5 text-muted">{dayjs(r.created_at).format('D MMM')}</td>
                      <td className="font-mono text-xs text-muted">{r.booking?.code ?? '—'}</td>
                      <td>
                        {label(r)}
                        {r.status === 'WAIVED' && <span className="text-xs text-muted"> · ยกเว้น</span>}
                      </td>
                      <td className="text-[13px] text-muted">ยอดประเมิน {baht(Number(r.base_amount))}</td>
                      <td className={`pr-5 text-right font-semibold ${amountCls(r)}`}>{baht(Number(r.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* มือถือ */}
          <div className="flex flex-col gap-2.5 lg:hidden">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">{months.map((m) => monthCard(m, true))}</div>
            <b className="mt-1 text-sm font-semibold">รายการ{month && ` ${monthName(month)}`}</b>
            <ul className="m-0 list-none p-0">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center gap-3 border-b border-border/60 py-2.5">
                  <span className="flex min-w-0 flex-1 flex-col text-sm">
                    <span>{label(r)}</span>
                    <span className="text-xs text-muted">
                      {dayjs(r.created_at).format('D MMM')} · {r.booking?.code ?? '—'}
                    </span>
                  </span>
                  <b className={amountCls(r)}>{baht(Number(r.amount))}</b>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
