import type { BarCategory } from '@nightout/types';
import { CATEGORY_LABELS, MASTER } from '@/services/data';
import { merchantJoin } from './api';
import { useAuth } from '@/services/auth';
import { useState } from 'react';
import { App, Button, Card, Form, Input, Select, Steps } from 'antd';
import { useNavigate } from 'react-router';
import { PageHeader } from '@/ui/components/pageHeader';

/** /merchant/join — สมัครเป็นร้าน → ส่งตรวจ */
export function MerchantJoinPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { reload } = useAuth();
  const [sending, setSending] = useState(false);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="สมัครเป็นร้านค้า"
        subtitle="ใช้ฟรีช่วงทดลอง · เก็บค่าคอมเฉพาะการจองที่ลูกค้ามาจริง"
      />
      <Steps
        className="mb-6"
        current={0}
        items={[{ title: 'ข้อมูลร้าน' }, { title: 'ทีมตรวจสอบ' }, { title: 'เปิดใช้งาน' }]}
      />
      <Card>
        <Form
          layout="vertical"
          size="large"
          onFinish={async (v: { name: string; category: BarCategory; district?: string; address: string; license: string }) => {
            setSending(true);
            try {
              await merchantJoin({ name: v.name, category: v.category, district_id: v.district ?? null, address: v.address, license: v.license });
              await reload(); // role เปลี่ยนเป็นร้านค้า → เมนูร้านค้าเปิดให้เตรียมข้อมูลระหว่างรอตรวจ
              message.success('ส่งข้อมูลแล้ว ทีม NightOut จะตรวจภายใน 1–2 วันทำการ');
              navigate('/merchant/status');
            } catch (e) {
              message.error((e as Error).message);
            } finally {
              setSending(false);
            }
          }}
        >
          <Form.Item name="name" label="ชื่อร้าน" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <div className="grid gap-4 sm:grid-cols-2">
            <Form.Item name="category" label="ประเภท" rules={[{ required: true }]}>
              <Select
                options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Form.Item>
            <Form.Item name="district" label="ย่าน" rules={[{ required: true }]}>
              <Select options={MASTER.districts.map((d) => ({ label: d.name, value: d.id }))} />
            </Form.Item>
          </div>
          <Form.Item name="address" label="ที่อยู่" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="license"
            label="เลขใบอนุญาตสถานบริการ / ทะเบียนพาณิชย์"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={sending}>
            ส่งให้ทีมตรวจ
          </Button>
        </Form>
      </Card>
    </div>
  );
}
