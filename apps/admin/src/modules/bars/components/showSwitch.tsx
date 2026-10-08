import type { Db } from '@nightout/types';
import { Input, Popconfirm, Switch } from 'antd';
import { useState } from 'react';
import { useAdminAction } from '@/services/adminData';
import { barStatusAction } from '../api';

/**
 * สวิตช์ "แสดง" ของร้าน — เปิด = APPROVED (ขึ้นเว็บ) · ปิด = SUSPENDED (ซ่อน)
 * ปิดต้องใส่เหตุผลก่อน (ร้านเห็นข้อความนี้ และลง audit log) · ใช้กับร้านที่แสดง/ระงับอยู่เท่านั้น
 * (ร่าง / รอตรวจ / ไม่อนุมัติ จัดการที่หน้า /merchants)
 */
export function ShowSwitch({ bar }: { bar: Pick<Db.AdminBar, 'id' | 'name' | 'status'> }) {
  const act = useAdminAction();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const shown = bar.status === 'APPROVED';
  const pending = act.isPending && act.variables?.path === `bars/${bar.id}/status`;

  const show = () =>
    act.mutate({
      ...barStatusAction(bar.id, { status: 'APPROVED' }),
      success: `แสดง ${bar.name} แล้ว`,
    });
  const hide = () => {
    act.mutate({
      ...barStatusAction(bar.id, { status: 'SUSPENDED', reason: reason.trim() }),
      success: `ซ่อน ${bar.name} แล้ว`,
    });
    setOpen(false);
    setReason('');
  };

  return (
    <Popconfirm
      open={open}
      onOpenChange={(v) => !v && setOpen(false)}
      title={`ซ่อน ${bar.name}? ร้านจะหายจากเว็บทันที`}
      description={
        <Input.TextArea
          className="!mt-2 !w-64"
          rows={2}
          maxLength={500}
          placeholder="เหตุผล (ร้านจะเห็นข้อความนี้)…"
          aria-label="เหตุผลที่ซ่อนร้าน"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      }
      okText="ซ่อนร้าน"
      cancelText="ยกเลิก"
      okButtonProps={{ danger: true, disabled: !reason.trim() }}
      onConfirm={hide}
    >
      <Switch
        checked={shown}
        loading={pending}
        aria-label={`แสดง ${bar.name} บนเว็บ`}
        onChange={(next) => (next ? show() : setOpen(true))}
      />
    </Popconfirm>
  );
}
