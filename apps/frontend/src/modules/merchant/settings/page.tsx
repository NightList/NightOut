import { setPayoutAccount, updateBookingSettings } from '@/services/data';
import { Alert, App, Button, Card, Form, Input, InputNumber, Select } from 'antd';
import { useState } from 'react';
import { PageHeader } from '@/ui/components/pageHeader';
import { useMerchantBar } from '@/hooks/useMerchantBar';

const BANKS = ['กสิกรไทย', 'ไทยพาณิชย์', 'กรุงเทพ', 'กรุงไทย', 'กรุงศรี', 'ทหารไทยธนชาต', 'ออมสิน', 'อื่นๆ'];

/** /merchant/settings — มัดจำ (เก็บทุกการจอง) · บัญชีรับเงิน · PR ประจำร้าน · เก็บโต๊ะ */
export function MerchantSettingsPage() {
  const bar = useMerchantBar();
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);
  return (
    <div>
      <PageHeader title="ตั้งค่าการจอง" />
      <Form
        layout="vertical"
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
            }
            message.success('บันทึกแล้ว');
          } catch (e) {
            message.error((e as Error).message);
          } finally {
            setSaving(false);
          }
        }}
      >
        <Card title="มัดจำ (เก็บทุกการจอง)" className="!mb-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item name="amount" label="ยอดมัดจำ" rules={[{ required: true }]}>
              <InputNumber className="!w-full" min={100} step={100} suffix="฿" />
            </Form.Item>
            <Form.Item name="unit" label="คิดต่อ">
              <Select
                options={[
                  { label: 'ต่อโต๊ะ', value: 'PER_TABLE' },
                  { label: 'ต่อคน', value: 'PER_PERSON' },
                ]}
              />
            </Form.Item>
          </div>
          <Form.Item name="policy" label="นโยบายมัดจำ (ลูกค้าเห็นก่อนโอน)" rules={[{ max: 500 }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <p className="text-xs text-muted">
            ลูกค้าโอนมัดจำเข้า NightOut · เราตรวจสลิปและถือเงินไว้ · เมื่อลูกค้าเช็กอิน (หรือไม่มาตามนัด)
            เงินเป็นของร้าน แล้วเราโอนเข้าบัญชีด้านล่าง หรือเก็บเป็นเครดิตร้านตามที่ตกลง
          </p>
        </Card>

        <Card title="บัญชีรับเงินมัดจำ" className="!mb-6">
          {!bar.payout.accountNo && (
            <Alert
              type="warning"
              showIcon
              className="!mb-4"
              title="ยังไม่มีบัญชีรับเงิน — กรอกให้ครบเพื่อให้ NightOut โอนมัดจำให้ร้านได้"
            />
          )}
          <div className="grid gap-4 md:grid-cols-3">
            <Form.Item
              name="bankName"
              label="ธนาคาร"
              dependencies={['accountNo']}
              rules={[({ getFieldValue }) => ({ required: !!getFieldValue('accountNo'), message: 'เลือกธนาคาร' })]}
            >
              <Select options={BANKS.map((b) => ({ label: b, value: b }))} />
            </Form.Item>
            <Form.Item
              name="accountNo"
              label="เลขบัญชี"
              extra={bar.payout.accountNo ? `บัญชีปัจจุบัน ${bar.payout.accountNo} · กรอกเฉพาะเมื่อต้องการเปลี่ยน` : undefined}
              rules={[
                { pattern: /^\d{10,15}$/, message: 'ตัวเลข 10–15 หลัก' },
              ]}
            >
              <Input inputMode="numeric" autoComplete="off" placeholder={bar.payout.accountNo || undefined} />
            </Form.Item>
            <Form.Item
              name="accountName"
              label="ชื่อบัญชี"
              dependencies={['accountNo']}
              rules={[({ getFieldValue }) => ({ required: !!getFieldValue('accountNo'), message: 'กรอกชื่อบัญชี' })]}
            >
              <Input />
            </Form.Item>
          </div>
        </Card>

        <Card title="PR ประจำร้าน" className="!mb-6">
          <p className="mb-4 text-sm text-muted">
            ลูกค้าเห็นในหน้าร้านว่ามี PR ไหม และเป็นชาย/หญิง/LGBTQ+ กี่คน · ใส่ 0 ทั้งหมดถ้าไม่มี
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <Form.Item name="prMale" label="PR ชาย (คน)">
              <InputNumber className="!w-full" min={0} max={99} />
            </Form.Item>
            <Form.Item name="prFemale" label="PR หญิง (คน)">
              <InputNumber className="!w-full" min={0} max={99} />
            </Form.Item>
            <Form.Item name="prLgbtq" label="PR LGBTQ+ (คน)">
              <InputNumber className="!w-full" min={0} max={99} />
            </Form.Item>
          </div>
        </Card>

        <Card title="การเก็บโต๊ะ" className="!mb-6">
          <Form.Item
            name="gracePeriodMinutes"
            label="เก็บโต๊ะหลังเวลาจอง (Grace period)"
            extra="เลยเวลานี้ไม่มาเช็กอิน → ระบบเปลี่ยนเป็นไม่มาตามนัดอัตโนมัติ และมัดจำตกเป็นของร้าน"
          >
            <Select options={[15, 30, 45, 60, 90].map((m) => ({ label: `${m} นาที`, value: m }))} />
          </Form.Item>
        </Card>
        <Button type="primary" htmlType="submit" size="large" loading={saving}>
          บันทึก
        </Button>
      </Form>
    </div>
  );
}
