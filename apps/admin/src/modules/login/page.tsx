import { ShieldStar } from '@phosphor-icons/react';
import { Alert, Button, Card, Form, Input, Spin, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { ApiError } from '@nightout/utils/rest';
import { fetchMyProfile } from '@/services/api/account';
import { useAdminAuth } from '@/services/adminAuth';
import { supabase } from '@/services/supabase';

type Step = 'password' | 'verify' | 'enroll';

interface Enrollment {
  factorId: string;
  qrCode: string; // SVG data URL จาก Supabase
  secret: string;
}

const ISSUER = 'NightOut Admin';

function toThai(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  if (/email not confirmed/i.test(message)) return 'บัญชีนี้ยังไม่ได้ยืนยันอีเมล';
  if (/invalid totp|code|expired/i.test(message))
    return 'รหัส 6 หลักไม่ถูกต้องหรือหมดเวลาแล้ว ใช้รหัสล่าสุดจากแอปแล้วลองอีกครั้ง';
  if (/rate limit|too many/i.test(message)) return 'ลองหลายครั้งเกินไป รอสักครู่แล้วลองใหม่';
  return message;
}

/**
 * Admin login — อีเมล + รหัสผ่าน (Supabase Auth) → ตรวจ role = ADMIN จากตาราง users
 * → MFA แบบ TOTP (ครั้งแรกให้ผูกแอป Authenticator ก่อน) → AAL2 แล้วค่อยเข้า Backoffice
 */
export function LoginPage() {
  const navigate = useNavigate();
  const auth = useAdminAuth();
  const [step, setStep] = useState<Step>('password');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState('');
  /** กันเริ่มขั้น MFA ซ้ำ (จากปุ่มเข้าสู่ระบบ + จาก session ที่มีอยู่แล้ว พร้อมกัน) */
  const mfaStarted = useRef(false);

  /** ไปขั้น MFA: มีแอปผูกไว้แล้ว → ใส่รหัส · ยังไม่มี → สร้าง QR ให้สแกน */
  const startMfa = async () => {
    if (!supabase || mfaStarted.current) return;
    mfaStarted.current = true;
    const { data, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) throw listError;
    const verified = data.totp[0];
    if (verified) {
      setFactorId(verified.id);
      setStep('verify');
      return;
    }
    // ล้างการผูกที่ค้างไว้ (สแกนแล้วไม่ได้ยืนยัน) ก่อนสร้างใหม่
    for (const f of data.all.filter((x) => x.factor_type === 'totp' && x.status === 'unverified')) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: ISSUER,
      issuer: ISSUER,
    });
    if (enrollError) throw enrollError;
    setFactorId(enrolled.id);
    setEnrollment({
      factorId: enrolled.id,
      qrCode: enrolled.totp.qr_code,
      secret: enrolled.totp.secret,
    });
    setStep('enroll');
  };

  // เปิดหน้ามาแล้วยังมี session ของแอดมินที่ยังไม่ผ่าน MFA (เช่นรีเฟรชหน้า) → ไปขั้น MFA ต่อเลย
  useEffect(() => {
    if (auth.loading || busy || step !== 'password') return;
    if (auth.session && auth.isAdmin && auth.aal === 'aal1') {
      // เริ่มใน microtask ถัดไป (ไม่ setState ระหว่าง effect)
      void Promise.resolve()
        .then(startMfa)
        .catch((e: unknown) => {
          mfaStarted.current = false;
          setError(toThai((e as Error).message));
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.loading, auth.session, auth.isAdmin, auth.aal]);

  if (auth.loading) return <Spin fullscreen />;
  if (auth.canEnter) return <Navigate to="/" replace />;

  const onPassword = async (v: { email: string; password: string }) => {
    if (!supabase) return;
    setBusy(true);
    setError(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: v.email.trim(),
        password: v.password,
      });
      if (signInError) throw signInError;
      // แยก 2 กรณี: "API อ่านโปรไฟล์ไม่ได้" (backend/DB มีปัญหา) กับ "ชั้นบัญชีเข้าหลังบ้านไม่ได้" — เดิมรวมเป็นข้อความเดียวจนดูเหมือนเรื่องสิทธิ์ทั้งที่จริงคือ API ล่ม
      let profile;
      try {
        profile = await fetchMyProfile(data.session.access_token);
      } catch (e) {
        await supabase.auth.signOut();
        const detail = e instanceof ApiError ? `${e.status} · ${e.code}` : (e as Error).message;
        setError(`ล็อกอินผ่านแล้ว แต่อ่านข้อมูลบัญชีจากเซิร์ฟเวอร์ไม่ได้ (${detail}) — ไม่ใช่เรื่องสิทธิ์ ให้ตรวจ API / Supabase`);
        return;
      }
      if (!profile.can_enter_backoffice) {
        await supabase.auth.signOut();
        setError(`บัญชีนี้เป็นชั้น "${profile.role_label}" ซึ่งเข้า Backoffice ไม่ได้`);
        return;
      }
      await startMfa();
    } catch (e) {
      mfaStarted.current = false;
      setError(toThai((e as Error).message));
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async () => {
    if (!supabase || !factorId || code.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (verifyError) throw verifyError;
      await auth.refresh();
      navigate('/', { replace: true });
    } catch (e) {
      setError(toThai((e as Error).message));
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const switchAccount = async () => {
    await auth.signOut();
    mfaStarted.current = false;
    setStep('password');
    setEnrollment(null);
    setFactorId(null);
    setCode('');
    setError(null);
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-background p-4">
      <Card
        className="w-full max-w-md"
        title={
          <span className="flex items-center gap-2">
            <ShieldStar className="text-gold" /> NightOut Backoffice
          </span>
        }
      >
        {error && <Alert className="!mb-4" type="error" showIcon title={error} />}

        {step === 'password' && (
          <Form<{ email: string; password: string }>
            layout="vertical"
            requiredMark={false}
            disabled={busy}
            onFinish={onPassword}
          >
            <Form.Item
              name="email"
              label="อีเมล"
              rules={[{ required: true, type: 'email', message: 'กรอกอีเมลให้ถูกต้อง' }]}
            >
              <Input autoComplete="username" inputMode="email" autoFocus />
            </Form.Item>
            <Form.Item
              name="password"
              label="รหัสผ่าน"
              rules={[{ required: true, message: 'กรอกรหัสผ่าน' }]}
            >
              <Input.Password autoComplete="current-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={busy}>
              เข้าสู่ระบบ
            </Button>
          </Form>
        )}

        {step === 'enroll' && enrollment && (
          <div className="flex flex-col gap-4">
            <Typography.Paragraph className="!mb-0">
              ครั้งแรกต้องผูกแอป Authenticator (Google Authenticator, Microsoft Authenticator หรือ
              1Password) — สแกน QR นี้ในแอป แล้วใส่รหัส 6 หลักที่แอปแสดง
            </Typography.Paragraph>
            <img
              src={enrollment.qrCode}
              alt="QR สำหรับผูกแอป Authenticator"
              className="mx-auto size-48 rounded-lg bg-white p-2"
            />
            <Typography.Text type="secondary" className="text-center text-sm">
              สแกนไม่ได้? ใส่รหัสนี้ในแอปแทน{' '}
              <Typography.Text code copyable>
                {enrollment.secret}
              </Typography.Text>
            </Typography.Text>
          </div>
        )}

        {(step === 'verify' || step === 'enroll') && (
          <div className="mt-4 flex flex-col gap-4">
            {step === 'verify' && (
              <Typography.Paragraph className="!mb-0">
                ใส่รหัส 6 หลักจากแอป Authenticator
              </Typography.Paragraph>
            )}
            <div className="flex justify-center">
              <Input.OTP
                length={6}
                value={code}
                onChange={(v) => setCode(v)}
                formatter={(v) => v.replace(/\D/g, '')}
                disabled={busy}
              />
            </div>
            <Button
              type="primary"
              block
              size="large"
              loading={busy}
              disabled={code.length !== 6}
              onClick={onVerify}
            >
              {step === 'enroll' ? 'ยืนยันและเข้าสู่ระบบ' : 'ยืนยันรหัส'}
            </Button>
            <Button type="text" block disabled={busy} onClick={() => void switchAccount()}>
              ใช้บัญชีอื่น
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
