import { App } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { DEPOSIT_TERMS_VERSION, depositTermsLines, depositTermsText, formatThaiPhone, toThaiE164 } from '@nightout/utils';
import { currentProfile, depositFor, promotionApplies, type BarWithTier } from '@/services/data';
import { createBooking, useZoneAvailability } from '../api';

/** state + การส่งของฟอร์มจองโต๊ะ (ใช้ใน /bars/:slug/book) */
export function useBookingForm(bar: BarWithTier | null) {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [step, setStep] = useState(0);
  // หลัง 4 ทุ่มเริ่มที่พรุ่งนี้
  const [date, setDate] = useState<Dayjs>(dayjs().hour() >= 22 ? dayjs().add(1, 'day') : dayjs());
  const [time, setTime] = useState('21:00');
  const [pax, setPax] = useState(4);
  const [zoneId, setZoneId] = useState<string>();
  const [promotionId, setPromotionId] = useState<string>();
  const [note, setNote] = useState('');
  // เบอร์ที่ใช้จองครั้งก่อน (users.phone_e164) เติมให้
  const [phone, setPhone] = useState(() => formatThaiPhone(currentProfile()?.phoneE164));
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const banned = !!currentProfile()?.bannedAt;

  const datetime = useMemo(() => {
    const [h, m] = time.split(':').map(Number);
    return date.hour(h!).minute(m!).second(0).millisecond(0);
  }, [date, time]);
  const iso = datetime.toISOString();
  // โซนว่างนับจากการจองจริงของทุกคนใน DB (เปลี่ยนวัน/เวลา → ถามใหม่)
  const availability = useZoneAvailability(bar, iso);

  const slots = availability.data ?? [];
  const promos = bar?.promotions.filter((p) => p.active) ?? [];
  const chosenPromo = promos.find((p) => p.id === promotionId);
  const zone = slots.find((s) => s.zone.id === zoneId);
  const past = datetime.isBefore(dayjs());
  const canContinue = !!zoneId && !past && !zone?.full;

  const deposit = bar ? depositFor(bar, pax) : 0;
  const phoneE164 = toThaiE164(phone);
  const phoneError = phoneTouched && !phoneE164 ? (phone.trim() ? 'เบอร์ไม่ถูกต้อง เช่น 081-234-5678' : 'กรอกเบอร์โทร') : null;
  // ข้อความเดียวกันทั้งที่แสดงข้าง checkbox และที่ส่งไปเก็บเป็นหลักฐาน
  const termsInput = {
    amount: deposit,
    refundBeforeHours: bar?.deposit.refundBeforeHours ?? 24,
    graceMinutes: bar?.gracePeriodMinutes ?? 30,
    barPolicy: bar?.deposit.policy,
  };
  const termsLines = depositTermsLines(termsInput);
  const needsTerms = deposit > 0;
  const canSubmit = !!phoneE164 && (!needsTerms || termsAccepted) && !banned;

  const submit = async () => {
    setPhoneTouched(true);
    if (!bar || !zoneId || !phoneE164 || (needsTerms && !termsAccepted)) return;
    setSubmitting(true);
    try {
      const b = await createBooking({
        bar_id: bar.id,
        zone_id: zoneId,
        datetime: iso,
        pax,
        promotion_id: chosenPromo && promotionApplies(chosenPromo, iso) ? chosenPromo.id : null,
        note: note.trim() || null,
        contact_phone: phoneE164,
        deposit_terms: needsTerms ? { accepted: true, terms_version: DEPOSIT_TERMS_VERSION, terms_text: depositTermsText(termsInput) } : null,
      });
      if (b.status === 'AWAITING_DEPOSIT') {
        message.success('สร้างการจองแล้ว โอนมัดจำเพื่อยืนยันโต๊ะ');
        navigate(`/bookings/${b.id}/deposit`);
      } else {
        message.success('ส่งคำขอจองแล้ว รอร้านยืนยัน');
        navigate(`/bookings/${b.id}`);
      }
    } catch (e) {
      message.error((e as Error).message);
      // โซนอาจเต็มระหว่างกรอก → โหลดโซนว่างใหม่
      void availability.refetch();
    } finally {
      setSubmitting(false);
    }
  };

  return {
    step,
    setStep,
    date,
    setDate,
    time,
    setTime,
    pax,
    setPax,
    zoneId,
    setZoneId,
    promotionId,
    setPromotionId,
    note,
    setNote,
    datetime,
    iso,
    slots,
    loadingSlots: availability.isLoading,
    promos,
    chosenPromo,
    zone,
    past,
    canContinue,
    deposit,
    phone,
    setPhone,
    setPhoneTouched,
    phoneError,
    termsLines,
    needsTerms,
    termsAccepted,
    setTermsAccepted,
    banned,
    canSubmit,
    submitting,
    submit,
  };
}

export type BookingForm = ReturnType<typeof useBookingForm>;
