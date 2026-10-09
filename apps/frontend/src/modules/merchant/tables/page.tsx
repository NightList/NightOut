import { Info, Plus } from '@phosphor-icons/react';
import { App, Empty, Form, Input, InputNumber, Modal, Popconfirm } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router';
import { type Bar } from '@/services/data';
import { useMerchantBar } from '@/hooks/useMerchantBar';
import { Tile } from '@/ui/components/merchantUi';
import { baht } from '@/ui/utils/format';
import { setZones } from './api';

type Zone = Bar['zones'][number];
interface NewZone {
  name: string;
  tables: number;
  seats: number;
  duration: number;
}

const hoursLabel = (min: number) => `${(min / 60).toLocaleString('th-TH', { maximumFractionDigits: 1 })} ชม.`;

/** /merchant/tables — การ์ดโซนละใบ: ความจุ · ระยะเวลาจอง · มัดจำ · โต๊ะ (DB กันจองซ้อนเวลาต่อโต๊ะ + นับความจุโซน) */
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
  const update = (z: Zone, p: Partial<Zone>, done: string) =>
    save(bar.zones.map((x) => (x.id === z.id ? { ...x, ...p } : x)), done);
  const nextName = (z: Zone) => {
    const prefix = z.tables[0]?.name.replace(/\d+$/, '') || z.name.slice(0, 1).toUpperCase();
    let n = z.tables.length + 1;
    while (z.tables.some((t) => t.name === `${prefix}${n}`)) n++;
    return `${prefix}${n}`;
  };
  const addTable = (z: Zone) =>
    update(z, { tables: [...z.tables, { id: '', name: nextName(z), seats: 4 }], capacityPax: z.capacityPax + 4 }, `เพิ่มโต๊ะใน ${z.name} แล้ว`);
  const removeTable = (z: Zone, tableId: string) => {
    const t = z.tables.find((x) => x.id === tableId);
    return update(
      z,
      { tables: z.tables.filter((y) => y.id !== tableId), capacityPax: Math.max(1, z.capacityPax - (t?.seats ?? 0)) },
      'ปิดใช้โต๊ะแล้ว (การจองเดิมยังอยู่)',
    );
  };

  const tableCount = bar.zones.reduce((a, z) => a + z.tables.length, 0);
  const pax = bar.zones.reduce((a, z) => a + z.capacityPax, 0);
  const deposit = bar.deposit.amount > 0 ? `${baht(bar.deposit.amount)}/${bar.deposit.unit === 'PER_PERSON' ? 'คน' : 'โต๊ะ'}` : 'ไม่มี';

  /** ช่องสถิติแก้ได้ในที่ (บันทึกตอนออกจากช่อง) */
  const statInput = (label: string, value: number, suffix: string, min: number, max: number, step: number, onSave: (v: number) => void) => (
    <label className="flex min-w-0 flex-col gap-0.5 rounded-xl bg-surface p-2.5">
      <span className="text-[11px] text-muted">{label}</span>
      <InputNumber
        variant="borderless"
        size="small"
        min={min}
        max={max}
        step={step}
        defaultValue={value}
        suffix={<span className="text-xs text-muted">{suffix}</span>}
        className="!w-full !p-0 [&_input]:!p-0 [&_input]:!text-base [&_input]:!font-bold"
        aria-label={label}
        onBlur={(e) => {
          const v = Number(e.target.value);
          if (v && v !== value) onSave(v);
        }}
      />
    </label>
  );

  const tableButton = (z: Zone, t: Zone['tables'][number], compact: boolean) => (
    <Popconfirm
      key={t.id}
      title={`ปิดใช้โต๊ะ ${t.name}?`}
      description="การจองเดิมยังอยู่ · ลูกค้าจองโต๊ะนี้ใหม่ไม่ได้"
      okText="ปิดใช้"
      cancelText="ยกเลิก"
      okButtonProps={{ danger: true }}
      onConfirm={() => removeTable(z, t.id)}
    >
      <button
        type="button"
        aria-label={`โต๊ะ ${t.name} ${t.seats} ที่ — กดเพื่อปิดใช้`}
        className={`merchant-pill flex flex-col items-center justify-center border border-border bg-surface hover:border-(--crowd-full) ${
          compact ? 'h-11 rounded-[10px] text-xs' : 'h-14 rounded-[14px]'
        }`}
      >
        <b className={compact ? '' : 'text-[15px]'}>{t.name}</b>
        <span className={`${compact ? 'text-[10px]' : 'text-[11px]'} text-muted`}>
          {t.seats}
          {compact ? '' : ' ที่'}
        </span>
      </button>
    </Popconfirm>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[17px] font-bold lg:font-display lg:text-[30px]">โซน / โต๊ะ</h1>
          <p className="mt-1 text-xs text-muted lg:text-sm">
            {bar.zones.length} โซน · {tableCount} โต๊ะ · รับได้ {pax} คน
            <span className="hidden lg:inline"> · ระบบกันจองซ้อนตามระยะเวลาจอง</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="merchant-pill hidden h-10 items-center gap-2 rounded-xl bg-gold px-[18px] text-sm font-semibold text-on-gold lg:inline-flex"
        >
          <Plus /> เพิ่มโซน
        </button>
        <button type="button" aria-label="เพิ่มโซน" onClick={() => setOpen(true)} className="grid size-10 place-items-center text-xl text-gold lg:hidden">
          <Plus />
        </button>
      </div>

      {bar.zones.length === 0 ? (
        <Tile>
          <Empty description="ยังไม่มีโซน — ต้องมีอย่างน้อย 1 โซนเพื่อรับจอง" />
        </Tile>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden gap-4 lg:grid lg:grid-cols-3">
            {bar.zones.map((z) => (
              <Tile key={z.id} className="flex flex-col gap-3.5">
                <b className="text-lg font-semibold">{z.name}</b>
                <div className="grid grid-cols-3 gap-2">
                  {statInput('ความจุรวม', z.capacityPax, 'คน', 1, 2000, 1, (v) => void update(z, { capacityPax: v }, 'บันทึกความจุแล้ว'))}
                  {statInput('ระยะเวลาจอง', z.defaultDurationMinutes, 'นาที', 60, 480, 30, (v) =>
                    void update(z, { defaultDurationMinutes: v }, 'บันทึกเวลาจองแล้ว'),
                  )}
                  <span className="flex min-w-0 flex-col gap-0.5 rounded-xl bg-surface p-2.5">
                    <span className="text-[11px] text-muted">มัดจำ</span>
                    <b className="truncate text-base text-gold-text">{deposit}</b>
                  </span>
                </div>
                <span className="text-[13px] text-muted">
                  โต๊ะ ({z.tables.length}) · {hoursLabel(z.defaultDurationMinutes)} ต่อรอบ
                </span>
                {z.tables.length === 0 ? (
                  <span className="text-sm text-muted">ยังไม่มีโต๊ะ — ลูกค้าจองเป็นโซน</span>
                ) : (
                  <div className="grid grid-cols-3 gap-2">{z.tables.map((t) => tableButton(z, t, false))}</div>
                )}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void addTable(z)}
                  className="merchant-pill mt-auto flex h-10 items-center justify-center gap-1.5 rounded-xl border border-dashed border-muted/60 text-sm text-muted hover:border-gold hover:text-text disabled:opacity-50"
                >
                  <Plus /> เพิ่มโต๊ะ
                </button>
              </Tile>
            ))}
          </div>

          {/* มือถือ */}
          <div className="flex flex-col gap-3 lg:hidden">
            {bar.zones.map((z) => (
              <Tile key={z.id} className="flex flex-col gap-2.5 !rounded-[18px] !p-3.5">
                <span className="flex items-center justify-between gap-2">
                  <b className="text-base font-semibold">{z.name}</b>
                  <span className="text-xs text-muted">
                    {z.tables.length} โต๊ะ · {z.capacityPax} คน · {hoursLabel(z.defaultDurationMinutes)}
                  </span>
                </span>
                <div className="grid grid-cols-6 gap-1.5">
                  {z.tables.map((t) => tableButton(z, t, true))}
                  <button
                    type="button"
                    aria-label={`เพิ่มโต๊ะใน ${z.name}`}
                    disabled={saving}
                    onClick={() => void addTable(z)}
                    className="grid h-11 place-items-center rounded-[10px] border border-dashed border-muted/60 text-muted"
                  >
                    <Plus />
                  </button>
                </div>
              </Tile>
            ))}
          </div>
        </>
      )}

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-[18px] py-3.5 text-sm text-muted">
        <Info size={18} className="shrink-0 text-link" />
        <span className="flex-1">
          ลูกค้าเลือกได้ทั้งโซนหรือโต๊ะ · ถ้าไม่มาเช็กอินเกิน grace period ({bar.gracePeriodMinutes} นาที) ระบบยกเลิกโต๊ะอัตโนมัติ
        </span>
        <Link to="/merchant/settings" className="hidden shrink-0 lg:inline">
          ตั้งค่าการจอง →
        </Link>
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
