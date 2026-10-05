import type { Db } from '@nightout/types';
import { Button, Form, Input, Modal } from 'antd';
import { useEffect } from 'react';
import { useAdminAction } from '@/services/adminData';

interface Values {
  display_name: string;
  email: string;
  phone_e164?: string;
  password?: string;
}

export function EditUserModal({
  open,
  user,
  onClose,
}: {
  open: boolean;
  user: Db.AdminUser | null;
  onClose: () => void;
}) {
  const [form] = Form.useForm<Values>();
  const act = useAdminAction();

  useEffect(() => {
    if (open && user) {
      form.setFieldsValue({ display_name: user.display_name, email: user.email });
    }
  }, [open, user, form]);

  const submit = async () => {
    if (!user) return;
    try {
      const v = await form.validateFields();
      await act.mutateAsync({
        method: 'PATCH',
        path: `users/${user.id}`,
        body: {
          display_name: v.display_name.trim(),
          email: v.email.trim(),
          phone_e164: v.phone_e164?.trim() || null,
          ...(v.password ? { password: v.password } : {}),
        },
        success: `บันทึกบัญชี ${v.display_name.trim()} แล้ว`,
      });
      onClose();
    } catch {
      // useAdminAction displays the API error and keeps the form open.
    }
  };

  return (
    <Modal
      open={open}
      title={`แก้ไขบัญชี ${user?.display_name ?? ''}`}
      onCancel={onClose}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onClose}>ยกเลิก</Button>,
        <Button key="submit" type="primary" loading={act.isPending} onClick={() => void submit()}>
          บันทึก
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" disabled={act.isPending}>
        <Form.Item name="display_name" label="ชื่อที่แสดง" rules={[{ required: true, message: 'กรอกชื่อที่แสดง' }]}>
          <Input maxLength={60} />
        </Form.Item>
        <Form.Item name="email" label="อีเมล" rules={[{ required: true }, { type: 'email', message: 'อีเมลไม่ถูกต้อง' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="phone_e164" label="เบอร์โทรศัพท์" rules={[{ pattern: /^\+?[1-9][0-9]{7,14}$/, message: 'ใช้รูปแบบ +66812345678' }]}>
          <Input placeholder="+66812345678" />
        </Form.Item>
        <Form.Item name="password" label="รหัสผ่านใหม่" extra="เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน" rules={[{ min: 10, message: 'อย่างน้อย 10 ตัวอักษร' }]}>
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
