import type { Booking } from '@/services/data';
import { Tag } from 'antd';
import { baht, dateTime } from '@/ui/utils/format';

export const SETTLEMENT_LABEL: Record<
  NonNullable<NonNullable<Booking['deposit']>['settlement']>,
  { label: string; color: string }
> = {
  HELD: { label: 'NightOut ถือไว้', color: 'blue' },
  PAYOUT_PENDING: { label: 'รอโอนให้ร้าน', color: 'gold' },
  PAID_OUT: { label: 'โอนให้ร้านแล้ว', color: 'green' },
  CREDIT: { label: 'เก็บเป็นเครดิตร้าน', color: 'purple' },
  REFUND_PENDING: { label: 'รอ NightOut โอนคืนลูกค้า', color: 'orange' },
  REFUNDED: { label: 'คืนลูกค้าแล้ว', color: 'default' },
};

/** สรุปมัดจำของการจอง 1 รายการ — ใช้ทั้งฝั่งลูกค้าและร้าน */
export function DepositSummary({ booking: b }: { booking: Booking }) {
  const d = b.deposit;
  if (!d) return <p className="text-sm text-muted">ยังไม่ได้โอนมัดจำ</p>;
  return (
    <dl className="grid grid-cols-[110px_1fr] gap-y-1.5 text-sm">
      <dt className="text-muted">ยอด</dt>
      <dd className="font-semibold text-gold-text">{baht(d.amount)}</dd>
      <dt className="text-muted">โอนเข้า</dt>
      <dd>NightOut (แพลตฟอร์มถือเงินไว้ให้ก่อน)</dd>
      <dt className="text-muted">สลิป</dt>
      <dd>
        {d.status === 'VERIFIED' ? 'ตรวจแล้ว' : d.status === 'REJECTED' ? 'ไม่ผ่าน' : 'รอตรวจ'} ·{' '}
        {dateTime(d.verifiedAt ?? d.submittedAt)}
      </dd>
      {d.settlement && (
        <>
          <dt className="text-muted">สถานะเงิน</dt>
          <dd>
            <Tag color={SETTLEMENT_LABEL[d.settlement].color}>{SETTLEMENT_LABEL[d.settlement].label}</Tag>
          </dd>
        </>
      )}
    </dl>
  );
}
