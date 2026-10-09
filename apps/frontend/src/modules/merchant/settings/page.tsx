import { Bank, ClockCountdown, MinusCircle, PlusCircle, UserSound, Wallet } from '@phosphor-icons/react';
import { Alert, App, Form, Input, InputNumber, Segmented, Select } from 'antd';
import { useState, type ReactNode } from 'react';
import { useMerchantBar } from '@/hooks/useMerchantBar';
import { Tile } from '@/ui/components/merchantUi';
import { setPayoutAccount, updateBookingSettings } from './api';

const BANKS = ['กสิกรไทย', 'ไทยพาณิชย์', 'กรุงเทพ', 'กรุงไทย', 'กรุงศรี', 'ทหารไทยธนชาต', 'ออมสิน', 'อื่นๆ'];
const GRACE = [15, 30, 45, 60, 90];

/** ปุ่ม − จำนวน + (PR) — control ของ Form.Item */
function Stepper({ value = 0, onChange, label }: { value?: number; onChange?: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-border bg-surface p-3.5">
      <span className="text-sm">{label}</span>
      <span className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`ลด ${label}`}
          disabled={value <= 0}
          onClick={() => onChange?.(Math.max(0, value - 1))}
          className="text-[22px] text-muted disabled:opacity-40"
        >
          <MinusCircle />
        </button>
        <b className="w-6 text-center text-lg tabular-nums" aria-live="polite">
          {value}
        </b>
        <button
          type="button"
          aria-label={`เพิ่ม ${label}`}
          disabled={value >= 99}
          onClick={() => onChange?.(Math.min(99, value + 1))}
          className="text-[22px] text-gold disabled:opacity-40"
        >
          <PlusCircle />
        </button>
      </span>
    </div>
  );
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Tile className="flex flex-col gap-3.5 lg:!p-[22px]">
      <span className="flex items-center gap-2.5 font-semibold">
        <span className="text-xl text-gold">{icon}</span>
        {title}
      </span>
      {children}
    </Tile>
  );
}

/** /merchant/settings — มัดจำ · บัญชีรับเงินจาก NightOut · เช็กอินและยกเลิกอัตโนมัติ · PR (Bento 2×2) */
export function MerchantSettingsPage() {
  const bar = useMerchantBar();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [editAccount, setEditAccount] = useState(!bar.payout.accountNo);

  const saveButton = (cls: string) => (
    <button type="button" disabled={saving} onClick={() => form.submit()} className={`merchant-pill disabled:opacity-60 ${cls}`}>
      {saving ? 'กำลังบันทึก…' : 'บันทึก'}
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[17px] font-bold lg:font-display lg:text-[30px]">ตั้งค่าการจอง</h1>
          <p className="mt-1 hidden text-sm text-muted lg:block">มีผลกับการจองใหม่เท่านั้น · การจองเดิมใช้ค่าตอนจอง</p>
        </div>
        {saveButton('hidden h-10 items-center rounded-xl bg-gold px-[18px] text-sm font-semibold text-on-gold lg:inline-flex')}
        {saveButton('px-2 py-1 text-sm font-semibold text-gold-text lg:hidden')}
      </div>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{
          ...bar.deposit,
          bankName: bar.payout.bankName || undefined,
          accountName: bar.payout.accountName || undefined,
          prMale: bar.pr.male,
          prFemale: bar.pr.female,
          prLgbtq: bar.pr.lgbtq ?? 0,
          gracePeriodMinutes: bar.gracePeriodMinutes,
        }}
        onFinish={async (v) => {
          setSaving(true);
          try {
            await updateBookingSettings(bar.id, {
              deposit_amount: v.amount,
              deposit_unit: v.unit,
              deposit_policy: v.policy ?? '',
              grace_minutes: v.gracePeriodMinutes,
              pr_male: v.prMale ?? 0,
              pr_female: v.prFemale ?? 0,
              pr_lgbtq: v.prLgbtq ?? 0,
            });
            // เลขบัญชีไม่ส่งกลับมาหน้าเว็บ (เข้ารหัสใน DB) — กรอกใหม่เมื่อต้องการเปลี่ยนเท่านั้น
            if (v.accountNo) {
              await setPayoutAccount(bar.id, { bank_code: v.bankName, account_name: v.accountName, account_no: v.accountNo });
              form.setFieldValue('accountNo', undefined);
              setEditAccount(false);
            }
            message.success('บันทึกแล้ว');
          } catch (e) {
            message.error((e as Error).message);
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
          <Section icon={<Wallet />} title="มัดจำ (เก็บทุกการจอง)">
            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="amount" label="ยอดมัดจำ" rules={[{ required: true, message: 'กรอกยอดมัดจำ' }]} className="!mb-0">
                <InputNumber className="!w-full" min={100} step={100} suffix="฿" inputMode="numeric" />
              </Form.Item>
              <Form.Item name="unit" label="คิดต่อ" className="!mb-0">
                <Select
                  options={[
                    { label: 'ต่อโต๊ะ', value: 'PER_TABLE' },
                    { label: 'ต่อคน', value: 'PER_PERSON' },
                  ]}
                />
              </Form.Item>
            </div>
            <Form.Item name="policy" label="นโยบายคืนมัดจำ (ลูกค้าเห็นก่อนโอน)" rules={[{ max: 500 }]} className="!mb-0">
              <Input.TextArea rows={2} placeholder="เช่น ยกเลิกก่อน 24 ชม. คืนเต็มจำนวน · หลังจากนั้นเก็บเป็นเครดิตร้าน" />
            </Form.Item>
          </Section>

          <Section icon={<Bank />} title="บัญชีรับเงินจาก NightOut">
            {bar.payout.accountNo ? (
              <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-surface p-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-card text-xl text-(--crowd-available)">
                  <Bank />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <b className="truncate font-semibold">
                    {bar.payout.bankName} · {bar.payout.accountNo}
                  </b>
                  <span className="truncate text-[13px] text-muted">{bar.payout.accountName}</span>
                </span>
                <button type="button" onClick={() => setEditAccount((v) => !v)} className="shrink-0 text-sm text-link">
                  {editAccount ? 'ยกเลิก' : 'เปลี่ยน'}
                </button>
              </div>
            ) : (
              <Alert type="warning" showIcon title="ยังไม่มีบัญชีรับเงิน — กรอกให้ครบเพื่อให้ NightOut โอนมัดจำให้ร้านได้" />
            )}
            <div className={editAccount ? 'grid gap-3 sm:grid-cols-2' : 'hidden'}>
              <Form.Item
                name="bankName"
                label="ธนาคาร"
                className="!mb-0"
                dependencies={['accountNo']}
                rules={[({ getFieldValue }) => ({ required: !!getFieldValue('accountNo'), message: 'เลือกธนาคาร' })]}
              >
                <Select options={BANKS.map((b) => ({ label: b, value: b }))} />
              </Form.Item>
              <Form.Item name="accountNo" label="เลขบัญชี" className="!mb-0" rules={[{ pattern: /^\d{10,15}$/, message: 'ตัวเลข 10–15 หลัก' }]}>
                <Input inputMode="numeric" autoComplete="off" />
              </Form.Item>
              <Form.Item
                name="accountName"
                label="ชื่อบัญชี"
                className="!mb-0 sm:col-span-2"
                dependencies={['accountNo']}
                rules={[({ getFieldValue }) => ({ required: !!getFieldValue('accountNo'), message: 'กรอกชื่อบัญชี' })]}
              >
                <Input />
              </Form.Item>
            </div>
            <span className="text-[13px] text-muted">
              ลูกค้าโอนมัดจำเข้า NightOut · เมื่อลูกค้าเช็กอินหรือไม่มาตามนัด NightOut โอนเข้าบัญชีนี้ หรือเก็บเป็นเครดิตร้าน
            </span>
          </Section>

          <Section icon={<ClockCountdown />} title="เช็กอินและยกเลิกอัตโนมัติ">
            <Form.Item
              name="gracePeriodMinutes"
              label="Grace period หลังเวลานัด"
              className="!mb-0"
              extra="เลยเวลานี้ไม่มาเช็กอิน → ระบบเปลี่ยนเป็นไม่มาตามนัดอัตโนมัติ และมัดจำตกเป็นของร้าน"
            >
              <Segmented block options={GRACE.map((m) => ({ label: `${m} นาที`, value: m }))} />
            </Form.Item>
          </Section>

          <Section icon={<UserSound />} title="PR">
            <div className="grid gap-3 sm:grid-cols-3">
              <Form.Item name="prMale" noStyle>
                <Stepper label="PR ชาย" />
              </Form.Item>
              <Form.Item name="prFemale" noStyle>
                <Stepper label="PR หญิง" />
              </Form.Item>
              <Form.Item name="prLgbtq" noStyle>
                <Stepper label="LGBTQ+" />
              </Form.Item>
            </div>
            <span className="text-[13px] text-muted">ลูกค้าเห็นในหน้าร้านและกรองได้ในหน้าค้นหา · ใส่ 0 ทั้งหมดถ้าไม่มี</span>
          </Section>
        </div>
      </Form>
    </div>
  );
}
