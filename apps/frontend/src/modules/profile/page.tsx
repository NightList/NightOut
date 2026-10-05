import { ChatCircleDots, SignOut } from '@phosphor-icons/react';
import { MASTER, myPrefs, updateProfile } from '@/services/data';
import { useState } from 'react';
import { App, Avatar, Button, Card, Form, Input, InputNumber, Select } from 'antd';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/services/auth';
import { PageHeader } from '@/ui/components/pageHeader';
import { useDemo } from '@/hooks/useDemo';

export function ProfilePage() {
  useDemo();
  const { user, signOut, reload } = useAuth();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  if (!user) return null;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="โปรไฟล์" />
      <Card>
        <div className="flex items-center gap-4">
          <Avatar size={64} className="!bg-purple">
            {user.displayName.slice(0, 2)}
          </Avatar>
          <div className="flex-1">
            <p className="text-lg font-semibold">{user.displayName}</p>
            <p className="text-muted">
              {user.email} · {user.roleLabel}
            </p>
          </div>
          <Button
            icon={<SignOut />}
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
          >
            ออกจากระบบ
          </Button>
        </div>
        {(user.role === 'MERCHANT' || user.role === 'STAFF') && (
          <Link to="/merchant">
            <Button type="primary" className="mt-4">
              ไปหน้าร้านของฉัน
            </Button>
          </Link>
        )}
      </Card>
      <Card title="ข้อมูลและความชอบ">
        <Form
          layout="vertical"
          initialValues={{
            displayName: user.displayName,
            styles: myPrefs.styleIds,
            districts: myPrefs.districtIds,
            budget: myPrefs.budget,
            pax: myPrefs.pax,
          }}
          onFinish={async (v) => {
            setSaving(true);
            try {
              await updateProfile({
                display_name: v.displayName,
                style_ids: v.styles ?? [],
                district_ids: v.districts ?? [],
                budget_per_person: v.budget ?? null,
                usual_pax: v.pax ?? null,
              });
              await reload();
              message.success('บันทึกแล้ว');
            } catch (e) {
              message.error((e as Error).message);
            } finally {
              setSaving(false);
            }
          }}
        >
          <Form.Item name="displayName" label="ชื่อที่แสดง" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="styles" label="สไตล์ร้านที่ชอบ">
            <Select mode="multiple" options={MASTER.styles.map((st) => ({ label: st.label, value: st.id }))} />
          </Form.Item>
          <div className="grid gap-4 sm:grid-cols-2">
            <Form.Item name="budget" label="งบต่อหัว (บาท)">
              <InputNumber className="!w-full" min={0} step={100} />
            </Form.Item>
            <Form.Item name="pax" label="ไปกันกี่คนปกติ">
              <InputNumber className="!w-full" min={1} max={30} />
            </Form.Item>
          </div>
          <Form.Item name="districts" label="ย่านที่ชอบ">
            <Select mode="multiple" options={MASTER.districts.map((d) => ({ label: d.name, value: d.id }))} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>
            บันทึก
          </Button>
        </Form>
      </Card>
      <Card title="ช่องทางแจ้งเตือน">
        <p className="mb-3 text-sm text-muted">
          รับแจ้งเตือนการจองทาง LINE (ต้องเพิ่มเพื่อน LINE OA และยินยอมก่อน) — ใช้แจ้งเตือนเท่านั้น
          ไม่ได้ใช้เข้าสู่ระบบ
        </p>
        <Button
          icon={<ChatCircleDots />}
          onClick={() => message.info('การแจ้งเตือนทาง LINE กำลังจะเปิดให้ใช้ — ตอนนี้ดูแจ้งเตือนได้ที่กระดิ่งด้านบน')}
        >
          เชื่อม LINE
        </Button>
      </Card>
    </div>
  );
}
