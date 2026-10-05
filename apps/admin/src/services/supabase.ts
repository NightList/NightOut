import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * ใช้เฉพาะ Supabase Auth (เข้าสู่ระบบ + MFA) — ADR 0002
 * ห้ามใช้ .from() / .rpc() / .storage → อ่าน/เขียนข้อมูลผ่าน Rest (@nightout/utils/rest) เท่านั้น
 * null เมื่อยังไม่ได้ตั้งค่า .env — Backoffice จะแสดงหน้าให้ตั้งค่าแทน
 */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, { auth: { persistSession: true, storageKey: 'nightout-admin-auth' } })
    : null;

export const isSupabaseConfigured = supabase !== null;
