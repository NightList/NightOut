import { CheckCircle } from '@phosphor-icons/react';
import { Alert, Button, DatePicker, Form, Input, Modal, Radio, Result, Select, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { useAdminAction } from '@/services/adminData';
import { useBars, useAccountRoles, createUserAction } from '../api';

/** ประเภทบัญชี (ตรงกับ backend ACCOUNT_TYPES) → ชั้นบัญชี · แบบที่มี bar ต้องเลือกร้าน */
const ACCOUNT_TYPES = [
  { value: 'CUSTOMER', role: 'CUSTOMER', label: 'ลูกค้า', hint: 'จองโต๊ะ รีวิว ร้านโปรด' },
  { value: 'OWNER', role: 'MERCHANT', label: 'เจ้าของร้าน', hint: 'จัดการร้านได้ทั้งหมด รวมบัญชีรับเงิน', bar: true },
  { value: 'MANAGER', role: 'MERCHANT', label: 'ผู้จัดการร้าน', hint: 'จัดการร้านได้ ยกเว้นบัญชีรับเงิน', bar: true },
  { value: 'STAFF', role: 'STAFF', label: 'พนักงานร้าน', hint: 'ดูการจอง เช็กอิน อัปเดตความแน่น', bar: true },
  { value: 'ADMIN', role: 'ADMIN', label: 'แอดมิน', hint: 'เข้า Backoffice ได้ แต่แก้ชั้นบัญชีไม่ได้ (ตั้ง MFA ตอนเข้าครั้งแรก)' },
  {
    value: 'SUPER_ADMIN',
    role: 'SUPER_ADMIN',
    label: 'ซูเปอร์แอดมิน',
    hint: 'ทำได้ทุกอย่างของแอดมิน และแก้ชั้นบัญชีของทุกคน (ตั้ง MFA ตอนเข้าครั้งแรก)',
  },
] as const;
type AccountType = (typeof ACCOUNT_TYPES)[number]['value'];

interface Values {
  email: string;
  display_name: string;
  account_type: AccountType;
  bar_id?: string;
  birthdate: Dayjs;
  password_mode: 'random' | 'manual';
  password?: string;
}

interface Created {
  email: string;
  display_name: string;
  password: string | null;
}

const ADULT = () => dayjs().subtract(20, 'year');
const needsBar = (t?: AccountType) => ACCOUNT_TYPES.some((a) => a.value === t && 'bar' in a);

/**
 * เพิ่มผู้ใช้ — บัญชียืนยันอีเมลแล้ว เข้าสู่ระบบได้ทันที (POST /admin/users)
 * รหัสที่ระบบสุ่มแสดงครั้งเดียวหลังสร้าง ให้แอดมินส่งต่อเจ้าของบัญชีเอง
 */
export function CreateUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form] = Form.useForm<Values>();
  const act = useAdminAction();
  const [created, setCreated] = useState<Created | null>(null);
  const type = Form.useWatch('account_type', form);
  const passwordMode = Form.useWatch('password_mode', form);
  const barId = Form.useWatch('bar_id', form);
  const bars = useBars();
  const roles = useAccountRoles();
  const typeOptions = useMemo(() => {
    const creatable = new Set((roles.data ?? []).filter((r) => r.can_create).map((r) => r.code));
    return ACCOUNT_TYPES.filter((a) => creatable.has(a.role)).map((a) => ({
      value: a.value,
      label: a.label,
      hint: a.hint,
    }));
  }, [roles.data]);

  const barOptions = useMemo(
    () => (bars.data ?? []).map((b) => ({ value: b.id, label: b.name, owner: b.owner?.display_name ?? null })),
    [bars.data],
  );
  const currentOwner = type === 'OWNER' ? barOptions.find((b) => b.value === barId)?.owner : null;

  const close = () => {
    setCreated(null);
    form.resetFields();
    onClose();
  };

  const submit = async () => {
    let v: Values;
    try {
      v = await form.validateFields();
    } catch {
      return;
    }
    try {
      const r = await act.mutateAsync({
        ...createUserAction({
          email: v.email.trim(),
          display_name: v.display_name.trim(),
          account_type: v.account_type,
          bar_id: needsBar(v.account_type) ? v.bar_id : null,
          birthdate: v.birthdate.format('YYYY-MM-DD'),
          password: v.password_mode === 'manual' ? v.password : undefined,
        }),
        success: `สร้างบัญชี ${v.email.trim()} แล้ว`,
      });
      const res = r as { email: string; display_name: string; password: string | null };
      setCreated({ email: res.email, display_name: res.display_name, password: res.password });
    } catch {
      // useAdminAction แจ้งเหตุผลแล้ว — เปิดฟอร์มค้างไว้ให้แก้
    }
  };

  return (
    <Modal
      open={open}
      onCancel={close}
      title={created ? null : 'เพิ่มผู้ใช้'}
      width={560}
      destroyOnHidden
      mask={{ closable: !act.isPending && !created }}
      footer={
        created ? (
          <Button type="primary" onClick={close}>
            เสร็จแล้ว
          </Button>
        ) : (
          <>
            <Button onClick={close}>ยกเลิก</Button>
            <Button type="primary" loading={act.isPending} onClick={() => void submit()}>
              สร้างบัญชี
            </Button>
          </>
        )
      }
    >
      {created ? (
        <Result
          status="success"
          icon={<CheckCircle size={56} weight="duotone" className="mx-auto text-gold" />}
          title={`สร้างบัญชี ${created.display_name} แล้ว`}
          subTitle="ยืนยันอีเมลให้แล้ว เข้าสู่ระบบได้ทันที"
          extra={
            <div className="mx-auto max-w-sm space-y-2 text-left">
              <div>
                <Typography.Text type="secondary">อีเมล</Typography.Text>
                <Typography.Paragraph copyable className="!mb-0 font-medium">
                  {created.email}
                </Typography.Paragraph>
              </div>
              {created.password ? (
                <>
                  <div>
                    <Typography.Text type="secondary">รหัสผ่านชั่วคราว</Typography.Text>
                    <Typography.Paragraph copyable className="!mb-0 font-mono text-base">
                      {created.password}
                    </Typography.Paragraph>
                  </div>
                  <Alert
                    type="warning"
                    showIcon
                    title="รหัสนี้แสดงครั้งเดียว"
                    description="คัดลอกแล้วส่งให้เจ้าของบัญชีทางช่องทางส่วนตัว แนะนำให้เปลี่ยนรหัสหลังเข้าครั้งแรก (ลืมรหัสผ่าน → ตั้งใหม่)"
                  />
                </>
              ) : (
                <Typography.Text type="secondary">ใช้รหัสผ่านที่คุณตั้งไว้</Typography.Text>
              )}
            </div>
          }
        />
      ) : (
        <Form<Values>
          form={form}
          layout="vertical"
          disabled={act.isPending}
          initialValues={{ account_type: 'CUSTOMER', password_mode: 'random' }}
        >
          <Form.Item
            name="email"
            label="อีเมล"
            rules={[
              { required: true, message: 'กรอกอีเมล' },
              { type: 'email', message: 'อีเมลไม่ถูกต้อง' },
            ]}
          >
            <Input placeholder="name@example.com" inputMode="email" autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="display_name"
            label="ชื่อที่แสดง"
            rules={[{ required: true, whitespace: true, message: 'กรอกชื่อที่แสดง' }, { max: 60 }]}
          >
            <Input placeholder="ชื่อที่เห็นในระบบ" maxLength={60} />
          </Form.Item>

          <Form.Item
            name="account_type"
            label="ประเภทบัญชี"
            rules={[{ required: true }]}
            extra={
              typeOptions.length && !typeOptions.some((o) => o.value === 'ADMIN')
                ? 'บัญชีแอดมินสร้างได้เฉพาะซูเปอร์แอดมิน'
                : undefined
            }
          >
            <Select
              loading={roles.isLoading}
              options={typeOptions}
              optionRender={(o) => (
                <div>
                  <div>{o.label}</div>
                  <Typography.Text type="secondary" className="text-xs">
                    {o.data.hint}
                  </Typography.Text>
                </div>
              )}
              onChange={() => form.setFieldValue('bar_id', undefined)}
            />
          </Form.Item>

          {needsBar(type) && (
            <Form.Item
              name="bar_id"
              label="ร้าน"
              rules={[{ required: true, message: 'เลือกร้าน' }]}
              extra={
                currentOwner
                  ? `ร้านนี้มีเจ้าของอยู่แล้ว (${currentOwner}) — บัญชีใหม่จะเป็นเจ้าของแทน และ ${currentOwner} จะเป็นผู้จัดการ`
                  : undefined
              }
            >
              <Select
                showSearch={{ optionFilterProp: 'label' }}
                placeholder="พิมพ์ชื่อร้าน"
                loading={bars.isLoading}
                options={barOptions}
              />
            </Form.Item>
          )}

          <Form.Item
            name="birthdate"
            label="วันเกิด"
            extra="ต้องอายุ 20 ปีขึ้นไป"
            rules={[
              { required: true, message: 'เลือกวันเกิด' },
              {
                validator: (_, d?: Dayjs) =>
                  !d || !d.isAfter(ADULT(), 'day') ? Promise.resolve() : Promise.reject(new Error('ต้องอายุ 20 ปีขึ้นไป')),
              },
            ]}
          >
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
              placeholder="วว/ดด/ปปปป (ค.ศ.)"
              maxDate={ADULT()}
              defaultPickerValue={dayjs('1995-01-01')}
            />
          </Form.Item>

          <Form.Item name="password_mode" label="รหัสผ่าน" className={passwordMode === 'manual' ? '!mb-2' : undefined}>
            <Radio.Group
              options={[
                { value: 'random', label: 'ให้ระบบสุ่ม (แสดงครั้งเดียวหลังสร้าง)' },
                { value: 'manual', label: 'ตั้งเอง' },
              ]}
            />
          </Form.Item>
          {passwordMode === 'manual' && (
            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'กรอกรหัสผ่าน' },
                { min: 10, message: 'อย่างน้อย 10 ตัว' },
                { max: 72 },
              ]}
            >
              <Input.Password placeholder="อย่างน้อย 10 ตัว" autoComplete="new-password" />
            </Form.Item>
          )}
        </Form>
      )}
    </Modal>
  );
}
