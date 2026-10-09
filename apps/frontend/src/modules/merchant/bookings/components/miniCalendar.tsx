import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';

const WEEKDAYS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];

/** ปฏิทินเดือนแบบย่อ (เริ่มวันจันทร์) · จุดทอง = วันที่มีการจอง · วันที่เลือกพื้นทอง */
export function MiniCalendar({
  value,
  onChange,
  hasBookings,
}: {
  value: Dayjs;
  onChange: (d: Dayjs) => void;
  hasBookings: (d: Dayjs) => boolean;
}) {
  const [month, setMonth] = useState(() => value.startOf('month'));
  const lead = (month.day() + 6) % 7; // จันทร์ = 0
  const cells = Array.from({ length: Math.ceil((lead + month.daysInMonth()) / 7) * 7 }, (_, i) =>
    i < lead || i >= lead + month.daysInMonth() ? null : month.add(i - lead, 'day'),
  );
  const today = dayjs();

  return (
    <div className="flex flex-col gap-2.5">
      <span className="flex items-center justify-between text-sm">
        <button
          type="button"
          aria-label="เดือนก่อน"
          onClick={() => setMonth(month.subtract(1, 'month'))}
          className="grid size-8 place-items-center rounded-lg text-muted hover:text-text"
        >
          <CaretLeft />
        </button>
        <b className="font-semibold">{month.format('MMMM')} {month.year() + 543}</b>
        <button
          type="button"
          aria-label="เดือนถัดไป"
          onClick={() => setMonth(month.add(1, 'month'))}
          className="grid size-8 place-items-center rounded-lg text-muted hover:text-text"
        >
          <CaretRight />
        </button>
      </span>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const sel = d.isSame(value, 'day');
          const past = d.isBefore(today, 'day');
          const dot = hasBookings(d);
          return (
            <button
              key={i}
              type="button"
              aria-pressed={sel}
              aria-label={`${d.format('D MMMM')}${dot ? ' · มีการจอง' : ''}`}
              onClick={() => onChange(d)}
              className={`merchant-pill flex h-9 flex-col items-center justify-center gap-0.5 rounded-[10px] text-xs ${
                sel ? 'bg-gold font-semibold text-on-gold' : past ? 'text-muted/60' : 'text-text hover:bg-surface'
              }`}
            >
              {d.date()}
              <span
                className={`size-1 rounded-full ${dot ? (sel ? 'bg-on-gold' : 'bg-gold') : 'bg-transparent'}`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
