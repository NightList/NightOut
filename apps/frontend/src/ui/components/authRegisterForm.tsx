import { App, Button, Checkbox, DatePicker, Form, Input } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '@/services/supabase';

interface RegisterValues {
  displayName: string;
  email: string;
  password: string;
  confirm: string;
  birthdate: Dayjs;
  accept: boolean;
}

/** ฟอร์มสมัครสมาชิกใน AuthModal (Supabase signUp → trigger สร้าง public.users) */
export function AuthRegisterForm({
  onNavigate,
  onSwitch,
}: {
  onNavigate: () => void;
  onSwitch: () => void;
}) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const max = dayjs().subtract(20, 'year');

  const onFinish = async (v: RegisterValues) => {
    setLoading(true);
    try {
      const { data, error } = await supabase!.auth.signUp({
        email: v.email,
        password: v.password,
        options: {
          emailRedirectTo: `${location.origin}/onboarding`,
          data: {
            display_name: v.displayName,
            birthdate: v.birthdate.format('YYYY-MM-DD'),
            terms_version: 'v1',
            privacy_version: 'v1',
          },
        },
      });
      if (error) throw error;
      onNavigate();
      // ถ้าปิด "Confirm email" ใน Supabase จะได้ session ทันที → ไปต่อได้เลย ไม่ต้องรออีเมล
      if (data.session) navigate('/onboarding');
      else navigate(`/verify-email?email=${encodeURIComponent(v.email)}`);
    } catch (e) {
      message.error((e as Error).message || 'สมัครไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Form<RegisterValues> layout="vertical" size="large" requiredMark={false} onFinish={onFinish}>
        <Form.Item name="displayName" className="!mb-4" rules={[{ required: true, max: 60, message: 'กรอกชื่อที่แสดง' }]}>
          <Input placeholder="ชื่อที่แสดง" autoComplete="nickname" />
        </Form.Item>
        <Form.Item
          name="email"
          className="!mb-4"
          rules={[{ required: true, type: 'email', message: 'กรอกอีเมลให้ถูกต้อง' }]}
        >
          <Input placeholder="กรอกอีเมลของคุณ" autoComplete="email" inputMode="email" />
        </Form.Item>
        <div className="grid gap-x-3 sm:grid-cols-2">
        <Form.Item
          name="password"
          className="!mb-4"
          rules={[{ required: true, min: 10, message: 'อย่างน้อย 10 ตัว' }]}
        >
          <Input.Password placeholder="รหัสผ่าน (10 ตัวขึ้นไป)" autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirm"
          className="!mb-4"
          dependencies={['password']}
          rules={[
            { required: true, message: 'ยืนยันรหัสผ่าน' },
            ({ getFieldValue }) => ({
              validator: (_, v) =>
                v === getFieldValue('password')
                  ? Promise.resolve()
                  : Promise.reject(new Error('รหัสผ่านไม่ตรงกัน')),
            }),
          ]}
        >
          <Input.Password placeholder="ยืนยันรหัสผ่าน" autoComplete="new-password" />
        </Form.Item>
        </div>
        <Form.Item
          name="birthdate"
          className="!mb-4"
          rules={[{ required: true, message: 'ต้องระบุวันเกิด' }]}
          extra={<span className="text-xs text-white/70">ต้องอายุ 20 ปีขึ้นไป</span>}
        >
          <DatePicker
            className="w-full"
            placeholder="วันเกิด"
            defaultPickerValue={max}
            disabledDate={(d) => d.isAfter(max)}
            format="D MMM YYYY"
          />
        </Form.Item>
        <Form.Item
          name="accept"
          className="!mb-5"
          valuePropName="checked"
          rules={[
            {
              validator: (_, v) =>
                v ? Promise.resolve() : Promise.reject(new Error('ต้องยอมรับก่อนสมัคร')),
            },
          ]}
        >
          <Checkbox>
            <span className="text-xs">
              ยอมรับ{' '}
              <Link to="/terms" onClick={onNavigate} className="!text-[#b84dff]">
                เงื่อนไขการใช้งาน
              </Link>{' '}
              และ{' '}
              <Link to="/privacy" onClick={onNavigate} className="!text-[#b84dff]">
                นโยบายความเป็นส่วนตัว
              </Link>
            </span>
          </Checkbox>
        </Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          shape="round"
          block
          loading={loading}
          className="!h-11 !border-0 !bg-[#a63cf2] hover:!bg-[#b657ff]"
        >
          สมัครสมาชิก
        </Button>
      </Form>

      <p className="mt-6 text-center text-xs text-white/90">
        มีบัญชีแล้ว ?{' '}
        <button type="button" onClick={onSwitch} className="font-bold text-[#b84dff] hover:text-white">
          เข้าสู่ระบบ
        </button>
      </p>
    </>
  );
}
