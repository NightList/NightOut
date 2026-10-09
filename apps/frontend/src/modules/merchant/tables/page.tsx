import { Plus, Trash } from '@phosphor-icons/react';
import { type Bar } from '@/services/data';
import { setZones } from './api';
import { App, Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Tag } from 'antd';
import { useState } from 'react';
import { PageHeader } from '@/ui/components/pageHeader';
import { useMerchantBar } from '@/hooks/useMerchantBar';

type Zone = Bar['zones'][number];
interface NewZone {
  name: string;
  tables: number;
  seats: number;
  duration: number;
}

/** /merchant/tables — โซน/โต๊ะ (DB กันจองซ้อนเวลาต่อโต๊ะ + นับความจุโซน) */
export function MerchantTablesPage() {
  const bar = useMerchantBar();
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<NewZone>();

  const save = async (zones: Zone[], done: string) => {
    setSaving(true);
    try {
      await setZones(bar.id, zones);
      message.success(done);
      return true;
    } catch (e) {
      message.error((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  };
  const nextName = (z: Zone) => {
    const prefix = z.tables[0]?.name.replace(/\d+$/, '') || z.name.slice(0, 1).toUpperCase();
    let n = z.tables.length + 1;
    while (z.tables.some((t) => t.name === `${prefix}${n}`)) n++;
    return `${prefix}${n}`;
  };
  const addTable = (z: Zone) =>
    save(
      bar.zones.map((x) =>
        x.id === z.id ? { ...x, tables: [...x.tables, { id: '', name: nextName(x), seats: 4 }], capacityPax: x.capacityPax + 4 } : x,
      ),
      `เพิ่มโต๊ะใน ${z.name} แล้ว`,
    );
  const removeTable = (z: Zone, tableId: string) => {
    const t = z.tables.find((x) => x.id === tableId);
    return save(
      bar.zones.map((x) =>
        x.id === z.id ? { ...x, tables: x.tables.filter((y) => y.id !== tableId), capacityPax: Math.max(1, x.capacityPax - (t?.seats ?? 0)) } : x,
      ),
      'ปิดใช้โต๊ะแล้ว (การจองเดิมยังอยู่)',
    );
  };

  return (
    <div>
      <PageHeader
        title="โซน / โต๊ะ"
        subtitle="ระบบกันจองซ้อนจากช่วงเวลาจองต่อโต๊ะ และนับคนไม่ให้เกินความจุโซน"
        extra={
          <Button type="primary" icon={<Plus />} onClick={() => setOpen(true)}>
            เพิ่มโซน
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {bar.zones.map((z) => (
          <Card
            key={z.id}
            title={z.name}
            extra={
              <Button icon={<Plus />} loading={saving} onClick={() => void addTable(z)}>
                โต๊ะ
              </Button>
            }
          >
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>ความจุ</span>
              <InputNumber
                min={1}
                max={2000}
                defaultValue={z.capacityPax}
                suffix="คน"
                aria-label={`ความจุ ${z.name}`}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v && v !== z.capacityPax)
                    void save(bar.zones.map((x) => (x.id === z.id ? { ...x, capacityPax: v } : x)), 'บันทึกความจุแล้ว');
                }}
              />
              <span>จองนาน</span>
              <InputNumber
                min={60}
                max={480}
                step={30}
                defaultValue={z.defaultDurationMinutes}
                suffix="นาที"
                aria-label={`เวลาจองของ ${z.name}`}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v && v !== z.defaultDurationMinutes)
                    void save(bar.zones.map((x) => (x.id === z.id ? { ...x, defaultDurationMinutes: v } : x)), 'บันทึกเวลาจองแล้ว');
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {z.tables.length === 0 && <span className="text-sm text-muted">ยังไม่มีโต๊ะ — ลูกค้าจองเป็นโซน</span>}
              {z.tables.map((t) => (
                <Tag key={t.id} className="!inline-flex !items-center !gap-1 !px-3 !py-1">
                  {t.name} · {t.seats} ที่
                  <Popconfirm
                    title={`ปิดใช้โต๊ะ ${t.name}?`}
                    okText="ปิดใช้"
                    cancelText="ยกเลิก"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => removeTable(z, t.id)}
                  >
                    <button type="button" aria-label={`ปิดใช้โต๊ะ ${t.name}`} className="text-muted hover:text-(--crowd-full)">
                      <Trash size={12} />
                    </button>
                  </Popconfirm>
                </Tag>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Modal
        open={open}
        title="เพิ่มโซน"
        okText="เพิ่ม"
        cancelText="ยกเลิก"
        confirmLoading={saving}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form<NewZone>
          form={form}
          layout="vertical"
          initialValues={{ tables: 4, seats: 4, duration: 180 }}
          onFinish={async (v) => {
            const prefix = v.name.trim().slice(0, 1).toUpperCase();
            const zone: Zone = {
              id: '',
              name: v.name.trim(),
              capacityPax: v.tables * v.seats,
              defaultDurationMinutes: v.duration,
              tables: Array.from({ length: v.tables }, (_, i) => ({ id: '', name: `${prefix}${i + 1}`, seats: v.seats })),
            };
            if (await save([...bar.zones, zone], `เพิ่มโซน ${zone.name} แล้ว`)) {
              form.resetFields();
              setOpen(false);
            }
          }}
        >
          <Form.Item name="name" label="ชื่อโซน" rules={[{ required: true, max: 60 }]}>
            <Input placeholder="เช่น Rooftop, หน้าเวที" />
          </Form.Item>
          <div className="grid gap-4 sm:grid-cols-3">
            <Form.Item name="tables" label="จำนวนโต๊ะ">
              <InputNumber className="!w-full" min={0} max={100} />
            </Form.Item>
            <Form.Item name="seats" label="ที่นั่ง/โต๊ะ">
              <InputNumber className="!w-full" min={1} max={50} />
            </Form.Item>
            <Form.Item name="duration" label="จองนาน (นาที)">
              <InputNumber className="!w-full" min={60} max={480} step={30} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
