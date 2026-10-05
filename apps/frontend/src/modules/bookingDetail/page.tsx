import { Clock, ChatCircleDots, MapPin, ShareNetwork } from '@phosphor-icons/react';
import { autoCancelAt, cancelBooking, getBar, getBooking } from '@/services/data';
import { App, Button, Card, Timeline } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import { Link, useParams } from 'react-router';
import { BookingStatusTag } from '@/ui/components/bookingStatusTag';
import { DepositSummary } from '@/ui/components/depositCard';
import { useAuth } from '@/services/auth';
import { useDemo } from '@/hooks/useDemo';
import { BOOKING_STATUS, dateTime } from '@/ui/utils/format';
import { useNow } from '@/hooks/useNow';
import { NotFoundResult } from '@/ui/components/notFoundResult';

function useCountdown(target: Date) {
  const now = useNow(1000);
  const ms = target.getTime() - now;
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${h > 0 ? `${h} ชม. ` : ''}${m} นาที ${s} วินาที`;
}

/** /bookings/:id — บัตรจอง + QR เช็กอิน */
export function BookingDetailPage() {
  useDemo();
  const { id = '' } = useParams();
  const { user } = useAuth();
  const { message, modal } = App.useApp();
  const b = getBooking(id);
  const bar = b ? getBar(b.barId) : null;
  const countdown = useCountdown(b ? autoCancelAt(b) : new Date(0));

  if (!b || !bar || b.userId !== user?.id) return <NotFoundResult title="ไม่พบการจองนี้" kind="booking" />;
  const zone = bar.zones.find((z) => z.id === b.zoneId);
  const table = zone?.tables.find((t) => t.id === b.tableId);
  const shareUrl = `${location.origin}/share/${b.shareToken}`;
  const canCancel = ['PENDING', 'AWAITING_DEPOSIT', 'DEPOSIT_SUBMITTED', 'CONFIRMED'].includes(b.status);

  const share = async () => {
    const text = `ไป ${bar.name} กัน! ${dateTime(b.datetime)} · ${zone?.name}\n${shareUrl}`;
    if (navigator.share) {
      await navigator
        .share({ title: 'บัตรจอง NightOut', text, url: shareUrl })
        .catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(text);
      message.success('คัดลอกลิงก์แล้ว');
    }
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted">รหัสจอง {b.code}</p>
              <h1 className="font-display text-3xl font-bold">{bar.name}</h1>
              <p className="mt-1 flex items-center gap-1 text-muted">
                <MapPin /> {bar.address}
              </p>
            </div>
            <BookingStatusTag status={b.status} />
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted">วันเวลา</dt>
              <dd className="font-semibold">{dateTime(b.datetime)}</dd>
            </div>
            <div>
              <dt className="text-muted">จำนวน</dt>
              <dd className="font-semibold">{b.pax} คน</dd>
            </div>
            <div>
              <dt className="text-muted">โซน</dt>
              <dd className="font-semibold">{zone?.name}</dd>
            </div>
            <div>
              <dt className="text-muted">โต๊ะ</dt>
              <dd className="font-semibold">{table?.name ?? 'ร้านจัดให้'}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`https://line.me/R/share?text=${encodeURIComponent(`ไป ${bar.name} กัน! ${dateTime(b.datetime)}\n${shareUrl}`)}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button icon={<ChatCircleDots />}>แชร์เข้า LINE</Button>
            </a>
            <Button icon={<ShareNetwork />} onClick={share}>
              แชร์ลิงก์
            </Button>
            {b.status === 'AWAITING_DEPOSIT' && (
              <Link to={`/bookings/${b.id}/deposit`}>
                <Button type="primary">จ่ายมัดจำ</Button>
              </Link>
            )}
            {['CHECKED_IN', 'COMPLETED'].includes(b.status) && !b.reviewed && (
              <Link to={`/reviews/new?booking=${b.id}`}>
                <Button type="primary">เขียนรีวิว</Button>
              </Link>
            )}
            {canCancel && (
              <Button
                danger
                onClick={() =>
                  modal.confirm({
                    title: 'ยกเลิกการจองนี้?',
                    content: bar.deposit.policy,
                    okText: 'ยกเลิกการจอง',
                    okButtonProps: { danger: true },
                    cancelText: 'ไม่ยกเลิก',
                    onOk: async () => {
                      try {
                        await cancelBooking(b.id);
                        message.success('ยกเลิกแล้ว');
                      } catch (e) {
                        message.error((e as Error).message);
                      }
                    },
                  })
                }
              >
                ยกเลิก
              </Button>
            )}
          </div>
        </Card>
        {b.cancelReason && ['REJECTED', 'CANCELLED_BY_MERCHANT', 'CANCELLED_BY_CUSTOMER'].includes(b.status) && (
          <Card title="เหตุผลที่ยกเลิก">
            <p>{b.cancelReason}</p>
          </Card>
        )}
        {b.promotionTitle && (
          <Card title="โปรโมชันที่เลือก">
            <p className="font-semibold">{b.promotionTitle}</p>
            <p className="text-sm text-muted">แจ้งพนักงานตอนเช็กอิน</p>
          </Card>
        )}
        <Card title="มัดจำ">
          <DepositSummary booking={b} />
        </Card>
        <Card title="ประวัติสถานะ">
          <Timeline
            items={b.history.map((h) => ({
              content: `${BOOKING_STATUS[h.to].label} · ${h.by} · ${dateTime(h.at)}`,
            }))}
          />
        </Card>
      </div>

      <Card className="h-fit text-center md:sticky md:top-24">
        {b.status === 'CONFIRMED' ? (
          <>
            <p className="mb-3 font-semibold">แสดง QR นี้ให้การ์ดหน้าร้าน</p>
            <div className="inline-block rounded-2xl bg-white p-4">
              <QRCodeSVG value={`NIGHTOUT:${b.id}`} size={200} level="M" />
            </div>
            <p className="mt-3 font-mono text-lg tracking-widest">{b.code}</p>
            {countdown ? (
              <p className="mt-3 flex items-center justify-center gap-1 text-sm text-muted">
                <Clock /> โต๊ะจะถูกยกเลิกอัตโนมัติใน {countdown}
              </p>
            ) : (
              <p className="mt-3 text-sm text-(--crowd-full)">เลยเวลาเก็บโต๊ะแล้ว</p>
            )}
          </>
        ) : (
          <div className="py-8 text-muted">
            <p className="mb-2 text-lg">QR เช็กอิน</p>
            <p className="text-sm">
              {b.status === 'CHECKED_IN' || b.status === 'COMPLETED'
                ? `เช็กอินแล้ว${b.checkedInAt ? ` · ${dateTime(b.checkedInAt)}` : ''} ขอให้สนุกนะ!`
                : ['PENDING', 'AWAITING_DEPOSIT', 'DEPOSIT_SUBMITTED'].includes(b.status)
                  ? 'จะแสดงเมื่อ NightOut ตรวจสลิปมัดจำแล้ว'
                  : 'การจองนี้ไม่สามารถเช็กอินได้แล้ว'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
