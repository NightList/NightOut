import { App, Avatar, Button, Card, Form, Input, Listy, Popconfirm, Select, Tag } from 'antd';
import { useState } from 'react';
import { inviteStaff, removeStaff, useBarTeam } from '@/services/data';
import { useAuth } from '@/services/auth';
import { ListRow } from '@/ui/components/listRow';
import { PageHeader } from '@/ui/components/pageHeader';
import { useMerchantBar } from '@/hooks/useMerchantBar';

const ROLE = {
  OWNER: { label: 'เจ้าของ', color: 'gold' },
  MANAGER: { label: 'ผู้จัดการ', color: 'blue' },
  STAFF: { label: 'พนักงาน', color: 'purple' },
} as const;

/** /merchant/staff — ทีมร้านจาก bar_staff · เชิญด้วยอีเมลของบัญชีที่สมัคร NightOut แล้ว */
export function MerchantStaffPage() {
  const bar = useMerchantBar();
  const { user } = useAuth();
  const { message } = App.useApp();
  const team = useBarTeam(bar.id);
  const [form] = Form.useForm<{ email: string; role: 'MANAGER' | 'STAFF' }>();
  const [sending, setSending] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="พนักงาน"
        subtitle="พนักงานเห็นเฉพาะหน้า คืนนี้ และ การจอง · ผู้จัดการแก้ข้อมูลร้านได้"
      />
      <Card title="เชิญเข้าทีมทางอีเมล">
        <p className="mb-3 text-sm text-muted">
          ให้พนักงานสมัคร NightOut ด้วยอีเมลนี้ก่อน แล้วเปิดลิงก์ <code>/accept-invite</code>{' '}
          (หรือกดจากแจ้งเตือน) เพื่อตอบรับ
        </p>
        <Form
          form={form}
          layout="inline"
          initialValues={{ role: 'STAFF' }}
          className="gap-y-3"
          onFinish={async ({ email, role }) => {
            setSending(true);
            try {
              await inviteStaff(bar.id, email, role);
              message.success(`ส่งคำเชิญถึง ${email} แล้ว`);
              form.resetFields();
              void team.refetch();
            } catch (e) {
              message.error((e as Error).message);
            } finally {
              setSending(false);
            }
          }}
        >
          <Form.Item
            name="email"
            rules={[{ required: true, type: 'email', message: 'กรอกอีเมลให้ถูกต้อง' }]}
          >
            <Input placeholder="staff@example.com" className="w-full sm:!w-64" />
          </Form.Item>
          <Form.Item name="role">
            <Select
              className="w-full sm:!w-36"
              options={[
                { value: 'STAFF', label: 'พนักงาน' },
                { value: 'MANAGER', label: 'ผู้จัดการ' },
              ]}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={sending}>
            ส่งคำเชิญ
          </Button>
        </Form>
      </Card>
      <Card title="สมาชิก" loading={team.isLoading}>
        <Listy
          items={team.data ?? []}
          rowKey="user_id"
          itemRender={(m) => (
            <ListRow
              actions={
                <>
                  <Tag color={ROLE[m.role].color}>{ROLE[m.role].label}</Tag>
                  {!m.accepted_at && <Tag>รอตอบรับ</Tag>}
                  {m.user_id !== user?.id && (m.role !== 'OWNER' || bar.staffRole === 'OWNER') && (
                    <Popconfirm
                      title={`นำ ${m.display_name} ออกจากทีม?`}
                      okText="นำออก"
                      cancelText="ยกเลิก"
                      okButtonProps={{ danger: true }}
                      onConfirm={async () => {
                        try {
                          await removeStaff(bar.id, m.user_id);
                          message.success('นำออกจากทีมแล้ว');
                          void team.refetch();
                        } catch (e) {
                          message.error((e as Error).message);
                        }
                      }}
                    >
                      <Button danger>นำออก</Button>
                    </Popconfirm>
                  )}
                </>
              }
              avatar={<Avatar>{m.display_name.slice(0, 2)}</Avatar>}
              title={m.display_name}
              description={m.email}
            />
          )}
        />
      </Card>
    </div>
  );
}
