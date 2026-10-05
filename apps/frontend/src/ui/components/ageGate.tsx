import { Button, Modal, Typography } from 'antd';
import { useState } from 'react';

const KEY = 'nightout-age-confirmed';

function isConfirmed(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** Age Gate 20+ — แสดงครั้งแรกที่เข้าเว็บ */
export function AgeGate() {
  const [open, setOpen] = useState(() => !isConfirmed());
  const [denied, setDenied] = useState(false);

  const confirm = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <Modal
      open={open}
      closable={false}
      keyboard={false}
      mask={{ closable: false }}
      footer={null}
      centered
    >
      {denied ? (
        <Typography.Paragraph className="py-6 text-center">
          ขออภัย NightOut สำหรับผู้ที่มีอายุ 20 ปีขึ้นไปเท่านั้น
        </Typography.Paragraph>
      ) : (
        <div className="py-2 text-center">
          <Typography.Title level={3}>คุณอายุ 20 ปีขึ้นไปหรือไม่?</Typography.Title>
          <Typography.Paragraph type="secondary">
            เว็บไซต์นี้มีข้อมูลเกี่ยวกับสถานบันเทิง · ดื่มไม่ขับ
          </Typography.Paragraph>
          <div className="mt-4 flex justify-center gap-3">
            <Button onClick={() => setDenied(true)}>ยังไม่ถึง</Button>
            <Button type="primary" onClick={confirm}>
              ใช่ ฉันอายุ 20+
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
