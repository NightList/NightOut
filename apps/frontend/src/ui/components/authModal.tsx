import { Eye, EyeSlash, X } from '@phosphor-icons/react';
import { App, Button, ConfigProvider, Form, Input, Modal, theme } from 'antd';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '@/services/supabase';

interface LoginForm {
  email: string;
  password: string;
}

type Provider = 'google' | 'facebook';

interface LoginModalApi {
  /** เปิด modal เข้าสู่ระบบ · next = path ที่จะไปต่อหลังล็อกอินสำเร็จ (ไม่ใส่ = อยู่หน้าเดิม) */
  open: (next?: string) => void;
}

const LoginModalContext = createContext<LoginModalApi | null>(null);

export function useLoginModal(): LoginModalApi {
  const ctx = useContext(LoginModalContext);
  if (!ctx) throw new Error('useLoginModal ต้องอยู่ใน <LoginModalProvider>');
  return ctx;
}

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" width="32" height="32" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
    <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 48 48" width="32" height="32" aria-hidden="true">
    <circle cx="24" cy="24" r="24" fill="#1877F2" />
    <path fill="#fff" d="M33.4 30.9l1.1-6.9h-6.6v-4.5c0-1.9.9-3.7 3.9-3.7h3V10s-2.7-.5-5.3-.5c-5.4 0-8.9 3.3-8.9 9.3V24h-6v6.9h6V48h7.4V30.9h5.4z" />
  </svg>
);

/** กรอบของ modal — พื้นมืดโปร่งเห็นหน้าเว็บเบลอด้านหลัง ตามดีไซน์ (เหมือนกันทั้งธีมมืด/สว่าง) */
const MODAL_STYLES = {
  mask: { background: 'rgba(0, 0, 0, 0.55)' },
  container: {
    padding: '28px 32px 24px',
    background: 'rgba(14, 14, 18, 0.88)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.75), 0 0 60px rgba(168, 85, 247, 0.18)',
    backdropFilter: 'blur(14px)',
  },
  header: {
    marginBottom: 24,
    paddingBottom: 8,
    paddingRight: 36,
    background: 'transparent',
    borderBottom: '1px solid rgba(255, 255, 255, 0.85)',
  },
} as const;

/** Provider เดียวทั้งแอป: ปุ่ม "เข้าสู่ระบบ" / route guard เรียก `useLoginModal().open()` */
export function LoginModalProvider({ children }: { children: ReactNode }) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm<LoginForm>();
  const [isOpen, setOpen] = useState(false);
  const [next, setNext] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const open = useCallback((to?: string) => {
    setNext(to);
    setOpen(true);
  }, []);
  const api = useMemo(() => ({ open }), [open]);
  const close = () => setOpen(false);

  const onFinish = async ({ email, password }: LoginForm) => {
    setLoading(true);
    try {
      // TODO: Cloudflare Turnstile → options: { captchaToken }
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) throw error;
      close();
      if (next) navigate(next, { replace: true });
    } catch {
      message.error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  const oauth = async (provider: Provider) => {
    const target = next ?? `${window.location.pathname}${window.location.search}`;
    const { error } = await supabase!.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}${target}` },
    });
    if (error) message.error('เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง');
  };

  return (
    <LoginModalContext.Provider value={api}>
      {children}
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <Modal
          open={isOpen}
          onCancel={close}
          afterClose={() => form.resetFields()}
          footer={null}
          centered
          destroyOnHidden
          width={386}
          mask={{ blur: true }}
          styles={MODAL_STYLES}
          title={
            <span className="text-2xl font-bold text-white">
              ยินดีต้อนรับสู่ Night<span className="text-[#b84dff]">Out</span>
            </span>
          }
          closeIcon={
            <span className="flex size-7 items-center justify-center rounded-full bg-white/35 text-white/90">
              <X size={16} weight="bold" />
            </span>
          }
        >
          <Form<LoginForm> form={form} layout="vertical" requiredMark={false} onFinish={onFinish}>
            <Form.Item
              name="email"
              className="!mb-5"
              rules={[{ required: true, type: 'email', message: 'กรอกอีเมลให้ถูกต้อง' }]}
            >
              <Input
                size="large"
                placeholder="กรอกอีเมลของคุณ"
                autoComplete="email"
                inputMode="email"
              />
            </Form.Item>
            <Form.Item
              name="password"
              className="!mb-1"
              rules={[{ required: true, message: 'กรอกรหัสผ่าน' }]}
            >
              <Input.Password
                size="large"
                placeholder="กรอกรหัสผ่านของคุณ"
                autoComplete="current-password"
                iconRender={(visible) =>
                  visible ? <Eye size={20} aria-label="ซ่อนรหัสผ่าน" /> : <EyeSlash size={20} aria-label="แสดงรหัสผ่าน" />
                }
              />
            </Form.Item>
            <div className="mb-6 text-right">
              <Link to="/forgot-password" onClick={close} className="text-xs !text-white/90 hover:!text-white">
                ลืมรหัสผ่าน ?
              </Link>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              shape="round"
              size="large"
              block
              loading={loading}
              className="!h-11 !border-0 !bg-[#a63cf2] hover:!bg-[#b657ff]"
            >
              เข้าสู่ระบบ
            </Button>
          </Form>

          <div className="my-3 flex items-center gap-2 text-xs text-white/90" role="separator">
            <span className="h-px flex-1 bg-white/80" />
            หรือ
            <span className="h-px flex-1 bg-white/80" />
          </div>

          <div className="flex items-center justify-center gap-5">
            <button
              type="button"
              aria-label="เข้าสู่ระบบด้วย Google"
              className="rounded-full p-1 transition-transform hover:scale-110"
              onClick={() => oauth('google')}
            >
              <GoogleIcon />
            </button>
            <button
              type="button"
              aria-label="เข้าสู่ระบบด้วย Facebook"
              className="rounded-full p-1 transition-transform hover:scale-110"
              onClick={() => oauth('facebook')}
            >
              <FacebookIcon />
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-white/90">
            ยังไม่มีบัญชี ?{' '}
            <Link to="/register" onClick={close} className="font-bold !text-[#b84dff] hover:!text-white">
              สมัครสมาชิก
            </Link>
          </p>
        </Modal>
      </ConfigProvider>
    </LoginModalContext.Provider>
  );
}
