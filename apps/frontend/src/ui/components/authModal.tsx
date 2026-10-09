import { X } from '@phosphor-icons/react';
import { ConfigProvider, Modal, theme } from 'antd';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { AuthLoginForm } from './authLoginForm';
import { AuthRegisterForm } from './authRegisterForm';

type AuthView = 'login' | 'register';

interface AuthModalApi {
  /** เปิด modal เข้าสู่ระบบ · next = path ที่จะไปต่อหลังล็อกอินสำเร็จ (ไม่ใส่ = อยู่หน้าเดิม) */
  openLogin: (next?: string) => void;
  /** เปิด modal สมัครสมาชิก */
  openRegister: () => void;
}

const AuthModalContext = createContext<AuthModalApi | null>(null);

export function useAuthModal(): AuthModalApi {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal ต้องอยู่ใน <AuthModalProvider>');
  return ctx;
}

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

const TITLES: Record<AuthView, string> = {
  login: 'ยินดีต้อนรับสู่ ',
  register: 'สมัครสมาชิก ',
};

/** Provider เดียวทั้งแอป: ปุ่ม "เข้าสู่ระบบ" / route guard เรียก `useAuthModal().openLogin()` */
export function AuthModalProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [isOpen, setOpen] = useState(false);
  const [view, setView] = useState<AuthView>('login');
  const [next, setNext] = useState<string | undefined>();

  const openLogin = useCallback((to?: string) => {
    setNext(to);
    setView('login');
    setOpen(true);
  }, []);
  const openRegister = useCallback(() => {
    setView('register');
    setOpen(true);
  }, []);
  const api = useMemo(() => ({ openLogin, openRegister }), [openLogin, openRegister]);
  const close = () => setOpen(false);

  return (
    <AuthModalContext.Provider value={api}>
      {children}
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <Modal
          open={isOpen}
          onCancel={close}
          footer={null}
          centered
          destroyOnHidden
          width={386}
          mask={{ blur: true }}
          styles={MODAL_STYLES}
          title={
            <span className="text-2xl font-bold text-white">
              {TITLES[view]}Night<span className="text-[#b84dff]">Out</span>
            </span>
          }
          closeIcon={
            <span className="flex size-7 items-center justify-center rounded-full bg-white/35 text-white/90">
              <X size={16} weight="bold" />
            </span>
          }
        >
          {view === 'login' ? (
            <AuthLoginForm
              next={next}
              onDone={() => {
                close();
                if (next) navigate(next, { replace: true });
              }}
              onNavigate={close}
              onSwitch={() => setView('register')}
            />
          ) : (
            <AuthRegisterForm onNavigate={close} onSwitch={() => setView('login')} />
          )}
        </Modal>
      </ConfigProvider>
    </AuthModalContext.Provider>
  );
}
