import { InstagramLogo, TiktokLogo } from '@phosphor-icons/react';
import { App, Form, Input, Select, Switch, TimePicker } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { MASTER } from '@/services/data';
import { useMerchantBar } from '@/hooks/useMerchantBar';
import { Tile } from '@/ui/components/merchantUi';
import { updateBarInfo } from './api';
import { BarPhotos } from './components/barPhotos';

const DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

/** สไตล์ร้านแบบชิปกดเลือก (ตัวที่เลือก = ทอง) — control ของ Form.Item */
function StyleChips({ value = [], onChange }: { value?: string[]; onChange?: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="สไตล์ร้าน">
      {MASTER.styles.map((s) => {
        const on = value.includes(s.key);
        return (
          <button
            key={s.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange?.(on ? value.filter((k) => k !== s.key) : [...value, s.key])}
            className={`merchant-pill rounded-full border px-3 py-2 text-[13px] lg:py-[5px] ${
              on ? 'border-gold/40 bg-gold/10 text-gold-text' : 'border-border text-muted'
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

/** /merchant/store — รูปร้าน (บันทึกทันที) ซ้าย · ข้อมูลร้าน เวลาเปิด-ปิด สไตล์ ลิงก์ (กดบันทึก) ขวา */
export function MerchantStorePage() {
  const bar = useMerchantBar();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const saveButton = (cls: string, label: string) => (
    <button
      type="button"
      disabled={saving}
      onClick={() => form.submit()}
      className={`merchant-pill disabled:opacity-60 ${cls}`}
    >
      {saving ? 'กำลังบันทึก…' : label}
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[17px] font-bold lg:font-display lg:text-[30px]">ข้อมูลร้าน</h1>
          <p className="mt-1 hidden text-sm text-muted lg:block">
            รูปบันทึกทันที · ข้อความกดบันทึก · ห้ามชักชวนให้ดื่ม (ดูนโยบายถ้อยคำ)
          </p>
        </div>
        {saveButton('hidden h-10 items-center rounded-xl bg-gold px-[18px] text-sm font-semibold text-on-gold lg:inline-flex', 'บันทึกการเปลี่ยนแปลง')}
        {saveButton('px-2 py-1 text-sm font-semibold text-gold-text lg:hidden', 'บันทึก')}
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <BarPhotos bar={bar} />

        <Tile>
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            className="merchant-store-form"
            initialValues={{
              ...bar,
              district: bar.districtId,
              styles: MASTER.styles.filter((st) => bar.styles.includes(st.label)).map((st) => st.key),
              instagram: bar.links.find((l) => l.type === 'INSTAGRAM')?.url,
              tiktok: bar.links.find((l) => l.type === 'TIKTOK')?.url,
              // ครบ 7 วันเสมอ (ร้านใหม่ยังไม่มีเวลาเปิด-ปิด → ค่าเริ่มต้น 18:00–02:00)
              hours: Array.from(
                { length: 7 },
                (_, day) => bar.hours.find((h) => h.day === day) ?? { day, open: '18:00', close: '02:00', closed: false },
              ).map((h) => ({ closed: !!h.closed, range: [dayjs(h.open, 'HH:mm'), dayjs(h.close, 'HH:mm')] })),
            }}
            onFinish={async (v) => {
              setSaving(true);
              try {
                await updateBarInfo(bar.id, {
                  name: v.name,
                  description: v.description || null,
                  address: v.address,
                  district_id: v.district ?? null,
                  style_keys: v.styles ?? [],
                  // ลิงก์อื่นที่ร้านมีอยู่แล้ว (Facebook / เว็บไซต์) ไม่หาย
                  links: [
                    ...(v.instagram ? [{ type: 'INSTAGRAM' as const, url: v.instagram as string }] : []),
                    ...(v.tiktok ? [{ type: 'TIKTOK' as const, url: v.tiktok as string }] : []),
                    ...bar.links.filter((l) => l.type !== 'INSTAGRAM' && l.type !== 'TIKTOK'),
                  ],
                  hours: v.hours.map((h: { closed: boolean; range?: [dayjs.Dayjs, dayjs.Dayjs] | null }, day: number) => ({
                    day_of_week: day,
                    is_closed: !!h.closed,
                    open_time: h.closed || !h.range ? null : h.range[0].format('HH:mm'),
                    close_time: h.closed || !h.range ? null : h.range[1].format('HH:mm'),
                  })),
                });
                message.success('บันทึกข้อมูลร้านแล้ว');
              } catch (e) {
                message.error((e as Error).message);
              } finally {
                setSaving(false);
              }
            }}
          >
            <Form.Item name="name" label="ชื่อร้าน" rules={[{ required: true, message: 'กรอกชื่อร้าน' }]}>
              <Input />
            </Form.Item>
            <div className="grid gap-x-3 sm:grid-cols-2">
              <Form.Item name="district" label="ย่าน">
                <Select allowClear options={MASTER.districts.map((d) => ({ label: d.name, value: d.id }))} />
              </Form.Item>
              <Form.Item name="address" label="ที่อยู่">
                <Input />
              </Form.Item>
            </div>

            <Form.Item label="เวลาเปิด-ปิด" extra="รองรับปิดข้ามเที่ยงคืน เช่น 18:00–02:00">
              <Form.List name="hours">
                {(fields) => (
                  <div className="flex flex-col gap-1.5">
                    {fields.map((f, i) => (
                      <div
                        key={f.key}
                        className="flex min-h-10 items-center gap-2.5 rounded-xl border border-border bg-surface px-3"
                      >
                        <span className="w-[72px] shrink-0 text-sm text-muted">{DAYS[i]}</span>
                        <Form.Item noStyle shouldUpdate>
                          {() => {
                            const closed = form.getFieldValue(['hours', f.name, 'closed']) as boolean;
                            return closed ? (
                              <span className="flex-1 text-sm text-muted">ปิดทั้งวัน</span>
                            ) : (
                              <Form.Item name={[f.name, 'range']} noStyle>
                                <TimePicker.RangePicker
                                  variant="borderless"
                                  className="merchant-hours-range !min-w-0 flex-1 !px-0"
                                  format="HH:mm"
                                  minuteStep={15}
                                  order={false}
                                  aria-label={`เวลาเปิด-ปิด วัน${DAYS[i]}`}
                                />
                              </Form.Item>
                            );
                          }}
                        </Form.Item>
                        {/* สวิตช์ = "เปิดร้าน" (ทอง = เปิด · เทา = ปิด) — ค่าในฟอร์มยังเป็น closed จึงกลับค่าเข้า/ออก */}
                        <Form.Item
                          name={[f.name, 'closed']}
                          noStyle
                          getValueProps={(closed: boolean) => ({ checked: !closed })}
                          normalize={(open: boolean) => !open}
                        >
                          <Switch aria-label={`เปิดร้านวัน${DAYS[i]}`} />
                        </Form.Item>
                      </div>
                    ))}
                  </div>
                )}
              </Form.List>
            </Form.Item>

            <Form.Item name="styles" label="สไตล์ร้าน">
              <StyleChips />
            </Form.Item>
            <Form.Item name="description" label="คำอธิบายร้าน">
              <Input.TextArea rows={3} maxLength={400} showCount />
            </Form.Item>
            <Form.Item label="ลิงก์ (แสดงเป็นลิงก์เท่านั้น)" className="!mb-0">
              <div className="flex flex-col gap-2">
                <Form.Item name="instagram" noStyle rules={[{ type: 'url', message: 'ใส่ลิงก์เต็ม เช่น https://instagram.com/…' }]}>
                  <Input prefix={<InstagramLogo className="text-muted" />} placeholder="https://instagram.com/…" aria-label="Instagram" />
                </Form.Item>
                <Form.Item name="tiktok" noStyle rules={[{ type: 'url', message: 'ใส่ลิงก์เต็ม เช่น https://tiktok.com/@…' }]}>
                  <Input prefix={<TiktokLogo className="text-muted" />} placeholder="https://tiktok.com/@…" aria-label="TikTok" />
                </Form.Item>
              </div>
            </Form.Item>
          </Form>
        </Tile>
      </div>
    </div>
  );
}
