import { CheckCircle } from '@phosphor-icons/react';
import { Alert, Button, Form, Input, Spin, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { ApiError } from '@nightout/utils/rest';
import { useAdminAuth } from '@/services/adminAuth';
import { supabase } from '@/services/supabase';
import { fetchMyProfile } from './api';
import { StaffPass } from './components/staffPass';

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
  const [form] = Form.useForm<{ email: string; password: string }>();
  /** ชื่อผู้ถือบนต้นขั้วบัตร — ตามช่องอีเมลแบบสด */
  const emailLabel = (Form.useWatch('email', form) ?? '').trim().toUpperCase() || 'EMAIL ACCOUNT';
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

  const signedInEmail = auth.session?.user.email ?? '';
  const otp = (
    <Input.OTP
      length={6}
      value={code}
      onChange={(v) => setCode(v)}
      formatter={(v) => v.replace(/\D/g, '')}
      disabled={busy}
    />
  );
  const otpActions = (
    <div className="staff-pass__actions">
      <Button size="large" disabled={busy} onClick={() => void switchAccount()}>
        <span className="text-muted">ใช้บัญชีอื่น</span>
      </Button>
      <Button
        type="primary"
        size="large"
        loading={busy}
        disabled={code.length !== 6}
        onClick={onVerify}
      >
        {step === 'enroll' ? 'ยืนยันและเข้าสู่ระบบ' : 'ยืนยันรหัส'}
      </Button>
    </div>
  );

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-background p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[200px] -bottom-[300px] size-[700px] rounded-full bg-[radial-gradient(circle,rgba(167,56,245,.22),transparent_65%)]"
      />
      <StaffPass
        kicker={step === 'password' ? 'STAFF ONLY' : 'CHECKED · 1/2'}
        holder={
          step === 'password' ? (
            <span className="truncate">{emailLabel}</span>
          ) : (
            <>
              <CheckCircle weight="fill" size={18} className="shrink-0 text-crowd-available" />
              <span className="truncate">{signedInEmail}</span>
            </>
          )
        }
        title={
          step === 'password'
            ? 'เช็กอินเข้าหลังบ้าน'
            : step === 'enroll'
              ? 'ผูกแอป Authenticator'
              : 'ยืนยันตัวตนอีกขั้น'
        }
        step={step === 'password' ? 'STEP 1 / 2' : 'STEP 2 / 2'}
        stepActive={step !== 'password'}
      >
        {error && <Alert type="error" showIcon title={error} />}

        {step === 'password' && (
          <Form<{ email: string; password: string }>
            form={form}
            layout="vertical"
            requiredMark={false}
            disabled={busy}
            onFinish={onPassword}
            className="flex flex-col gap-[inherit]"
          >
            <div className="staff-pass__fields">
              <Form.Item
                name="email"
                label="อีเมล"
                className="!mb-0"
                rules={[{ required: true, type: 'email', message: 'กรอกอีเมลให้ถูกต้อง' }]}
              >
                <Input
                  autoComplete="username"
                  inputMode="email"
                  placeholder="you@nightout.co"
                  autoFocus
                />
              </Form.Item>
              <Form.Item
                name="password"
                label="รหัสผ่าน"
                className="!mb-0"
                rules={[{ required: true, message: 'กรอกรหัสผ่าน' }]}
              >
                <Input.Password autoComplete="current-password" />
              </Form.Item>
            </div>
            <Button type="primary" htmlType="submit" block size="large" loading={busy}>
              เข้าสู่ระบบ
            </Button>
            <p className="staff-pass__hint m-0 text-[13px] text-muted">
              ถัดไปจะขอรหัส 6 หลักจากแอป Authenticator
            </p>
          </Form>
        )}

        {step === 'verify' && (
          <>
            <p className="m-0 -mt-2 text-sm text-muted">ใส่รหัส 6 หลักจากแอป Authenticator</p>
            {otp}
            {otpActions}
          </>
        )}

        {step === 'enroll' && enrollment && (
          <>
            <div className="flex flex-wrap items-center gap-5">
              <img
                src={enrollment.qrCode}
                alt="QR สำหรับผูกแอป Authenticator"
                className="size-[148px] shrink-0 rounded-[10px] bg-white p-2"
              />
              <div className="flex min-w-0 flex-1 basis-56 flex-col gap-2 text-sm text-muted">
                <p className="m-0">
                  สแกน QR ในแอป Authenticator (Google, Microsoft หรือ 1Password) แล้วใส่รหัส 6
                  หลักที่แอปแสดง
                </p>
                <p className="m-0">สแกนไม่ได้? ใส่รหัสนี้ในแอปแทน</p>
                <Typography.Text
                  copyable
                  className="staff-pass__mono break-all rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px]"
                >
                  {enrollment.secret}
                </Typography.Text>
              </div>
            </div>
            {otp}
            {otpActions}
          </>
        )}
      </StaffPass>
    </div>
  );
}
