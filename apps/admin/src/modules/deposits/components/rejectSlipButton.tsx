import { DEPOSIT_REJECT_REASONS, type DepositRejectCode } from '@nightout/utils';
import { Alert, Button, Input, Popconfirm, Select, Typography } from 'antd';
import { useState } from 'react';

/**
 * ปฏิเสธสลิปพร้อมเหตุผล (dropdown) — ลูกค้าเห็นเหตุผลในหน้าโอนมัดจำ
 * "สลิปปลอม" ติดธงที่ลูกค้า: ครบ 2 ครั้ง ระบบแบนบัญชีและเบอร์โทรที่บัญชีนั้นเคยใช้ทันที
 */
export function RejectSlipButton({
  fakeSlipCount,
  loading,
  onReject,
}: {
  /** ธงสลิปปลอมที่ลูกค้ามีอยู่แล้ว */
  fakeSlipCount: number;
  loading?: boolean;
  onReject: (code: DepositRejectCode, note: string) => void;
}) {
  const [code, setCode] = useState<DepositRejectCode>();
  const [note, setNote] = useState('');
  const needsNote = code === 'OTHER';
  const valid = !!code && (!needsNote || note.trim().length > 0);
  const willBan = code === 'FAKE_SLIP' && fakeSlipCount + 1 >= 2;

  const reset = () => {
    setCode(undefined);
    setNote('');
  };

  return (
    <Popconfirm
      title="สลิปไม่ผ่าน — ลูกค้าต้องส่งสลิปใหม่"
      icon={null}
      description={
        <div className="mt-2 w-72 space-y-2">
          <Select<DepositRejectCode>
            className="w-full"
            placeholder="เลือกเหตุผล"
            aria-label="เหตุผลที่ปฏิเสธสลิป"
            value={code}
            onChange={setCode}
            options={DEPOSIT_REJECT_REASONS.map((r) => ({ value: r.code, label: r.label }))}
          />
          {code === 'FAKE_SLIP' && (
            <Alert
              type={willBan ? 'error' : 'warning'}
              showIcon
              title={
                willBan
                  ? 'ครั้งนี้ครบ 2 ครั้ง — แบนบัญชีและเบอร์โทรของลูกค้าทันที'
                  : 'ติดธงสลิปปลอมครั้งที่ 1 (ครบ 2 ครั้งจะแบนบัญชีและเบอร์โทร)'
              }
            />
          )}
          <Input.TextArea
            rows={2}
            maxLength={500}
            placeholder={needsNote ? 'ระบุเหตุผล (ลูกค้าจะเห็นข้อความนี้)' : 'รายละเอียดเพิ่มเติม (ไม่บังคับ)'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Typography.Text type="secondary" className="block text-xs">
            ลูกค้าเห็นเหตุผลนี้ในหน้าโอนมัดจำ
          </Typography.Text>
        </div>
      }
      okText={willBan ? 'ไม่ผ่าน + แบน' : 'ไม่ผ่าน'}
      cancelText="ยกเลิก"
      okButtonProps={{ danger: true, disabled: !valid }}
      onCancel={reset}
      onConfirm={() => {
        if (!code) return;
        onReject(code, note.trim());
        reset();
      }}
    >
      <Button danger loading={loading}>
        ไม่ผ่าน
      </Button>
    </Popconfirm>
  );
}
