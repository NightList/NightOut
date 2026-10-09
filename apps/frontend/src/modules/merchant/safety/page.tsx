import { SealCheck } from '@phosphor-icons/react';
import { SAFETY_LABELS, type SafetyValue } from '@/services/data';
import { setSafety, uploadSafetyProof } from './api';
import { App, Button, Card, Segmented, Upload } from 'antd';
import { PageHeader } from '@/ui/components/pageHeader';
import { useMerchantBar } from '@/hooks/useMerchantBar';

export function MerchantSafetyPage() {
  const bar = useMerchantBar();
  const { message } = App.useApp();
  return (
    <div>
      <PageHeader
        title="ความปลอดภัย"
        subtitle="ข้อมูลที่ร้านแจ้งเองจะแสดงป้าย “ร้านแจ้ง” จนกว่าทีม NightOut จะตรวจหลักฐาน"
      />
      <Card>
        <ul className="divide-y divide-border">
          {bar.safety.map((s) => (
            <li key={s.key} className="flex flex-wrap items-center gap-3 py-3">
              <span className="merchant-safety-label min-w-0 flex-1">{SAFETY_LABELS[s.key]}</span>
              {s.source === 'ADMIN_VERIFIED' && (
                <span className="flex items-center gap-1 text-xs text-gold-text">
                  <SealCheck weight="fill" /> ยืนยันแล้ว
                </span>
              )}
              <Segmented<SafetyValue>
                value={s.value}
                onChange={async (value) => {
                  try {
                    await setSafety(bar.id, s.key, value);
                    message.success('บันทึกแล้ว (รอทีม NightOut ตรวจหลักฐาน)');
                  } catch (e) {
                    message.error((e as Error).message);
                  }
                }}
                options={[
                  { label: 'มี', value: 'YES' },
                  { label: 'ไม่มี', value: 'NO' },
                  { label: 'ไม่ระบุ', value: 'UNKNOWN' },
                ]}
              />
              <Upload
                accept="image/*,application/pdf"
                showUploadList={false}
                beforeUpload={(file) => {
                  if (file.size > 10 * 1024 * 1024) {
                    message.error('ไฟล์ใหญ่เกิน 10MB');
                    return Upload.LIST_IGNORE;
                  }
                  void uploadSafetyProof(bar.id, s.key, file)
                    .then(() => message.success('ส่งหลักฐานแล้ว ทีม NightOut จะตรวจให้'))
                    .catch((e: Error) => message.error(e.message));
                  return false;
                }}
              >
                <Button>แนบหลักฐาน</Button>
              </Upload>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
