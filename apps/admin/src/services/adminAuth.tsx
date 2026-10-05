import type { Session } from '@supabase/supabase-js';
import type { UserRole } from '@nightout/types';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Rest } from '@nightout/utils/rest';
import { supabase } from '@/services/supabase';

/**
 * Auth ของ Backoffice — ต้องเป็น ADMIN (อ่าน role จากตาราง users ไม่ใช่ user_metadata)
 * และผ่าน MFA แบบ TOTP แล้ว (Supabase AAL2) ถึงจะเข้าหน้าแอดมินได้
 */
interface AdminAuthValue {
  session: Session | null;
  role: UserRole | null;
  displayName: string | null;
  /** aal2 = ยืนยัน MFA แล้วใน session นี้ */
  aal: 'aal1' | 'aal2' | null;
  loading: boolean;
  isAdmin: boolean;
  /** เข้าหน้าแอดมินได้ = ADMIN + MFA แล้ว */
  canEnter: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

/** role + ชื่อจาก public.users ผ่าน API (GET /me/profile) — null ถ้าไม่พบ/อ่านไม่ได้ */
export async function fetchProfile(accessToken: string): Promise<{ role: string; display_name: string } | null> {
  try {
    return await Rest.get<{ id: string; role: string; display_name: string }>('/me/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    return null;
  }
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [aal, setAal] = useState<'aal1' | 'aal2' | null>(null);
  const [loading, setLoading] = useState(supabase !== null);

  // โหลด session + role + ระดับ MFA ให้เสร็จก่อน แล้วค่อยตั้ง state พร้อมกันทีเดียว
  // (ถ้าตั้ง session ก่อน หน้าอื่นจะเห็น "มี session แต่ยังไม่มี role" ชั่วขณะ)
  const load = useCallback(async (s: Session | null) => {
    if (!supabase || !s) {
      setSession(null);
      setRole(null);
      setDisplayName(null);
      setAal(null);
      setLoading(false);
      return;
    }
    const [profile, { data: level }] = await Promise.all([
      fetchProfile(s.access_token),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    setSession(s);
    setRole((profile?.role as UserRole | undefined) ?? null);
    setDisplayName((profile?.display_name as string | undefined) ?? null);
    setAal((level?.currentLevel as 'aal1' | 'aal2' | null | undefined) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => load(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      // เรียก supabase ต่อใน callback ตรง ๆ ไม่ได้ (deadlock) — เลื่อนไป tick ถัดไป
      setTimeout(() => void load(s), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [load]);

  const value = useMemo<AdminAuthValue>(
    () => ({
      session,
      role,
      displayName,
      aal,
      loading,
      isAdmin: role === 'ADMIN',
      canEnter: role === 'ADMIN' && aal === 'aal2',
      refresh: async () => {
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        await load(data.session);
      },
      signOut: async () => {
        if (supabase) await supabase.auth.signOut();
      },
    }),
    [session, role, displayName, aal, loading, load],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>');
  return ctx;
}
