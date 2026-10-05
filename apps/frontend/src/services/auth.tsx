import type { Session } from '@supabase/supabase-js';
import type { UserRole } from '@nightout/types';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useDemo } from '@/hooks/useDemo';
import { Rest } from '@nightout/utils/rest';
import { log } from '@/services/log';
import { supabase } from '@/services/supabase';
import { clearUser, currentProfile, startUser } from '@/services/sync';

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  barId?: string;
  /** เบอร์ล่าสุดที่ใช้จอง (E.164) */
  phoneE164?: string | null;
  /** ถูกระงับการจอง */
  bannedAt?: string | null;
}

interface AuthContextValue {
  /** เดิมใช้แยกโหมดเดโม — ตอนนี้ต่อ Supabase เสมอ (false ตลอด) */
  isDemo: false;
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  /** โหลดโปรไฟล์ + ข้อมูลผู้ใช้ใหม่ (เช่นหลังสมัครเป็นร้าน → role เปลี่ยน) */
  reload: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** โปรไฟล์จาก public.users ผ่าน API (GET /me/profile) — role อ่านจาก DB ไม่ใช่ user_metadata */
async function loadProfile(session: Session): Promise<AppUser | null> {
  let u: { id: string; display_name: string; role: UserRole; phone_e164?: string | null; banned_at?: string | null };
  try {
    u = await Rest.get<typeof u>('/me/profile', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
  } catch (e) {
    log.error('โหลดโปรไฟล์ไม่สำเร็จ', (e as Error).message);
    return null;
  }
  const profile = {
    id: u.id,
    email: session.user.email ?? '',
    displayName: u.display_name,
    role: u.role,
    phoneE164: u.phone_e164 ?? null,
    bannedAt: u.banned_at ?? null,
  };
  // ข้อมูลของผู้ใช้ (การจอง แจ้งเตือน ร้านของฉัน …) โหลดให้เสร็จก่อนเปิดหน้าที่ต้องล็อกอิน
  const { barId } = await startUser(profile).catch((e: Error) => {
    log.error('โหลดข้อมูลผู้ใช้ไม่สำเร็จ', e.message);
    return { barId: undefined };
  });
  return { ...profile, barId };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  useDemo();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(supabase !== null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  /** โหลดโปรไฟล์ของ user id ไหนเสร็จแล้ว (สำเร็จหรือไม่ก็ตาม) */
  const [profileLoadedFor, setProfileLoadedFor] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const userId = session?.user.id;

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId || !session) {
      if (currentProfile()) clearUser();
      return;
    }
    let cancelled = false;
    void loadProfile(session)
      .then((p) => !cancelled && setProfile(p))
      .finally(() => !cancelled && setProfileLoadedFor(`${userId}:${version}`));
    return () => {
      cancelled = true;
    };
    // session object เปลี่ยนทุกครั้งที่ต่ออายุ token — โหลดใหม่เฉพาะเมื่อเปลี่ยนผู้ใช้ / สั่ง reload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, version]);

  // มี session แล้วแต่โปรไฟล์ยังไม่มา = ยังโหลดอยู่ (กัน RequireAuth เด้งไป /login ระหว่างรอ)
  const loading = sessionLoading || (!!userId && profileLoadedFor !== `${userId}:${version}`);

  const value = useMemo<AuthContextValue>(
    () => ({
      isDemo: false,
      user: session && profile && profile.id === session.user.id ? profile : null,
      session,
      loading,
      signOut: async () => {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        clearUser();
      },
      reload: async () => {
        setVersion((v) => v + 1);
      },
    }),
    [session, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
