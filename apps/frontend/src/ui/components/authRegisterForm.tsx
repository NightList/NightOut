import { CalendarBlank, EnvelopeSimple, Lock, UserCircle } from '@phosphor-icons/react';
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

/** ความแข็งแรงรหัสผ่าน 0–4 (ยาว ≥10 · ตัวพิมพ์เล็ก+ใหญ่ · ตัวเลข · อักขระพิเศษ) แสดงเป็นแถบใต้ช่อง */
function passwordStrength(pw: string): number {
  if (!pw) return 0;
  return [
    pw.length >= 10,
    /[a-z]/.test(pw) && /[A-Z]/.test(pw),
    /\d/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
  ].filter(Boolean).length;
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
  const [form] = Form.useForm<RegisterValues>();
  const strength = passwordStrength(Form.useWatch('password', form) ?? '');

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
      <Form<RegisterValues> form={form} layout="vertical" size="large" requiredMark={false} onFinish={onFinish}>
        <Form.Item
          name="displayName"
          label="ชื่อที่แสดง"
          className="!mb-4"
          rules={[{ required: true, max: 60, message: 'กรอกชื่อที่แสดง' }]}
        >
          <Input prefix={<UserCircle size={18} />} placeholder="ชื่อเล่นของคุณ" autoComplete="nickname" />
        </Form.Item>
        <Form.Item
          name="email"
          label="อีเมล"
          className="!mb-4"
          rules={[{ required: true, type: 'email', message: 'กรอกอีเมลให้ถูกต้อง' }]}
        >
          <Input
            prefix={<EnvelopeSimple size={18} />}
            placeholder="you@email.com"
            autoComplete="email"
            inputMode="email"
          />
        </Form.Item>
        <div className="grid gap-x-3 sm:grid-cols-2">
        <Form.Item
          name="password"
          label="รหัสผ่าน"
          className="!mb-2"
          rules={[{ required: true, min: 10, message: 'อย่างน้อย 10 ตัว' }]}
        >
          <Input.Password prefix={<Lock size={18} />} placeholder="10 ตัวขึ้นไป" autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirm"
          label="ยืนยันรหัสผ่าน"
          className="!mb-2"
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
          <Input.Password prefix={<Lock size={18} />} placeholder="อีกครั้ง" autoComplete="new-password" />
        </Form.Item>
        </div>
        <div className="mb-4 grid grid-cols-4 gap-1.5" role="presentation">
          {[1, 2, 3, 4].map((n) => (
            <span
              key={n}
              className={`h-[3px] rounded-full transition-colors ${n <= strength ? 'bg-[#e8b64c]' : 'bg-white/15'}`}
            />
          ))}
        </div>
        <Form.Item
          name="birthdate"
          label="วันเกิด"
          className="!mb-4"
          rules={[{ required: true, message: 'ต้องระบุวันเกิด' }]}
          extra={<span className="text-xs text-white/60">ต้องอายุ 20 ปีขึ้นไป</span>}
        >
          <DatePicker
            className="w-full"
            suffixIcon={null}
            prefix={<CalendarBlank size={18} className="text-white/60" />}
            placeholder="เลือกวันเกิด"
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
              <Link to="/terms" onClick={onNavigate} className="!text-[#c79bff]">
                เงื่อนไขการใช้งาน
              </Link>{' '}
              และ{' '}
              <Link to="/privacy" onClick={onNavigate} className="!text-[#c79bff]">
                นโยบายความเป็นส่วนตัว
              </Link>
            </span>
          </Checkbox>
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading} className="btn-gold">
          สมัครสมาชิก
        </Button>
      </Form>

      <p className="mt-5 text-center text-xs text-white/80">
        มีบัญชีแล้ว?{' '}
        <button type="button" onClick={onSwitch} className="font-bold text-[#c79bff] hover:text-white">
          เข้าสู่ระบบ
        </button>
      </p>
    </>
  );
}
