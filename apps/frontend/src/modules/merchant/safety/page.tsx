import {
  Car,
  CheckCircle,
  Circle,
  DoorOpen,
  FirstAidKit,
  GenderFemale,
  IdentificationCard,
  Lightbulb,
  Paperclip,
  Phone,
  SealCheck,
  UserFocus,
  VideoCamera,
  XCircle,
} from '@phosphor-icons/react';
import { App, Upload } from 'antd';
import { useState, type ReactNode } from 'react';
import { SAFETY_LABELS, type SafetyValue } from '@/services/data';

type SafetyKey = keyof typeof SAFETY_LABELS;
import { useMerchantBar } from '@/hooks/useMerchantBar';
import { Ring, Tile } from '@/ui/components/merchantUi';
import { setSafety, uploadSafetyProof } from './api';

const ICON: Record<SafetyKey, ReactNode> = {
  SECURITY: <UserFocus />,
  CCTV: <VideoCamera />,
  FIRE_EXIT: <DoorOpen />,
  FIRST_AID: <FirstAidKit />,
  ID_CHECK: <IdentificationCard />,
  PARKING_RIDE: <Car />,
  FEMALE_STAFF: <GenderFemale />,
  LIGHTING: <Lightbulb />,
  EMERGENCY_CONTACT: <Phone />,
};

const OPTIONS: { value: SafetyValue; label: string; on: string }[] = [
  { value: 'YES', label: 'มี', on: 'bg-(--crowd-available) text-on-gold font-semibold' },
  { value: 'NO', label: 'ไม่มี', on: 'bg-(--crowd-full) text-white font-semibold' },
  { value: 'UNKNOWN', label: 'ไม่ระบุ', on: 'bg-border text-text' },
];

/** /merchant/safety — Safety Score (ซ้าย) + checklist มี/ไม่มี/ไม่ระบุ + แนบหลักฐาน (ขวา) */
export function MerchantSafetyPage() {
  const bar = useMerchantBar();
  const { message } = App.useApp();
  const [busy, setBusy] = useState<string | null>(null);
  const total = bar.safety.length;
  const yes = bar.safety.filter((s) => s.value === 'YES').length;
  const no = bar.safety.filter((s) => s.value === 'NO').length;
  const verified = bar.safety.filter((s) => s.source === 'ADMIN_VERIFIED' && s.value === 'YES').length;

  const change = async (key: SafetyKey, value: SafetyValue) => {
    setBusy(key);
    try {
      await setSafety(bar.id, key, value);
      message.success(value === 'YES' ? 'บันทึกแล้ว · แนบหลักฐานให้ทีม NightOut ยืนยันได้' : 'บันทึกแล้ว');
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  /** บรรทัดใต้ชื่อ: ยืนยันแล้ว (เขียว) · ร้านแจ้ง รอตรวจ (เหลือง) · ยังไม่มีข้อมูล */
  const evidence = (s: (typeof bar.safety)[number]) =>
    s.value === 'YES'
      ? s.source === 'ADMIN_VERIFIED'
        ? { text: 'ยืนยันแล้วโดย NightOut', cls: 'text-(--crowd-available)' }
        : { text: 'ร้านแจ้ง · แนบหลักฐานให้ทีมตรวจ', cls: 'text-(--crowd-almost-full)' }
      : s.value === 'NO'
        ? { text: 'ลูกค้าเห็นว่า "ไม่มี"', cls: 'text-muted' }
        : { text: 'ยังไม่มีข้อมูล', cls: 'text-muted' };

  const statusIcon = (v: SafetyValue) =>
    v === 'YES' ? (
      <CheckCircle weight="fill" className="text-(--crowd-available)" />
    ) : v === 'NO' ? (
      <XCircle weight="fill" className="text-(--crowd-full)" />
    ) : (
      <Circle className="text-muted" />
    );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[17px] font-bold lg:font-display lg:text-[30px]">ความปลอดภัย</h1>
        <p className="mt-1 hidden text-sm text-muted lg:block">
          ลูกค้าเห็นทุกข้อ · มีผลต่อดาวของร้าน · ทีม NightOut ยืนยันจากหลักฐาน
        </p>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          {/* คะแนน — Desktop เป็นวงใหญ่ · มือถือเป็นแถวเดียว */}
          <Tile className="flex items-center gap-3.5 !rounded-[18px] !p-3.5 lg:flex-col lg:gap-3 lg:!rounded-[20px] lg:!p-[22px]">
            <span className="lg:hidden">
              <Ring pct={total ? (yes / total) * 100 : 0} size={72}>
                <b className="text-base">
                  {yes}/{total}
                </b>
              </Ring>
            </span>
            <span className="hidden lg:block">
              <Ring pct={total ? (yes / total) * 100 : 0} size={140}>
                <b className="text-[32px] leading-none">
                  {yes}/{total}
                </b>
                <span className="mt-1 text-xs font-normal text-muted">Safety Score</span>
              </Ring>
            </span>
            <span className="flex flex-col gap-0.5 lg:items-center">
              <b className="text-[15px] lg:hidden">Safety Score</b>
              <span className="inline-flex items-center gap-1.5 text-[13px] text-(--crowd-available) lg:rounded-full lg:border lg:border-(--crowd-available)/40 lg:bg-(--crowd-available)/10 lg:px-3 lg:py-1">
                <SealCheck weight="fill" /> ยืนยันโดย NightOut {verified} ข้อ
              </span>
            </span>
          </Tile>
          <Tile className="hidden flex-col gap-2.5 !p-[18px] text-sm lg:flex">
            <span className="flex items-center gap-2.5">
              <CheckCircle weight="fill" size={18} className="text-(--crowd-available)" />
              มี<b className="ml-auto">{yes}</b>
            </span>
            <span className="flex items-center gap-2.5">
              <XCircle weight="fill" size={18} className="text-(--crowd-full)" />
              ไม่มี<b className="ml-auto">{no}</b>
            </span>
            <span className="flex items-center gap-2.5">
              <Circle size={18} className="text-muted" />
              ยังไม่มีข้อมูล<b className="ml-auto">{total - yes - no}</b>
            </span>
          </Tile>
        </div>

        <ul className="m-0 flex list-none flex-col gap-2.5 p-0 lg:gap-0 lg:overflow-hidden lg:rounded-[20px] lg:border lg:border-border lg:bg-card">
          {bar.safety.map((s) => {
            const ev = evidence(s);
            return (
              <li
                key={s.key}
                className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-[14px] border border-border bg-card p-3 lg:min-h-[58px] lg:flex-nowrap lg:rounded-none lg:border-0 lg:border-b lg:border-border/60 lg:bg-transparent lg:px-5 lg:py-2 lg:last:border-b-0"
              >
                <span className="w-6 text-xl text-muted">{ICON[s.key]}</span>
                <span className="flex min-w-0 flex-1 flex-col text-sm">
                  <b className="font-medium">{SAFETY_LABELS[s.key]}</b>
                  <span className={`text-[11px] lg:text-xs ${ev.cls}`}>{ev.text}</span>
                </span>
                <span className="text-[22px] lg:hidden">{statusIcon(s.value)}</span>
                <div
                  role="radiogroup"
                  aria-label={SAFETY_LABELS[s.key]}
                  className="flex flex-1 gap-0.5 rounded-[10px] border border-border bg-surface p-[3px] text-xs lg:flex-none"
                >
                  {OPTIONS.map((o) => {
                    const on = s.value === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        disabled={busy === s.key}
                        onClick={() => !on && void change(s.key, o.value)}
                        className={`merchant-pill min-h-9 flex-1 rounded-[7px] px-2.5 lg:min-h-0 lg:py-1 ${on ? o.on : 'text-muted'}`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
                <Upload
                  accept="image/*,application/pdf"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    if (file.size > 10 * 1024 * 1024) {
                      message.error('ไฟล์ใหญ่เกิน 10MB');
                      return Upload.LIST_IGNORE;
                    }
                    void uploadSafetyProof(bar.id, s.key, file)
                      .then(() => message.success('ส่งหลักฐานแล้ว ทีม NightOut จะตรวจให้'))
                      .catch((e: Error) => message.error(e.message));
                    return false;
                  }}
                >
                  <button
                    type="button"
                    className="merchant-pill inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-border px-3 text-[13px] text-muted hover:text-text lg:h-8"
                  >
                    <Paperclip /> หลักฐาน
                  </button>
                </Upload>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
