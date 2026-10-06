import { App, Alert, Input, Modal, Select, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { moveBooking, useTableOptions, type Booking, type TableOption } from '@/services/data';
import { dateTime } from '@/ui/utils/format';

const keyOf = (o: Pick<TableOption, 'zone_id' | 'table_id'>) => `${o.zone_id}:${o.table_id ?? ''}`;

function optionLabel(o: TableOption, pax: number) {
  const name = o.table_name ? `โต๊ะ ${o.table_name}` : 'ไม่ระบุโต๊ะ';
  const seats = o.seats ? ` · ${o.seats} ที่นั่ง${o.seats < pax ? ' (น้อยกว่าจำนวนคน)' : ''}` : '';
  const state = o.is_current ? ' · ที่นั่งปัจจุบัน' : o.available ? '' : ' · ไม่ว่าง';
  return `${name}${seats}${state}`;
}

/**
 * ย้ายโต๊ะ — เลือกโต๊ะที่ว่างในช่วงเวลาเดียวกัน (DB ตรวจซ้ำอีกชั้น) · ทีมร้านทุกบทบาทใช้ได้
 * ลูกค้าได้แจ้งเตือนว่าย้ายไปโต๊ะไหน
 */
export function MoveTableModal({
  barId,
  booking,
  onClose,
}: {
  barId: string;
  booking: Booking | null;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const options = useTableOptions(barId, booking?.id ?? null);
  const [target, setTarget] = useState<string>();
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const groups = useMemo(() => {
    const byZone = new Map<string, { label: string; options: { value: string; label: string; disabled: boolean }[] }>();
    for (const o of options.data ?? []) {
      const g = byZone.get(o.zone_id) ?? { label: `${o.zone_name} · ว่าง ${o.zone_remaining_pax} คน`, options: [] };
      g.options.push({ value: keyOf(o), label: optionLabel(o, booking?.pax ?? 0), disabled: !o.available || o.is_current });
      byZone.set(o.zone_id, g);
    }
    return [...byZone.values()];
  }, [options.data, booking?.pax]);
  const freeCount = groups.reduce((n, g) => n + g.options.filter((o) => !o.disabled).length, 0);

  const close = () => {
    setTarget(undefined);
    setReason('');
    onClose();
  };

  const submit = async () => {
    const picked = (options.data ?? []).find((o) => keyOf(o) === target);
    if (!booking || !picked) return;
    setSaving(true);
    try {
      const r = await moveBooking(booking.id, picked.zone_id, picked.table_id, reason);
      message.success(`ย้ายไป ${r.zone_name}${r.table_name ? ` · โต๊ะ ${r.table_name}` : ''} แล้ว — แจ้งลูกค้าให้แล้ว`);
      close();
    } catch (e) {
      message.error((e as Error).message);
      void options.refetch();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!booking}
      title="ย้ายโต๊ะ"
      okText="ย้ายโต๊ะ"
      cancelText="ยกเลิก"
      onOk={() => void submit()}
      onCancel={close}
      confirmLoading={saving}
      okButtonProps={{ disabled: !target }}
      mask={{ closable: !saving }}
      destroyOnHidden
    >
      {booking && (
        <div className="space-y-4">
          <Typography.Text type="secondary" className="block text-sm">
            {booking.code} · {booking.userName} · {booking.pax} คน · {dateTime(booking.datetime)}
          </Typography.Text>
          {options.error && <Alert type="error" showIcon title={(options.error as Error).message} />}
          {!options.isLoading && !options.error && freeCount === 0 && (
            <Alert type="warning" showIcon title="ไม่มีโต๊ะว่างในช่วงเวลานี้" />
          )}
          <div>
            <label htmlFor="move-target" className="mb-1.5 block text-sm font-medium">
              ย้ายไปที่
            </label>
            <Select
              id="move-target"
              className="w-full"
              size="large"
              placeholder="เลือกโต๊ะที่ว่าง"
              loading={options.isLoading}
              value={target}
              onChange={setTarget}
              options={groups}
              showSearch={{ optionFilterProp: 'label' }}
            />
          </div>
          <div>
            <label htmlFor="move-reason" className="mb-1.5 block text-sm font-medium">
              เหตุผล (ไม่บังคับ)
            </label>
            <Input
              id="move-reason"
              placeholder="เช่น ลูกค้ามาเพิ่ม · แอร์โต๊ะเดิมเสีย"
              maxLength={200}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
