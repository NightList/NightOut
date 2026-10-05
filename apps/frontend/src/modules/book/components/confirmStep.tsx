import { Phone } from '@phosphor-icons/react';
import { Alert, Button, Card, Checkbox, Input, Typography } from 'antd';
import type { BarWithTier } from '@/services/data';
import { baht } from '@/ui/utils/format';
import type { BookingForm } from '../hooks/useBookingForm';

/** ขั้น 2: สรุปการจอง + มัดจำ + เบอร์ติดต่อ + ยอมรับเงื่อนไขริบมัดจำ แล้วยืนยัน */
export function ConfirmStep({ bar, f }: { bar: BarWithTier; f: BookingForm }) {
  const { datetime, chosenPromo } = f;
  return (
    <Card>
      {f.banned && (
        <Alert
          className="!mb-4"
          type="error"
          showIcon
          title="บัญชีนี้ถูกระงับการจอง"
          description="ตรวจพบสลิปมัดจำไม่ถูกต้องซ้ำ หากคิดว่าเป็นความผิดพลาด กรุณาติดต่อ NightOut"
        />
      )}
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
        description="เราถือเงินไว้ให้จนกว่าคุณจะเช็กอิน แล้วจึงส่งต่อให้ร้าน"
      />

      <label htmlFor="contact-phone" className="mt-5 block text-sm font-medium">
        เบอร์โทรติดต่อ
      </label>
      <Input
        id="contact-phone"
        className="!mt-1.5"
        size="large"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="081-234-5678"
        prefix={<Phone size={18} className="text-muted" aria-hidden />}
        value={f.phone}
        status={f.phoneError ? 'error' : undefined}
        aria-invalid={!!f.phoneError}
        aria-describedby="contact-phone-help"
        onChange={(e) => f.setPhone(e.target.value)}
        onBlur={() => f.setPhoneTouched(true)}
        maxLength={16}
      />
      <Typography.Text
        id="contact-phone-help"
        type={f.phoneError ? 'danger' : 'secondary'}
        className="mt-1 block text-xs"
      >
        {f.phoneError ?? 'ร้านใช้ติดต่อเรื่องโต๊ะของคุณ'}
      </Typography.Text>

      {f.needsTerms && (
        <section aria-labelledby="deposit-terms" className="mt-5 rounded-lg border border-border bg-surface p-4">
          <h3 id="deposit-terms" className="text-sm font-semibold">
            เงื่อนไขมัดจำ {baht(f.deposit)}
          </h3>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
            {f.termsLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          <Checkbox
            className="!mt-4"
            checked={f.termsAccepted}
            onChange={(e) => f.setTermsAccepted(e.target.checked)}
          >
            <span className="text-sm">
              ฉันได้อ่านและยอมรับเงื่อนไขมัดจำ รวมถึงการริบมัดจำเมื่อยกเลิกช้าหรือไม่มาตามนัด
            </span>
          </Checkbox>
          <p className="mt-2 text-xs text-muted">ระบบบันทึกเวลาและอุปกรณ์ที่ใช้กดยอมรับไว้เป็นหลักฐานของการจองนี้</p>
        </section>
      )}
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
        <Button
          block
          type="primary"
          loading={f.submitting}
          disabled={!f.canSubmit}
          onClick={() => void f.submit()}
        >
          {f.needsTerms ? 'ยืนยันและไปโอนมัดจำ' : 'ยืนยันการจอง'}
        </Button>
      </div>
    </Card>
  );
}
