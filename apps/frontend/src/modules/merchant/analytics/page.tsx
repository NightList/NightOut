import { Segmented } from 'antd';
import { useState } from 'react';
import { barBookings, type Booking } from '@/services/data';
import { useMerchantBar } from '@/hooks/useMerchantBar';
import { Tile } from '@/ui/components/merchantUi';

const DAY_MS = 24 * 60 * 60 * 1000;
const RANGES = [7, 14, 30, 90] as const;
type Range = (typeof RANGES)[number];
/** แถวของ heatmap เริ่มวันจันทร์ (getDay: 0 = อาทิตย์) */
const HEAT_DAYS = [
  { label: 'จ', day: 1 },
  { label: 'อ', day: 2 },
  { label: 'พ', day: 3 },
  { label: 'พฤ', day: 4 },
  { label: 'ศ', day: 5 },
  { label: 'ส', day: 6 },
  { label: 'อา', day: 0 },
];
const HEAT_HOURS = [18, 19, 20, 21, 22, 23, 0, 1];
const CHECKED = ['CHECKED_IN', 'COMPLETED'];
const CLOSED_OUT = ['CHECKED_IN', 'COMPLETED', 'NO_SHOW'];
const DEAD = ['REJECTED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_MERCHANT', 'EXPIRED'];

function stats(rows: Booking[]) {
  const live = rows.filter((b) => !DEAD.includes(b.status));
  const checked = live.filter((b) => CHECKED.includes(b.status));
  const closed = live.filter((b) => CLOSED_OUT.includes(b.status));
  const noShow = closed.length ? Math.round((live.filter((b) => b.status === 'NO_SHOW').length / closed.length) * 100) : 0;
  return { bookings: live.length, checkIns: checked.length, noShow, pax: checked.reduce((a, b) => a + b.pax, 0) };
}

/** ▲/▼ เทียบช่วงก่อนหน้า · lowerIsBetter = No-show (ลดลงเป็นสีเขียว) */
function delta(cur: number, prev: number, unit: '%' | 'pt', lowerIsBetter = false) {
  if (unit === '%' && prev === 0) return null;
  const d = unit === '%' ? Math.round(((cur - prev) / prev) * 100) : cur - prev;
  if (d === 0) return { text: 'เท่าเดิม', cls: 'text-muted' };
  const good = lowerIsBetter ? d < 0 : d > 0;
  return {
    text: `${d > 0 ? '▲' : '▼'} ${Math.abs(d)}${unit === '%' ? '%' : ' จุด'}`,
    cls: good ? 'text-(--crowd-available)' : 'text-(--crowd-full)',
  };
}

/** /merchant/analytics — KPI เทียบช่วงก่อนหน้า · การจองรายสัปดาห์ · ช่วงเวลายอดนิยม (วัน × ชั่วโมง) */
export function MerchantAnalyticsPage() {
  const bar = useMerchantBar();
  const [range, setRange] = useState<Range>(30);
  const [now] = useState(() => Date.now());
  const all = barBookings(bar.id);
  const within = (from: number, to: number) =>
    all.filter((b) => {
      const t = new Date(b.datetime).getTime();
      return t >= from && t < to;
    });
  const curRows = within(now - range * DAY_MS, now);
  const cur = stats(curRows);
  const prev = stats(within(now - 2 * range * DAY_MS, now - range * DAY_MS));

  const kpis = [
    { title: 'การจอง', value: cur.bookings.toLocaleString('th-TH'), d: delta(cur.bookings, prev.bookings, '%') },
    { title: 'เช็กอิน', value: cur.checkIns.toLocaleString('th-TH'), d: delta(cur.checkIns, prev.checkIns, '%') },
    { title: 'No-show', value: `${cur.noShow}%`, d: delta(cur.noShow, prev.noShow, 'pt', true) },
    { title: 'ลูกค้าที่มาจริง', value: `${cur.pax.toLocaleString('th-TH')} คน`, d: delta(cur.pax, prev.pax, '%') },
  ];

  // การจองรายสัปดาห์ (ย้อนหลังตามช่วง · อย่างน้อย 4 สัปดาห์) — แท่งล่าสุดสีทอง
  const weeks = Math.max(4, Math.ceil(range / 7));
  const weekly = Array.from({ length: weeks }, (_, i) => {
    const end = now - (weeks - 1 - i) * 7 * DAY_MS;
    const start = end - 7 * DAY_MS;
    const n = within(start, end).filter((b) => !DEAD.includes(b.status)).length;
    const fmt = (t: number) => new Date(t).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    return { n, label: `${fmt(start + DAY_MS)}–${fmt(end)}` };
  });
  const weekMax = Math.max(1, ...weekly.map((w) => w.n));

  // heatmap จากเวลานัดของการจองในช่วงนี้
  const heat = HEAT_DAYS.map(({ label, day }) => ({
    label,
    cells: HEAT_HOURS.map(
      (h) =>
        curRows.filter((b) => {
          const d = new Date(b.datetime);
          // หลังเที่ยงคืนนับเป็นคืนของวันก่อนหน้า (เช่น 01:00 คืนวันศุกร์)
          const nightDay = d.getHours() < 6 ? (d.getDay() + 6) % 7 : d.getDay();
          return !DEAD.includes(b.status) && nightDay === day && d.getHours() === h;
        }).length,
    ),
  }));
  const heatMax = Math.max(1, ...heat.flatMap((r) => r.cells));
  const cellColor = (n: number) =>
    n === 0 ? 'var(--surface)' : `color-mix(in srgb, var(--gold) ${Math.round(12 + (n / heatMax) * 88)}%, transparent)`;

  const rangePicker = (
    <Segmented<Range>
      value={range}
      onChange={setRange}
      options={RANGES.map((r) => ({ label: `${r} วัน`, value: r }))}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[17px] font-bold lg:font-display lg:text-[30px]">สถิติ</h1>
        {rangePicker}
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
        {kpis.map((k) => (
          <Tile key={k.title} className="flex flex-col gap-1 !rounded-2xl !p-3 lg:!rounded-[20px] lg:!p-[18px]">
            <span className="text-xs text-muted lg:text-[13px]">{k.title}</span>
            <b className="text-xl font-semibold lg:text-[26px]">{k.value}</b>
            <span className={`text-[11px] lg:text-xs ${k.d?.cls ?? 'text-muted'}`}>
              {k.d ? `${k.d.text} จาก ${range} วันก่อน` : 'ยังไม่มีข้อมูลช่วงก่อนหน้า'}
            </span>
          </Tile>
        ))}
      </div>

      <div className="grid gap-2.5 lg:grid-cols-2 lg:gap-4">
        <Tile className="flex flex-col gap-3 !rounded-[18px] lg:!rounded-[20px]">
          <b className="text-sm font-semibold">การจองรายสัปดาห์</b>
          <div className="flex h-40 items-end gap-2.5 border-b border-border pb-1 lg:h-56 lg:gap-3.5" role="img" aria-label={`การจองรายสัปดาห์ ${weekly.map((w) => `${w.label} ${w.n}`).join(', ')}`}>
            {weekly.map((w, i) => (
              <div key={w.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-xs text-muted">{w.n}</span>
                <span
                  className={`block w-full rounded-t-lg ${i === weekly.length - 1 ? 'bg-gold' : 'bg-purple/45'}`}
                  style={{ height: `${(w.n / weekMax) * 100}%`, minHeight: w.n ? 4 : 0 }}
                />
              </div>
            ))}
          </div>
          <div className="hidden gap-3.5 text-[11px] text-muted lg:flex">
            {weekly.map((w) => (
              <span key={w.label} className="flex-1 text-center">
                {w.label}
              </span>
            ))}
          </div>
        </Tile>

        <Tile className="flex flex-col gap-2.5 !rounded-[18px] lg:!rounded-[20px]">
          <b className="text-sm font-semibold">
            ช่วงเวลายอดนิยม <span className="text-xs font-normal text-muted">· จำนวนการจองตามวัน × ชั่วโมง</span>
          </b>
          <div className="grid grid-cols-[30px_repeat(8,1fr)] gap-[3px] text-[11px] text-muted lg:grid-cols-[36px_repeat(8,1fr)] lg:gap-1">
            <span />
            {HEAT_HOURS.map((h) => (
              <span key={h} className="text-center">
                {String(h).padStart(2, '0')}
              </span>
            ))}
          </div>
          {heat.map((r) => (
            <div key={r.label} className="grid h-7 grid-cols-[30px_repeat(8,1fr)] gap-[3px] lg:h-8 lg:grid-cols-[36px_repeat(8,1fr)] lg:gap-1">
              <span className="flex items-center text-[11px] text-muted lg:text-xs">{r.label}</span>
              {r.cells.map((n, i) => (
                <span
                  key={i}
                  title={`${r.label} ${String(HEAT_HOURS[i]).padStart(2, '0')}:00 · ${n} การจอง`}
                  className="block rounded-[4px] lg:rounded-md"
                  style={{ background: cellColor(n) }}
                />
              ))}
            </div>
          ))}
        </Tile>
      </div>
    </div>
  );
}
