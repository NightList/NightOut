import { Flag, Play, Star } from '@phosphor-icons/react';
import { App, Empty, Popconfirm } from 'antd';
import { useState } from 'react';
import { barBookings, barReviews } from '@/services/data';
import { useMerchantBar } from '@/hooks/useMerchantBar';
import { Chip, Tile } from '@/ui/components/merchantUi';
import { timeAgo } from '@/ui/utils/format';
import { reportReview } from './api';

type Review = ReturnType<typeof barReviews>[number];
type Filter = 'ALL' | 'MEDIA' | 'REPORTED';

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex text-gold" aria-label={`${value} ดาว`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} weight={i <= Math.round(value) ? 'fill' : 'regular'} className={i <= Math.round(value) ? '' : 'text-border'} />
      ))}
    </span>
  );
}

/** /merchant/reviews — คะแนนเฉลี่ย + การกระจายดาว (ซ้าย) · รายการรีวิว + รายงานรีวิว (ขวา) */
export function MerchantReviewsPage() {
  const bar = useMerchantBar();
  const { message } = App.useApp();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [busy, setBusy] = useState<string | null>(null);
  const reviews = barReviews(bar.id).filter((r) => r.status !== 'REMOVED');
  const zoneOf = new Map(barBookings(bar.id).map((b) => [b.id, bar.zones.find((z) => z.id === b.zoneId)?.name]));
  const withMedia = reviews.filter((r) => r.media?.length);
  const reported = reviews.filter((r) => r.reported);
  const rows = filter === 'MEDIA' ? withMedia : filter === 'REPORTED' ? reported : reviews;
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const dist = [5, 4, 3, 2, 1].map((s) => ({ s, n: reviews.filter((r) => Math.round(r.rating) === s).length }));
  const distMax = Math.max(1, ...dist.map((d) => d.n));

  const report = async (r: Review) => {
    setBusy(r.id);
    try {
      await reportReview(r.id, 'OTHER', 'ร้านรายงานรีวิว');
      message.success('ส่งให้ทีม NightOut ตรวจแล้ว');
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const chips = (
    <div className="flex gap-1.5 overflow-x-auto">
      <Chip active={filter === 'ALL'} onClick={() => setFilter('ALL')}>
        ทั้งหมด {reviews.length}
      </Chip>
      <Chip active={filter === 'MEDIA'} onClick={() => setFilter('MEDIA')}>
        มีรูป {withMedia.length}
      </Chip>
      <Chip active={filter === 'REPORTED'} onClick={() => setFilter('REPORTED')}>
        รายงานแล้ว {reported.length}
      </Chip>
    </div>
  );

  const reportAction = (r: Review) =>
    r.reported ? (
      <span className="inline-flex items-center gap-1 text-[13px] text-[#d87a16]">
        <Flag weight="fill" /> รายงานแล้ว
      </span>
    ) : (
      <Popconfirm
        title="รายงานรีวิวนี้?"
        description="ทีม NightOut จะตรวจว่าผิดนโยบายหรือไม่"
        okText="รายงาน"
        cancelText="ยกเลิก"
        onConfirm={() => report(r)}
      >
        <button type="button" disabled={busy === r.id} className="inline-flex min-h-8 items-center gap-1 text-[13px] text-muted hover:text-text">
          <Flag /> รายงาน
        </button>
      </Popconfirm>
    );

  const media = (r: Review) =>
    r.media?.length ? (
      <div className="flex gap-1.5 lg:ml-[42px]">
        {r.media.slice(0, 4).map((m) => (
          <span key={m.id} className="relative size-14 overflow-hidden rounded-lg border border-border bg-surface">
            {(m.type === 'image' ? m.src : m.poster) && (
              <img src={m.type === 'image' ? m.src : m.poster} alt="" loading="lazy" className="size-full object-cover" />
            )}
            {m.type === 'video' && (
              <span className="absolute inset-0 grid place-items-center bg-black/40 text-white">
                <Play weight="fill" />
              </span>
            )}
          </span>
        ))}
        {r.media.length > 4 && <span className="self-center text-xs text-muted">+{r.media.length - 4}</span>}
      </div>
    ) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[17px] font-bold lg:font-display lg:text-[30px]">รีวิว</h1>
        <span className="hidden lg:block">{chips}</span>
      </div>

      <div className="grid min-w-0 gap-2.5 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-4">
        <div className="flex flex-col gap-4">
          <Tile className="flex items-center gap-3.5 !rounded-[18px] !p-3.5 lg:flex-col lg:items-stretch lg:gap-3 lg:!rounded-[20px] lg:!p-[22px]">
            <span className="flex items-baseline gap-2.5">
              <b className="text-4xl leading-none text-gold-text lg:text-5xl">{avg ? avg.toFixed(1) : '–'}</b>
              <span className="hidden lg:inline">
                <Stars value={avg} size={16} />
              </span>
            </span>
            <span className="flex flex-col text-[13px] text-muted">
              <span className="lg:hidden">
                <Stars value={avg} />
              </span>
              {reviews.length} รีวิว · จากลูกค้าที่เช็กอินจริง
            </span>
            <div className="hidden flex-col gap-2 lg:flex">
              {dist.map((d) => (
                <span key={d.s} className="flex items-center gap-2.5 text-[13px]">
                  <span className="w-3.5 text-muted">{d.s}</span>
                  <span className="block h-2 flex-1 overflow-hidden rounded-full bg-surface">
                    <span className="block h-full rounded-full bg-gold" style={{ width: `${(d.n / distMax) * 100}%` }} />
                  </span>
                  <span className="w-7 text-right text-muted">{d.n}</span>
                </span>
              ))}
            </div>
          </Tile>
          <Tile className="hidden flex-col gap-2.5 text-[13px] text-muted lg:flex">
            <b className="text-sm font-semibold text-text">รายงานรีวิว</b>
            <span className="leading-relaxed">
              รีวิวที่ผิดนโยบาย (ข้อความหยาบ ข้อมูลเท็จ ไม่เกี่ยวกับร้าน) กด “รายงาน” ให้ทีม NightOut ตรวจ · ร้านลบหรือแก้รีวิวเองไม่ได้
            </span>
          </Tile>
        </div>

        <span className="lg:hidden">{chips}</span>

        {rows.length === 0 ? (
          <Tile>
            <Empty description={reviews.length ? 'ไม่มีรีวิวในตัวกรองนี้' : 'ยังไม่มีรีวิว — ลูกค้ารีวิวได้หลังเช็กอิน'} />
          </Tile>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2.5 self-start p-0 lg:gap-0 lg:overflow-hidden lg:rounded-[20px] lg:border lg:border-border lg:bg-card">
            {rows.map((r) => {
              const zone = r.bookingId ? zoneOf.get(r.bookingId) : undefined;
              return (
                <li
                  key={r.id}
                  className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3.5 lg:rounded-none lg:border-0 lg:border-b lg:border-border/60 lg:bg-transparent lg:px-[22px] lg:py-[18px] lg:last:border-b-0"
                >
                  <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="hidden size-8 place-items-center rounded-full bg-border text-[13px] lg:grid">{r.userName.slice(0, 1)}</span>
                    <b className="text-sm font-medium">{r.userName}</b>
                    <Stars value={r.rating} />
                    <span className="hidden text-xs text-muted lg:inline">
                      {timeAgo(r.createdAt)} · เช็กอินแล้ว{zone ? ` · ${zone}` : ''}
                    </span>
                    {r.status === 'HIDDEN' && <span className="rounded-full border border-border px-2 text-[11px] text-muted">ซ่อนโดยทีม NightOut</span>}
                    <span className="ml-auto">{reportAction(r)}</span>
                  </span>
                  <p className="text-sm leading-relaxed text-pretty lg:ml-[42px]">{r.comment}</p>
                  {media(r)}
                  <span className="text-xs text-muted lg:hidden">{timeAgo(r.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
