import { Alert, Button, Card, Input } from 'antd';
import type { BarWithTier } from '@/services/data';
import { baht } from '@/ui/utils/format';
import type { BookingForm } from '../hooks/useBookingForm';

/** ขั้น 2: สรุปการจอง + มัดจำ + หมายเหตุ แล้วยืนยัน */
export function ConfirmStep({ bar, f }: { bar: BarWithTier; f: BookingForm }) {
  const { datetime, chosenPromo } = f;
  return (
    <Card>
      <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
        <dt className="text-muted">ร้าน</dt>
        <dd>{bar.name}</dd>
        <dt className="text-muted">วันเวลา</dt>
        <dd>{datetime.format('ddd D MMM YYYY · HH:mm น.')}</dd>
        <dt className="text-muted">จำนวน</dt>
        <dd>{f.pax} คน</dd>
        <dt className="text-muted">โซน</dt>
        <dd>{f.zone?.zone.name}</dd>
        <dt className="text-muted">เก็บโต๊ะให้</dt>
        <dd>
          ถึง {datetime.add(bar.gracePeriodMinutes, 'minute').format('HH:mm น.')} ({bar.gracePeriodMinutes} นาที)
        </dd>
        {chosenPromo && (
          <>
            <dt className="text-muted">โปรโมชัน</dt>
            <dd>
              {chosenPromo.title}
              {chosenPromo.cutoffTime && (
                <span className="text-muted"> · เช็กอินก่อน {chosenPromo.cutoffTime} น.</span>
              )}
            </dd>
          </>
        )}
        <dt className="text-muted">มัดจำ</dt>
        <dd>
          <span className="font-semibold text-gold-text">{baht(f.deposit)}</span>
          <span className="text-muted">
            {' '}
            ({bar.deposit.unit === 'PER_PERSON' ? 'ต่อคน' : 'ต่อโต๊ะ'}) · โอนเข้า NightOut
          </span>
        </dd>
      </dl>
      <Alert
        className="mt-4"
        type="info"
        showIcon
        title="มัดจำเข้า NightOut ไม่ใช่เข้าร้านโดยตรง"
        description={`เราถือเงินไว้ให้จนกว่าคุณจะเช็กอิน แล้วจึงส่งต่อให้ร้าน · ${bar.deposit.policy}`}
      />
      <Input.TextArea
        className="!mt-4"
        rows={2}
        placeholder="หมายเหตุถึงร้าน (ไม่บังคับ) เช่น ฉลองวันเกิด"
        value={f.note}
        onChange={(e) => f.setNote(e.target.value)}
        maxLength={200}
        showCount
      />
      <div className="mt-6 flex gap-3">
        <Button block onClick={() => f.setStep(0)}>
          ย้อนกลับ
        </Button>
        <Button block type="primary" loading={f.submitting} onClick={() => void f.submit()}>
          ยืนยันและไปโอนมัดจำ
        </Button>
      </div>
    </Card>
  );
}
