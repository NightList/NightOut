import { Plus, Trash } from '@phosphor-icons/react';
import { type BarPromotion } from '@/services/data';
import { setBarPromotions, setFees } from './api';
import {
  App,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Switch,
  Table,
  Tag,
  TimePicker,
} from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { PageHeader } from '@/ui/components/pageHeader';
import { useMerchantBar } from '@/hooks/useMerchantBar';

const DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

interface PromoForm {
  title: string;
  description: string;
  cutoff?: dayjs.Dayjs | null;
  days?: number[];
}

/**
 * /merchant/promotions — โปรโมชันที่ลูกค้าเลือกได้ตอนจองโต๊ะ
 * เช่น "โปรเบียร์ก่อน 2 ทุ่ม" = ต้องเช็กอินก่อน 20:00 · เลือกวันได้ · เปิด/ปิดได้
 * (ค่าธรรมเนียม SC/VAT ยังอยู่ด้านล่าง ใช้แสดงราคาต่อหัวในหน้าร้าน)
 */
export function MerchantPromotionsPage() {
  const bar = useMerchantBar();
  const { message, modal } = App.useApp();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<PromoForm>();

  const [saving, setSaving] = useState(false);
  const save = async (list: BarPromotion[]) => {
    setSaving(true);
    try {
      const pending = await setBarPromotions(bar.id, list);
      message.success(
        pending
          ? 'บันทึกแล้ว — โปรที่เพิ่ม/แก้ข้อความ รอทีม NightOut ตรวจถ้อยคำก่อนแสดง'
          : 'บันทึกแล้ว',
      );
      return true;
    } catch (e) {
      message.error((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="โปรโมชัน"
        subtitle="ลูกค้าเลือกได้ 1 โปรตอนจองโต๊ะ — ระบบเช็กเวลา/วันให้อัตโนมัติ · โปรใหม่หรือที่แก้ข้อความ ทีม NightOut ตรวจถ้อยคำก่อนแสดง"
        extra={
          <Button type="primary" icon={<Plus />} onClick={() => setOpen(true)}>
            เพิ่มโปร
          </Button>
        }
      />
      <Card>
        <Table
          rowKey="id"
          loading={saving}
          pagination={false}
          dataSource={bar.promotions}
          locale={{ emptyText: 'ยังไม่มีโปรโมชัน' }}
          scroll={{ x: 620 }}
          columns={[
            {
              title: 'โปร',
              render: (_, p) => (
                <div>
                  <p className="font-semibold">
                    {p.title}{' '}
                    {p.moderationStatus === 'PENDING' && <Tag color="gold">รอตรวจถ้อยคำ</Tag>}
                    {p.moderationStatus === 'REJECTED' && <Tag color="red">ไม่ผ่านการตรวจ</Tag>}
                  </p>
                  <p className="text-xs text-muted">{p.description}</p>
                </div>
              ),
            },
            {
              title: 'เงื่อนไข',
              render: (_, p) => (
                <span className="text-sm">
                  {p.cutoffTime ? `เช็กอินก่อน ${p.cutoffTime} น.` : 'ทั้งคืน'}
                  {' · '}
                  {p.days?.length ? p.days.map((d) => DAYS[d]).join(' ') : 'ทุกวัน'}
                </span>
              ),
            },
            {
              title: 'เปิดใช้',
              width: 90,
              render: (_, p) => (
                <Switch
                  checked={p.active}
                  onChange={(v) =>
                    void save(bar.promotions.map((x) => (x.id === p.id ? { ...x, active: v } : x)))
                  }
                />
              ),
            },
            {
              width: 60,
              render: (_, p) => (
                <Button
                  type="text"
                  danger
                  aria-label="ลบ"
                  icon={<Trash />}
                  onClick={() =>
                    modal.confirm({
                      title: `ลบ "${p.title}"?`,
                      okText: 'ลบ',
                      okButtonProps: { danger: true },
                      cancelText: 'ยกเลิก',
                      onOk: () => save(bar.promotions.filter((x) => x.id !== p.id)),
                    })
                  }
                />
              ),
            },
          ]}
        />
        <p className="mt-3 text-xs text-muted">
          ข้อควรระวัง: การโฆษณาส่งเสริมการขายเครื่องดื่มแอลกอฮอล์มีข้อจำกัดตามกฎหมาย
          ควรระบุเป็นสิทธิพิเศษของร้าน ไม่ใช่การลดราคา/แจกฟรีเครื่องดื่มแอลกอฮอล์โดยตรง
        </p>
      </Card>

      <Card title="ค่าธรรมเนียม (แสดงในหน้าร้าน)">
        <Form
          layout="inline"
          initialValues={bar.fees}
          onFinish={async (fees) => {
            try {
              await setFees(bar.id, fees);
              message.success('บันทึกค่าธรรมเนียมแล้ว');
            } catch (e) {
              message.error((e as Error).message);
            }
          }}
          className="gap-y-3"
        >
          <Form.Item name="serviceChargeRate" label="Service charge">
            <InputNumber min={0} max={30} suffix="%" />
          </Form.Item>
          <Form.Item name="vatRate" label="VAT">
            <InputNumber min={0} max={10} suffix="%" />
          </Form.Item>
          <Form.Item name="otherFees" label="ค่าเปิดขวด / ค่าเข้า">
            <InputNumber min={0} suffix="฿" />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            บันทึก
          </Button>
        </Form>
      </Card>

      <Modal
        open={open}
        title="เพิ่มโปรโมชัน"
        okText="เพิ่ม"
        cancelText="ยกเลิก"
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form<PromoForm>
          form={form}
          layout="vertical"
          initialValues={{ days: [] }}
          onFinish={async (v) => {
            const p: BarPromotion = {
              id: `new-${Date.now().toString(36)}`,
              title: v.title.trim(),
              description: v.description?.trim() ?? '',
              cutoffTime: v.cutoff ? v.cutoff.format('HH:mm') : undefined,
              days: v.days?.length ? v.days : undefined,
              active: true,
            };
            if (await save([...bar.promotions, p])) {
              form.resetFields();
              setOpen(false);
            }
          }}
        >
          <Form.Item name="title" label="ชื่อโปร" rules={[{ required: true, max: 60 }]}>
            <Input placeholder="เช่น โปรเบียร์ก่อน 2 ทุ่ม" />
          </Form.Item>
          <Form.Item name="description" label="รายละเอียด" rules={[{ max: 160 }]}>
            <Input.TextArea
              rows={2}
              placeholder="เช่น เบียร์สดราคาพิเศษ เมื่อเช็กอินก่อน 20:00 น."
            />
          </Form.Item>
          <Form.Item name="cutoff" label="ต้องเช็กอินก่อนเวลา (เว้นว่าง = ทั้งคืน)">
            <TimePicker
              format="HH:mm"
              minuteStep={30}
              className="w-full"
              placeholder="เช่น 20:00"
            />
          </Form.Item>
          <Form.Item name="days" label="วันที่ใช้ได้ (ไม่เลือก = ทุกวัน)">
            <Checkbox.Group options={DAYS.map((d, i) => ({ label: d, value: i }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
