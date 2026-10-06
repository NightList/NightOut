import type { ThemeMode } from '@nightout/types';
import { useThemeMode } from '@nightout/ui';
import { App, Button, Card, Segmented } from 'antd';
import { useNavigate } from 'react-router';
import { useAuth } from '@/services/auth';
import { deleteAccount } from '@/services/data';
import { PageHeader } from '@/ui/components/pageHeader';

export function SettingsPage() {
  const { mode, setMode } = useThemeMode();
  const { signOut } = useAuth();
  const { modal, message } = App.useApp();
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="ตั้งค่า" />
      <Card title="ธีม">
        <Segmented<ThemeMode>
          value={mode}
          onChange={setMode}
          options={[
            { label: '🌙 มืด', value: 'DARK' },
            { label: '☀️ สว่าง', value: 'LIGHT' },
            { label: '💻 ตามระบบ', value: 'SYSTEM' },
          ]}
        />
        <p className="mt-3 text-sm text-muted">
          การลดการเคลื่อนไหว (motion) ใช้ตามการตั้งค่าของอุปกรณ์
        </p>
      </Card>
      <Card title="ความเป็นส่วนตัว">
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={async () => {
              await signOut();
              message.success('ออกจากระบบทุกอุปกรณ์แล้ว');
              navigate('/');
            }}
          >
            ออกจากระบบทุกอุปกรณ์
          </Button>
          <Button
            danger
            onClick={() =>
              modal.confirm({
                title: 'ลบบัญชี?',
                content:
                  'บัญชีจะถูกปิดทันทีและเข้าสู่ระบบไม่ได้อีก ข้อมูลส่วนตัวถูกล้างตามนโยบายความเป็นส่วนตัว (ประวัติการจองเก็บแบบไม่ระบุตัวตน)',
                okText: 'ลบบัญชี',
                okButtonProps: { danger: true },
                cancelText: 'ยกเลิก',
                onOk: async () => {
                  try {
                    await deleteAccount();
                    await signOut().catch(() => undefined);
                    message.success('ลบบัญชีแล้ว');
                    navigate('/');
                  } catch (e) {
                    message.error((e as Error).message);
                  }
                },
              })
            }
          >
            ลบบัญชี
          </Button>
        </div>
      </Card>
    </div>
  );
}
