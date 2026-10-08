import { MASTER } from '@/services/data';
import { updateBarInfo } from './api';
import { App, Button, Card, Form, Input, Select, Switch, TimePicker } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { PageHeader } from '@/ui/components/pageHeader';
import { useMerchantBar } from '@/hooks/useMerchantBar';

const DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

export function MerchantStorePage() {
  const bar = useMerchantBar();
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);
  return (
    <div>
      <PageHeader
        title="ข้อมูลร้าน"
        subtitle="ข้อความต้องเป็นข้อมูลร้าน ห้ามชักชวนให้ดื่ม (ดูนโยบายถ้อยคำ)"
      />
      <Form
        layout="vertical"
        initialValues={{
          ...bar,
          district: bar.districtId,
          styles: MASTER.styles.filter((st) => bar.styles.includes(st.label)).map((st) => st.key),
          instagram: bar.links.find((l) => l.type === 'INSTAGRAM')?.url,
          tiktok: bar.links.find((l) => l.type === 'TIKTOK')?.url,
          // ครบ 7 วันเสมอ (ร้านใหม่ยังไม่มีเวลาเปิด-ปิด → ค่าเริ่มต้น 18:00–02:00)
          hours: Array.from(
            { length: 7 },
            (_, day) =>
              bar.hours.find((h) => h.day === day) ?? {
                day,
                open: '18:00',
                close: '02:00',
                closed: false,
              },
          ).map((h) => ({
            closed: !!h.closed,
            range: [dayjs(h.open, 'HH:mm'), dayjs(h.close, 'HH:mm')],
          })),
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
                ...(v.instagram
                  ? [{ type: 'INSTAGRAM' as const, url: v.instagram as string }]
                  : []),
                ...(v.tiktok ? [{ type: 'TIKTOK' as const, url: v.tiktok as string }] : []),
                ...bar.links.filter((l) => l.type !== 'INSTAGRAM' && l.type !== 'TIKTOK'),
              ],
              hours: v.hours.map(
                (
                  h: { closed: boolean; range?: [dayjs.Dayjs, dayjs.Dayjs] | null },
                  day: number,
                ) => ({
                  day_of_week: day,
                  is_closed: !!h.closed,
                  open_time: h.closed || !h.range ? null : h.range[0].format('HH:mm'),
                  close_time: h.closed || !h.range ? null : h.range[1].format('HH:mm'),
                }),
              ),
            });
            message.success('บันทึกข้อมูลร้านแล้ว');
          } catch (e) {
            message.error((e as Error).message);
          } finally {
            setSaving(false);
          }
        }}
      >
        <Card title="ข้อมูลทั่วไป" className="!mb-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item name="name" label="ชื่อร้าน" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="district" label="ย่าน">
              <Select
                allowClear
                options={MASTER.districts.map((d) => ({ label: d.name, value: d.id }))}
              />
            </Form.Item>
          </div>
          <Form.Item name="address" label="ที่อยู่">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="คำอธิบายร้าน">
            <Input.TextArea rows={3} maxLength={400} showCount />
          </Form.Item>
          <Form.Item name="styles" label="สไตล์">
            <Select
              mode="multiple"
              options={MASTER.styles.map((st) => ({ label: st.label, value: st.key }))}
            />
          </Form.Item>
        </Card>
        <Card title="เวลาเปิด-ปิด" className="!mb-6">
          <Form.List name="hours">
            {(fields) =>
              fields.map((f, i) => (
                <div key={f.key} className="mb-2 flex flex-wrap items-center gap-3">
                  <span className="w-24">{DAYS[i]}</span>
                  <Form.Item name={[f.name, 'range']} noStyle>
                    <TimePicker.RangePicker
                      className="merchant-hours-range"
                      format="HH:mm"
                      minuteStep={15}
                      order={false}
                    />
                  </Form.Item>
                  <Form.Item name={[f.name, 'closed']} valuePropName="checked" noStyle>
                    <Switch checkedChildren="ปิด" unCheckedChildren="เปิด" />
                  </Form.Item>
                </div>
              ))
            }
          </Form.List>
          <p className="text-xs text-muted">รองรับปิดข้ามเที่ยงคืน เช่น 18:00–02:00</p>
        </Card>
        <Card title="ลิงก์โซเชียล (แสดงเป็นลิงก์เท่านั้น)" className="!mb-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item name="instagram" label="Instagram" rules={[{ type: 'url' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="tiktok" label="TikTok" rules={[{ type: 'url' }]}>
              <Input />
            </Form.Item>
          </div>
        </Card>
        <Button type="primary" htmlType="submit" size="large" loading={saving}>
          บันทึก
        </Button>
      </Form>
    </div>
  );
}
