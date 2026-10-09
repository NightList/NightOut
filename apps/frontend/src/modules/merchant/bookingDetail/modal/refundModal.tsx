import { App, Alert, Input, Modal, Tag, Typography } from 'antd';
import { useState } from 'react';
import { type Booking } from '@/services/data';
import { refundDeposit } from '../api';
import { baht } from '@/ui/utils/format';

const QUICK_REASONS = ['ไม่มีโต๊ะให้ลูกค้า', 'ร้านปิดกะทันหัน', 'ลูกค้ามาแล้วแต่ร้านรับไม่ได้', 'ร้านยกเลิกเอง'];

/** มัดจำที่ร้านอนุมัติคืนได้: ตรวจสลิปแล้ว และยังไม่โอนให้ร้าน */
export const canRefund = (b: Booking) =>
  b.deposit?.status === 'VERIFIED' && (b.deposit.settlement === 'HELD' || b.deposit.settlement === 'PAYOUT_PENDING');

/**
 * ยืนยันการคืนเงินมัดจำ — ร้านอนุมัติ → NightOut โอนคืนลูกค้า (เงินอยู่ที่ NightOut ร้านไม่ต้องโอนเอง)
 * การจองที่ยังไม่เช็กอินจะถูกยกเลิกฝั่งร้านและปล่อยโต๊ะ · ทีมร้านทุกบทบาทใช้ได้
 */
export function RefundModal({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  const { message } = App.useApp();
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const cancels = booking?.status === 'CONFIRMED' || booking?.status === 'PENDING';
  const valid = reason.trim().length >= 3;

  const close = () => {
    setReason('');
    onClose();
  };

  const submit = async () => {
    if (!booking || !valid) return;
    setSaving(true);
    try {
      const r = await refundDeposit(booking.id, reason);
      message.success(`ยืนยันคืนมัดจำ ${baht(r.amount)} แล้ว — NightOut จะโอนคืนลูกค้า`);
      close();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!booking}
      title="ยืนยันการคืนเงินมัดจำ"
      okText={booking?.deposit ? `ยืนยันคืน ${baht(booking.deposit.amount)}` : 'ยืนยันคืนเงิน'}
      cancelText="ยกเลิก"
      onOk={() => void submit()}
      onCancel={close}
      confirmLoading={saving}
      okButtonProps={{ danger: true, disabled: !valid }}
      mask={{ closable: !saving }}
      destroyOnHidden
    >
      {booking && (
        <div className="space-y-4">
          <Typography.Text type="secondary" className="block text-sm">
            {booking.code} · {booking.userName} · {booking.pax} คน
          </Typography.Text>
          <Alert
            type="warning"
            showIcon
            title={cancels ? 'การจองนี้จะถูกยกเลิกและปล่อยโต๊ะ' : 'สถานะการจองคงเดิม'}
            description={`มัดจำ ${baht(booking.deposit?.amount ?? 0)} จะไม่ถูกโอนให้ร้าน NightOut จะโอนคืนลูกค้าโดยตรง และแจ้งลูกค้าให้ทันที · ทำแล้วย้อนกลับไม่ได้`}
          />
          <div>
            <label htmlFor="refund-reason" className="mb-1.5 block text-sm font-medium">
              เหตุผลที่คืนเงิน
            </label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {QUICK_REASONS.map((r) => (
                <Tag.CheckableTag key={r} checked={reason === r} onChange={() => setReason(r)}>
                  {r}
                </Tag.CheckableTag>
              ))}
            </div>
            <Input.TextArea
              id="refund-reason"
              rows={2}
              maxLength={300}
              placeholder="อธิบายสั้น ๆ ให้ทีม NightOut เข้าใจเคสนี้"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
